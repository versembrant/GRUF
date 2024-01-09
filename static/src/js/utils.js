import { io } from 'socket.io-client';

// Export socket object to be used by other modules and communicate with server
export const socket = io();

socket.on('message', function (message) {
    console.log(message);
});


// Make sure numeric value is within min/max boundaries
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Make sure enum value is within options
export const ensureValueInOptions = (value, options, defaultValue) => {
    if (!options.includes(value)) {
        if (defaultValue === undefined) {
            return options[0];
        } else {
            return defaultValue;
        }
    }
    return value;
}

// Util function to ensure value is valid for parameter type
export const ensureValidValue = (value, parameterData) => {
    if (parameterData.type === 'float') {
        return clamp(value, parameterData.min, parameterData.max);
    } else if (parameterData.type === 'enum') {
        return ensureValueInOptions(value, parameterData.options, parameterData.initial);
    }
    return value;
}