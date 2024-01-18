import { Session, getCurrentSession, setCurrentSession } from "../sessionManager";
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
    getAudioGraphInstance().setGainsEstacions(currentSession.rawData.gainsEstacions);

    // Some log statements useful for debugging
    console.log(getCurrentSession());
    console.log(getAudioGraphInstance());

    // Render UI
    reactRoot = renderReactComponentInElement(Sessio, 'sessioUIRoot', {}, reactRoot)
}

const localMode = sessionElement.dataset.local === 'true';
const sessionID = sessionElement.dataset.id;
if (localMode){
    // In local mode, session data is passed directly and server is not involved
    const sessionData = JSON.parse(sessionElement.dataset.data);
    setCurrentSession(new Session(sessionData, localMode)); 
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
        setCurrentSession(new Session(data, localMode));
        onSessionDataLoaded();
    });
}

