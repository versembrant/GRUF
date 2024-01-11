import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Session, getCurrentSession, setCurrentSession } from "../sessionManager";
import { socket } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";

const sessionElement = document.getElementsByTagName('session')[0];
const selectorEstacio = document.getElementById('selectorEstacio');

// Carrega les dades de sessió
const onSessionDataLoaded = () => {
    const currentSession = getCurrentSession();
    console.log('Set currentSession', currentSession);
    const isMasterAudioEngine = currentSession.localMode || currentSession.rawData.connected_users.length <= 1;
    getAudioGraphInstance().isMasterAudioEngine = isMasterAudioEngine;
    masterEngineCheckbox.checked = getAudioGraphInstance().isMasterAudioEngine;
    renderEstacions();
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
        setCurrentSession(new Session(data, localMode));
        onSessionDataLoaded();
    });
    socket.on('update_session_parameter', function (data) {
        if ((getCurrentSession() !== undefined) && (data.session_id === getCurrentSession().getID())) {
            getCurrentSession().updateParametreEstacio(data.nom_estacio, data.nom_parametre, data.valor);
        }
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

// Audio
const startAudioButton = document.getElementById('startAudio');
const stopAudioButton = document.getElementById('stopAudio');
const masterEngineCheckbox = document.getElementById('masterAudioEngine');

masterEngineCheckbox.addEventListener('change', (event) => {
    getAudioGraphInstance().isMasterAudioEngine = masterEngineCheckbox.checked;
})

startAudioButton.addEventListener('click', async (event) => {
    await getAudioGraphInstance().startAudioContext();
    if ((getCurrentSession() !== undefined && (!getAudioGraphInstance().graphIsBuilt))) {
        // Only build audio graph the first time "play" is pressed
        getAudioGraphInstance().buildAudioGraph();  
    }
    getAudioGraphInstance().transportStart();
});

stopAudioButton.addEventListener('click', (event) => {
    getAudioGraphInstance().transportStop();
});
