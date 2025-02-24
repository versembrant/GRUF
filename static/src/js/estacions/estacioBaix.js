import { MonoSynth } from "../estacions/monoSynth.js";
import { EstacioBaixUI } from "../components/estacioBaix.jsx";

export class EstacioBaix extends MonoSynth {
    
    tipus = 'synth_bass'
    versio = '0.1'
    parametersDescription = {
        ...MonoSynth.parametersDescription,
        notes: {...MonoSynth.parametersDescription.notes,
            notaMesBaixaPermesa: 24,
            notaMesAltaPermesa: 47,
        },
        waveform: {...MonoSynth.parametersDescription.waveform, initial: 'square'},
        attack: {...MonoSynth.parametersDescription.attack, initial: 0.0},
        decay: {...MonoSynth.parametersDescription.decay, initial: 3.0},
        sustain: {...MonoSynth.parametersDescription.sustain, initial: 0.0},
        release: {...MonoSynth.parametersDescription.release, initial: 0.2},
        harmonicity: {...MonoSynth.parametersDescription.harmonicity, initial: 1.01},
    }

    getUserInterfaceComponent() {
        return EstacioBaixUI
    }
}