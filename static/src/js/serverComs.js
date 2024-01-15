import { io } from 'socket.io-client';
import { getCurrentSession } from './sessionManager';
import { getAudioGraphInstance } from './audioEngine';

// Initialize socket
const socket = io();

// Event handlers for messages received from the server
socket.on('message', function (message) {
    console.log(message);
});

socket.on('update_parametre_sessio', function (data) {
    getCurrentSession().receiveUpdateParametreSessioFromServer(data.nom_parametre, data.valor);
});

socket.on('update_parametre_estacio', function (data) {
    getCurrentSession().receiveUpdateParametreEstacioFromServer(data.nom_estacio, data.nom_parametre, data.valor);
});

socket.on('update_master_sequencer_current_step', function (data) {
    getAudioGraphInstance().receiveRemoteMainSequencerCurrentStep(data.current_step);
});

socket.on('update_parametre_audio_graph', function (data) {
    getAudioGraphInstance().receiveUpdateParametreAudioGraphFromServer(data.nom_parametre, data.valor);
});

// Methods to send a message to the server
export const sendMessageToServer = (name, data) => {
    socket.emit(name, data);
}

// Method used to connect to a session in the server and receive the initial session data
export const joinSessionInServer = (sessionID, callback) => {
    socket.on('connect', function() {
        socket.emit('join_session', {session_id: sessionID})
    });
    socket.on('set_session_data', function (data) {
        callback(data);
    });
}


