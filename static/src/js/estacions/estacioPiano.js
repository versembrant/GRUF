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
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], followsPreset: true, permetScrollVertical: true},
        timbre: {type: 'float', label: 'Timbre', unit: units.hertz, min: 1200, max: 12000, initial: 12000, logarithmic: true},
        // FX
        fxReverbWet: {type: 'float', label:'Reverb Wet', min: 0.0, max: 0.5, initial: 0.5},
        fxReverbDecay: {type: 'float', label:'Reverb Decay', unit: units.second, min: 0.1, max: 15, initial: 1.0},
        fxDelayOnOff: {type : 'bool', label: 'Delay On/Off', initial: false},
        fxDelayWet: {type: 'float', label:'Delay Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxDelayFeedback:{type: 'float', label:'Delay Feedback', min: 0.0, max: 1.0, initial: 0.5},
        fxDelayTime:{type: 'enum', label:'Delay Time', options: ['1/4', '1/4T', '1/8', '1/8T', '1/16', '1/16T'], initial: '1/8'},
        fxDrive:{type: 'float', label:'Drive', min: 0.0, max: 1.0, initial: 0.0},
        fxEqOnOff: {type : 'bool', label: 'EQ On/Off', initial: true},
        fxLow:{type: 'float', label:'Low', unit: units.decibel, min: -12, max: 12, initial: 0.0},
        fxMid:{type: 'float', label:'Mid', unit: units.decibel, min: -12, max: 12, initial: 0.0},
        fxHigh:{type: 'float', label:'High', unit: units.decibel, min: -12, max: 12, initial: 0.0},
    }

    getUserInterfaceComponent() {
        return EstacioPianoUI
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const timbre = new Tone.Filter(500, 'lowpass', -24);
        const piano = new Piano({velocities: 2}).connect(timbre);
        piano.load().then(() => { console.log('Mostres del piano carregades!') })

        this.audioNodes = {
            piano: piano,
            timbre: timbre,
        };

        // Crea els nodes d'efectes (això també els afegirà al diccionari de nodes de l'estació)
        this.addEffectChainNodes(timbre, estacioMasterChannel);
    }

    setParameterInAudioGraph(name, value, preset) {
        if (name == "timbre") {
            this.audioNodes.timbre.frequency.rampTo(value, 0.01);
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Iterate over all the notes in the sequence and trigger those that start in the current beat (step)
        const currentStep = currentMainSequencerStep % this.getNumSteps();
        const notes = this.getParameterValue('notes', this.currentPreset);
        for (let i = 0; i < notes.length; i++) {
            const minBeat = currentStep;
            const maxBeat = currentStep + 1;
            const note = notes[i];
            // note will be an object with properties
            // b = beat (or step in which the note has to be played)
            // n = midi note number
            // d = duration of the note in beats (or steps)
            if ((note.b >= minBeat) && (note.b < maxBeat)) {
                this.audioNodes.piano.keyDown({note:Tone.Frequency(note.n, "midi").toNote(), time:time})
                this.audioNodes.piano.keyUp({note:Tone.Frequency(note.n, "midi").toNote(), time:time + note.d})
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.piano.stopAll()
    }

    lastNoteOnBeats = {}

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, skipRecording=false) {
        if (!getAudioGraphInstance().isGraphBuilt()){return;}

        const recEnabled = this.recEnabled('notes') && !skipRecording;
        if (!noteOff){
            this.audioNodes.piano.keyDown({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:Tone.now()})
            if (recEnabled){
                // If rec enabled, we can't create a note because we need to wait until the note off, but we should save
                // the note on time to save it
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % this.getNumSteps();
                this.lastNoteOnBeats[midiNoteNumber] = currentStep;
            }
        } else {
            this.audioNodes.piano.keyUp({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:Tone.now()})
            if (recEnabled){
                // If rec enabled and we have a time for the last note on, then create a new note object, otherwise do nothing
                const lastNoteOnTimeForNote = this.lastNoteOnBeats[midiNoteNumber]
                if (lastNoteOnTimeForNote !== undefined){
                    const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                    const currentStep = currentMainSequencerStep % this.getNumSteps();
                    if (lastNoteOnTimeForNote < currentStep){
                        // Only save the note if note off time is bigger than note on time
                        const notes = this.getParameterValue('notes', this.currentPreset);
                        notes.push({'n': midiNoteNumber, 'b': lastNoteOnTimeForNote, 'd': currentStep - lastNoteOnTimeForNote})
                        this.updateParametreEstacio('notes', notes); // save change in server!
                    }
                    this.lastNoteOnBeats[midiNoteNumber] = undefined;
                }
            }
        }
    }
}
