import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { Piano } from '@tonejs/piano'
import { EstacioPianoUI } from "../components/estacioPiano";
import { units } from "../utils"

export class EstacioPiano extends EstacioBase {

    tipus = 'piano'
    versio = '0.1'
    parametersDescription = {
        ...EstacioBase.parametersDescription,
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], followsPreset: true, notaMesBaixaTipica: 48, notaMesAltaTipica: 71},
        timbre: {type: 'float', label: 'Timbre', unit: units.hertz, min: 1200, max: 12000, initial: 12000, logarithmic: true},
    }

    getUserInterfaceComponent() {
        return EstacioPianoUI
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const timbre = new Tone.Filter(500, 'lowpass', -12);
        const gainFixPiano = new Tone.Gain(Tone.dbToGain(-20)).connect(timbre);
        const piano = new Piano({velocities:4, maxPolyphony:6}).connect(gainFixPiano);
        piano.load().then(() => { console.log('Mostres del piano carregades!') })

        this.audioNodes = {
            piano: piano,
            timbre: timbre,
            gainFixPiano: gainFixPiano,
        };

        // Crea els nodes d'efectes (això també els afegirà al diccionari de nodes de l'estació)
        this.addEffectChainNodes(timbre, estacioMasterChannel);
    }

    setParameterInAudioGraph(name, value, preset) {
        if (name == "timbre") {
            this.audioNodes.timbre.frequency.rampTo(value, 0.01);
        }
    }

    onSequencerStep(currentMainSequencerStep, time) {
        // Iterate over all the notes in the sequence and trigger those that start in the current beat (step)
        const currentStep = currentMainSequencerStep % this.getNumSteps();
        const notes = this.getParameterValue('notes');
        for (let i = 0; i < notes.length; i++) {
            const minBeat = currentStep;
            const maxBeat = currentStep + 1;
            const note = notes[i];
            // note will be an object with properties
            // b = beat (or step in which the note has to be played)
            // n = midi note number
            // d = duration of the note in beats (or steps)
            if ((note.b >= minBeat) && (note.b < maxBeat)) {
                this.audioNodes.piano.keyDown({note:Tone.Frequency(note.n, "midi").toNote(), velocity:(note.v || 127) / 127, time:time})
                this.audioNodes.piano.keyUp({note:Tone.Frequency(note.n, "midi").toNote(), time:time + note.d * getAudioGraphInstance().get16BeatTime()})
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.piano.stopAll()
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, extras) {
        if (!getAudioGraphInstance().isGraphBuilt()) return;

        if (!noteOff) this.audioNodes.piano.keyDown({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), velocity:midiVelocity/127});
        else this.audioNodes.piano.keyUp({note:Tone.Frequency(midiNoteNumber, "midi").toNote()});
        
        if (!extras.skipRecording) this.handlePianoRollRecording(midiNoteNumber, midiVelocity, noteOff);
    }
}
