import { MonoSynth } from "../estacions/monoSynth.js";
import { EstacioBaixUI } from "../components/estacioBaix.jsx";

export class EstacioBaix extends MonoSynth {
    
    tipus = 'synth_bass'
    versio = '0.1'
    parametersDescription = {
        // Notes
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], 
            followsPreset: true,
            notaMesBaixaPermesa: 24,
            rangDeNotesPermeses: 24,
            permetScrollVertical: 0
        },
        // Synth params
        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'square'},
        lpf: {type: 'float', label: 'LPF', min: 300, max: 12000, initial: 12000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 200, max: 3000, initial: 200, logarithmic: true},
        portamento: {type: 'float', label: 'Glide', min: 0.0, max: 0.3, initial: 0.0},
        harmonicity: {type: 'float', label: 'Detune', min: 0.95, max: 1.05, initial: 1.0},
        // FX
        fxReverbWet: {type: 'float', label:'Reverb Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxReverbDecay: {type: 'float', label:'Reverb Decay', min: 0.1, max: 15, initial: 1.0},
        fxDelayOnOff: {type : 'bool', label: 'EQ On/Off', initial: false},
        fxDelayWet: {type: 'float', label:'Delay Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxDelayFeedback:{type: 'float', label:'Delay Feedback', min: 0.0, max: 1.0, initial: 0.5},
        fxDelayTime:{type: 'enum', label:'Delay Time', options: ['1/4', '1/4T', '1/8', '1/8T', '1/16', '1/16T'], initial: '1/8'},
        fxDrive:{type: 'float', label:'Drive', min: 0.0, max: 1.0, initial: 0.0},
        fxEqOnOff: {type : 'bool', label: 'EQ On/Off', initial: true},
        fxLow:{type: 'float', label:'Low', min: -12, max: 12, initial: 0.0},
        fxMid:{type: 'float', label:'Mid', min: -12, max: 12, initial: 0.0},
        fxHigh:{type: 'float', label:'High', min: -12, max: 12, initial: 0.0}
    }

    getUserInterfaceComponent() {
        return EstacioBaixUI
    }
}