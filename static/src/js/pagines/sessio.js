import { Session, getCurrentSession, setCurrentSession, updateCurrentSessionWithNewData, shouldSaveSessionAfterLoad } from "../sessionManager";
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

    const isMasterAudioEngine = currentSession.localMode || sessionElement.dataset.masterAudioEngine === 'true';
    getAudioGraphInstance().setMasterAudioEngine(isMasterAudioEngine);

    if (currentSession.rawData.tonality) { 
        getAudioGraphInstance().setTonality(currentSession.rawData.tonality);
    }
    if (currentSession.rawData.bpm) { 
        getAudioGraphInstance().setBpm(currentSession.rawData.bpm);
    }
    if (currentSession.rawData.swing) { 
        getAudioGraphInstance().setSwing(currentSession.rawData.swing);
    }
    if (currentSession.rawData.compas) { 
        getAudioGraphInstance().setCompas(currentSession.rawData.compas);
    }

    if (currentSession.rawData.effectParameters) { 
        // Only set parameters in store if there are any in the session. This is for compatibility with older sessions
        getAudioGraphInstance().setEffectParameters(currentSession.rawData.effectParameters);
    }

    if (getAudioGraphInstance().isGraphBuilt()) {
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

    // Save the session data to the server if needed
    // This will only be if the loaded session did not have initial values for some of the parameters
    // of the estacions. This can happen if we're loading an older session with a newer version of an
    // estació that has more parameters.
    if (shouldSaveSessionAfterLoad()){
        getCurrentSession().saveDataInServer();
    }
    
    // Render UI
    reactRoot = renderReactComponentInElement(Sessio, 'root', {}, reactRoot)
}

const onSessionDataReceived = (data, localMode, token) => {
    if (getCurrentSession() === undefined){
        // If no session was ever loaded, just create the new session object
        setCurrentSession(new Session(data, localMode, token)); 
    } else {
        // If a session was already loaded, update all its state from the new data without
        // recreating objects
        updateCurrentSessionWithNewData(data);
    }
}

const localMode = sessionElement.dataset.local === 'true';
const token = sessionElement.dataset.token;
const sessionID = sessionElement.dataset.id;
if (localMode){
    // In local mode, session data is passed directly and server is not involved
    const data = JSON.parse(sessionElement.dataset.data);
    onSessionDataReceived(data, localMode, token);
    setTimeout(onSessionDataLoaded, 100)  // Use timeout here to give the app some time to initialize stuff. TODO: find a better way to do this
} else {
    // For some reason, sometimes the ws connection is not properly set and no session data
    // is recieved the first time the session is loaded. Using this interval we'll keep
    // on retrying until it succeeds.
    checkLoadedCorrectlyInterval = setInterval(() => {
        location.reload();
    }, 4000)

    // In remote mode, all session updates go through the server and come from the server
    joinSessionInServer(sessionID, (data) => {
        clearInterval(checkLoadedCorrectlyInterval);
        console.log('Session data received', data);
        onSessionDataReceived(data, localMode, token);
        onSessionDataLoaded();
    });
}

