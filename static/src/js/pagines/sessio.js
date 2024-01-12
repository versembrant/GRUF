import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Session, getCurrentSession, setCurrentSession } from "../sessionManager";
import { socket, renderReactComponentInElement } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import { AudioTransportControls } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { AudioMixerEstacions } from "../components/audioMixerEstacions";

const sessionElement = document.getElementsByTagName('session')[0];
const selectorEstacio = document.getElementById('selectorEstacio');

// Carrega les dades de sessió
const onSessionDataLoaded = () => {
    // Configure some session-related things of the audio graph
    const currentSession = getCurrentSession();
    const isMasterAudioEngine = currentSession.localMode || currentSession.rawData.connected_users.length <= 1;
    getAudioGraphInstance().setMasterAudioEngine(isMasterAudioEngine);
    getAudioGraphInstance().setBpm(currentSession.rawData.bpm);
    getAudioGraphInstance().setGainsEstacions(currentSession.rawData.gainsEstacions);

    // Render UI
    renderReactComponentInElement(SessionConnectedUsers, 'sessionConnectedUsers')
    renderReactComponentInElement(AudioTransportControls, 'audioTransportControls')
    renderReactComponentInElement(AudioMixerEstacions, 'audioMixerEstacions')
    renderEstacions();

    // Some log statements useful for debugging
    console.log(getCurrentSession());
    console.log(getAudioGraphInstance());
}

const localMode = sessionElement.dataset.local === 'true';
const sessionID = sessionElement.dataset.id;
if (localMode){
    // In local mode, session data is passed directly and server is not involved
    const sessionData = JSON.parse(sessionElement.dataset.data);
    setCurrentSession(new Session(sessionData, localMode)); 
    setTimeout(onSessionDataLoaded, 100)  // Use timeout here to give the app some time to initialize stuff. TODO: find a better way to do this
} else {
    // In remote mode, all session updates go through the server and come from the server
    socket.on('connect', function() {
        socket.emit('join_session', {session_id: sessionID})
    });
    socket.on('set_session_data', function (data) {
        console.log('Session data received', data);
        setCurrentSession(new Session(data, localMode));
        onSessionDataLoaded();
    });
}

// Render UI estacions
const renderEstacio = (nomEstacio) => {
    const estacioElement = document.getElementById('estacio-' + nomEstacio);
    const estacioReactRoot = document.createElement('div');
    estacioReactRoot.className = 'estacio';
    estacioElement.innerHTML = '';
    estacioElement.appendChild(estacioReactRoot);
    const estacio = getCurrentSession().getEstacio(nomEstacio);
    createRoot(estacioReactRoot).render(
        createElement(StrictMode, null, createElement(estacio.getUserInterface(), null))
    );
}

const renderEstacions = () => {
    const selectOptionValue = selectorEstacio.value;
    getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
        if ((selectOptionValue === 'all') || (nomEstacio === selectOptionValue)) {
            renderEstacio(nomEstacio);
        } else {
            const estacioElement = document.getElementById('estacio-' + nomEstacio);
            estacioElement.innerHTML = '';
        }
    });
}

// Bind events selector estació
selectorEstacio.addEventListener('change', (event) => {
    renderEstacions();
});