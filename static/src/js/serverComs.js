import { io } from 'socket.io-client';
import { getCurrentSession } from './sessionManager';
import { getAudioGraphInstance } from './audioEngine';
import throttle from 'lodash.throttle'
import debounce from 'lodash.debounce'

// Initialize socket
const wsServerURL = ''  // Nothing for same domain where the page is loaded
const socket = io(wsServerURL, {
    autoConnect: false,
    reconnection: true,
});

socket.on('connect', function() {
    console.log('Connected to WS server! ID: ' + socket.id)
});

socket.on('disconnect', function(reason) {
    console.log('Disconnected from WS server! Reason: ' + reason)
});

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
    socket.connect();
    socket.on('connect', function() {
        console.log('Joining session', sessionID)
        socket.emit('join_session', {session_id: sessionID})
        // This will trigger set_session_data from the server
    });
    socket.on('set_session_data', function (data) {
        receivedUpdatesCounter = 0
        callback(data);
    });
}

const requestSessionData = (sessionID) => {
    // This will make the server send a "set_session_data" message, therefore "joinSessionInServer" 
    // should have been called before so there is a handler
    console.log('Requesting session data...')
    socket.emit('request_session_data', {session_id: sessionID})
}

// Version of requestSessionData which is not going to be called more than once every 5 seconds
const debouncedRequestSessionData = debounce(sessionID => requestSessionData(sessionID), 5000, {leading:true, trailing: false});

// Method to request a list of available sessions ans subscribe to server updated from this list
export const subscribeToAvailableSessions = (callback) => {
    socket.connect();
    socket.on('connect', function() {
        socket.emit('subscribe_to_available_sessions', {})
    });
    socket.on('set_available_sessions', function (data) {
        callback(data);
    });
}

// Event handlers for messages received from the server
let receivedUpdatesCounter = 0

const onMessageFromServer = (name, data) => {
    if (data.hasOwnProperty('update_count')) {
        // If the message is numerated, check that the update number is the expected one
        if (receivedUpdatesCounter === 0){
            receivedUpdatesCounter = data.update_count
        } else {
            if (receivedUpdatesCounter + 1 != data.update_count){
                // We received an update with an unexpected count, state might be
                // out of sync. Request a full session update.
                console.log('Received update with unexpected count!')
                debouncedRequestSessionData(getCurrentSession().getID());
            }
            receivedUpdatesCounter = data.update_count
        }
    }

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
