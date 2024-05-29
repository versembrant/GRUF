import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';
import { theWindow } from 'tone/build/esm/core/context/AudioContext';
import { Piano } from '@tonejs/piano'

export class EstacioPiano extends EstacioBase {

    tipus = 'piano'
    versio = '0.1'
    parametersDescription = {
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[]},
        timbre: {type: 'float', label: 'Timbre', min: 1200, max: 12000, initial: 12000, logarithmic: true},
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const timbre = new Tone.Filter(500, 'lowpass', -24).connect(estacioMasterChannel);
        const piano = new Piano({velocities: 2}).connect(timbre);
        piano.load().then(() => { console.log('Mostres del piano carregades!') })

        this.audioNodes = {
            piano: piano,
            timbre: timbre,
        };
    }

    updateAudioGraphFromState(preset) {
        this.audioNodes.timbre.frequency.rampTo(this.getParameterValue('timbre', preset), 0.01);
    }

    updateAudioGraphParameter(nomParametre, preset) {
        this.updateAudioGraphFromState(preset);
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Iterate over all the notes in the sequence and trigger those that start in the current beat (step)
        const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
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

    lastNoteOnBeats = {}

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };

        const recEnabled = document.getElementById(this.nom + '_notes_REC').checked;
        if (!noteOff){
            this.audioNodes.piano.keyDown({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:Tone.now()})
            if (recEnabled){
                // If rec enabled, we can't create a note because we need to wait until the note off, but we should save
                // the note on time to save it
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
                this.lastNoteOnBeats[midiNoteNumber] = currentStep;
            }
        } else {
            this.audioNodes.piano.keyUp({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:Tone.now()})
            if (recEnabled){
                // If rec enabled and we have a time for the last note on, then create a new note object, otherwise do nothing
                const lastNoteOnTimeForNote = this.lastNoteOnBeats[midiNoteNumber]
                if (lastNoteOnTimeForNote !== undefined){
                    const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                    const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
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
