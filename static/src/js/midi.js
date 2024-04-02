let webMidiEnabled = false;
let midi = undefined;

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then((midiAccess) => {
        webMidiEnabled = true;
        midi = midiAccess;
        console.log("WebMIDI enabled!")
    }), () => {
        console.log("WebMIDI disabled :(")
    };
}

export const isWebMidiEnabled = () => {
    return webMidiEnabled;
}

export const getAvailableMidiInputNames = () => {
    const names = [];
    if (webMidiEnabled) {
        for (const entry of midi.inputs) {
            const input = entry[1];
            names.push(input.name);
        }
    }
    return names;
}

export const bindMidiInputOnMidiMessage = (midiInputName, onMidiMessageCallback) => {
    if (webMidiEnabled) {
        for (const entry of midi.inputs) {
            const input = entry[1];
            if (input.name === midiInputName) {
                input.onmidimessage = onMidiMessageCallback;
            } else {
                input.onmidimessage = undefined; // Unbind possibly existing callbacks on other devices
            }
        }
    }
}