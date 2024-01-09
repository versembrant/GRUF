import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Session, getCurrentSession, setCurrentSession } from "../sessionManager";
import { getEstacioHelperInstance } from "../estacions";
import { socket } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";

const sessionElement = document.getElementsByTagName('session')[0];
const selectorEstacio = document.getElementById('selectorEstacio');

// Carrega les dades de sessió
const onSessionDataLoaded = () => {
    console.log('Set currentSession', getCurrentSession());
    renderEstacions();
}

const localMode = sessionElement.dataset.localMode === 'true';
const sessionUUID = sessionElement.dataset.uuid;
if (localMode){
    // In local mode, session data is passed directly and server is not involved
    const sessionData = JSON.parse(sessionElement.dataset.data);
    setCurrentSession(new Session(sessionData, localMode)); 
    onSessionDataLoaded();
} else {
    // In remote mode, all session updates go through the server and come from the server
    socket.on('connect', function() {
        const username = (Math.random() + 1).toString(36).substring(7);
        socket.emit('join_session', {session_uuid: sessionUUID, username: username})
    });
    socket.on('set_session_data', function (data) {
        setCurrentSession(new Session(data, localMode)); 
        onSessionDataLoaded();
    });
    socket.on('update_session_parameter', function (data) {
        if ((getCurrentSession() !== undefined) && (data.session_uuid === getCurrentSession().uuid)) {
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
    const estacioObj = getCurrentSession().getEstacio(nomEstacio);
    const estacioHelper = getEstacioHelperInstance(estacioObj.tipus)
    createRoot(estacioReactRoot).render(
        createElement(StrictMode, null, createElement(estacioHelper.getUserInterface(), {nomEstacio: nomEstacio, estacioObj: estacioObj}))
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
