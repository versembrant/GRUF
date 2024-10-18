import { MonoSynth } from "../estacions/monoSynth.js";
import { EstacioBaixUI } from "../components/estacioBaix.jsx";

export class EstacioBaix extends MonoSynth {
    
    tipus = 'synth_bass'
    versio = '0.1'
    parametersDescription = {
        ...MonoSynth.parametersDescription,
        notes: {...MonoSynth.parametersDescription.notes,
            notaMesBaixaPermesa: 24,
            rangDeNotesPermeses: 24,
        },
        waveform: {...MonoSynth.parametersDescription.waveform, initial: 'square'},
    }

    getUserInterfaceComponent() {
        return EstacioBaixUI
    }
}