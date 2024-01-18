import { io } from 'socket.io-client';
import { getCurrentSession } from './sessionManager';
import { getAudioGraphInstance } from './audioEngine';
import throttle from 'lodash.throttle'

// Initialize socket
const socket = io();

const throttledFunctionsMap = {}

const getThrottledFuctionKey = (name, data) => {
    if (name === 'update_master_sequencer_current_step'){
        // Never throttle step sequencer clock messages
        return undefined;
    }
    let key = name + '_';
    key += data.nom_estacio + '_'  // this will be undefined if no estacio but it is fine
    key += data.nom_parametre + '_'  // this will be undefined if no estacio but it is fine
    return key
}


// Event handlers for messages received from the server
const onMessageFromServer = (name, data) => {
    if (name === 'message'){
        console.log(message);
    } else if (name === 'update_parametre_sessio'){
        getCurrentSession().receiveUpdateParametreSessioFromServer(data.nom_parametre, data.valor);
    } else if (name === 'update_parametre_estacio'){
        getCurrentSession().receiveUpdateParametreEstacioFromServer(data.nom_estacio, data.nom_parametre, data.valor);
    } else if (name === 'update_master_sequencer_current_step'){
        getAudioGraphInstance().receiveRemoteMainSequencerCurrentStep(data.current_step);
    } else if (name === 'update_parametre_audio_graph'){
        getAudioGraphInstance().receiveUpdateParametreAudioGraphFromServer(data.nom_parametre, data.valor);
    } 
}

socket.on('message', function (message) {
    onMessageFromServer('message', message);
});

socket.on('update_parametre_sessio', function (data) {
    onMessageFromServer('update_parametre_sessio', data);
});

socket.on('update_parametre_estacio', function (data) {
    onMessageFromServer('update_parametre_estacio', data);
});

socket.on('update_master_sequencer_current_step', function (data) {
    onMessageFromServer('update_master_sequencer_current_step', data);
});

socket.on('update_parametre_audio_graph', function (data) {
    onMessageFromServer('update_parametre_audio_graph', data);
});

// Methods to send a message to the server
export const sendMessageToServer = (name, data) => {
    const throttledFunctionKey = getThrottledFuctionKey(name, data);
    if (throttledFunctionKey === undefined){
        // No throttle
        socket.emit(name, data);
    } else {
        if (!throttledFunctionsMap.hasOwnProperty(throttledFunctionKey)){
            // If no throttled function exists, create it
            throttledFunctionsMap[throttledFunctionKey] = throttle((name, data) => socket.emit(name, data), 50);
        }
        // Call the throttled version of the funcion
        throttledFunctionsMap[throttledFunctionKey](name, data)
    }
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

// Mrthod to request a list of available sessions ans subscribe to server updated from this list
export const subscribeToAvailableSessions = (callback) => {
    socket.on('connect', function() {
        socket.emit('subscribe_to_available_sessions', {})
    });
    socket.on('set_available_sessions', function (data) {
        callback(data);
    });
}


