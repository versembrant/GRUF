import { io } from 'socket.io-client';

export const socket = io();

// Defult log socket.io event handler
socket.on('message', function (message) {
    console.log(message);
});
