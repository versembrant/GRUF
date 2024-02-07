import { Session, getCurrentSession, setCurrentSession, updateCurrentSessionWithNewData } from "../sessionManager";
import { joinSessionInServer } from "../serverComs";
import { renderReactComponentInElement } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import { Sessio } from "../components/sessio";

const sessionElement = document.getElementsByTagName('session')[0];
let checkLoadedCorrectlyInterval = undefined;
let reactRoot = undefined;

// Carrega les dades de sessió
const onSessionDataLoaded = () => {
    sessionElement.dataset.loaded = true;

    // Configure some session-related things of the audio graph
    const currentSession = getCurrentSession();
    const isMasterAudioEngine = currentSession.localMode || currentSession.rawData.connected_users.length <= 1;
    getAudioGraphInstance().setMasterAudioEngine(isMasterAudioEngine);
    getAudioGraphInstance().setBpm(currentSession.rawData.bpm);
    getCurrentSession().liveSetGainsEstacions(currentSession.rawData.live.gainsEstacions);
    getCurrentSession().liveSetPresetsEstacions(currentSession.rawData.live.presetsEstacions);
    if (getAudioGraphInstance().graphIsBuilt()) {
        // Si el graph ja està construït, vol dir que estem rebent info nova d'una sessió que
        // ja està carregada. El que fem és re-carregar l'estat a l'audio graph
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            estacio.updateAudioGraphFromState(estacio.getCurrentLivePreset())
        })
    }

    // Some log statements useful for debugging
    console.log(getCurrentSession());
    console.log(getAudioGraphInstance());

    // Render UI
    reactRoot = renderReactComponentInElement(Sessio, 'root', {}, reactRoot)
}

const onSessionDataReceived = (data, localMode) => {
    if (getCurrentSession() === undefined){
        // If no session was ever loaded, just create the new session object
        setCurrentSession(new Session(data, localMode)); 
    } else {
        // If a session was already loaded, update all its state from the new data without
        // recreating objects
        updateCurrentSessionWithNewData(data);
    }
}

const localMode = sessionElement.dataset.local === 'true';
const sessionID = sessionElement.dataset.id;
if (localMode){
    // In local mode, session data is passed directly and server is not involved
    const data = JSON.parse(sessionElement.dataset.data);
    onSessionDataReceived(data, localMode);
    setTimeout(onSessionDataLoaded, 100)  // Use timeout here to give the app some time to initialize stuff. TODO: find a better way to do this
} else {
    // For some reason, sometimes the ws connection is not properly set and no session data
    // is recieved the first time the session is loaded. Using this interval we'll keep
    // on retrying until it succeeds.
    checkLoadedCorrectlyInterval = setInterval(() => {
        location.reload();
    }, 2000)

    // In remote mode, all session updates go through the server and come from the server
    joinSessionInServer(sessionID, (data) => {
        clearInterval(checkLoadedCorrectlyInterval);
        console.log('Session data received', data);
        onSessionDataReceived(data, localMode);
        onSessionDataLoaded();
    });
}

