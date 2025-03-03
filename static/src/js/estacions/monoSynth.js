import * as Tone from 'tone'
import { BaseSynth } from "./synth";
import { getAudioGraphInstance } from '../audioEngine';
import { units } from "../utils";

export class MonoSynth extends BaseSynth {

    tipus = 'mono_synth'
    versio = '0.1'
    static parametersDescription = {
        ...BaseSynth.parametersDescription,
        notes: {...BaseSynth.parametersDescription.notes, isMono: true},
        lpf: {...BaseSynth.parametersDescription.lpf, min: 300, max: 12000, initial: 12000},
        hpf: {...BaseSynth.parametersDescription.hpf, min: 200, max: 3000, initial: 200},
        portamento: {type: 'float', label: 'Glide', unit: units.second, min: 0.0, max: 0.3, initial: 0.0},
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        super.buildEstacioAudioGraph(estacioMasterChannel, {poly: false})
    }

    setParameterInAudioGraph(name, value, preset) {
        if (name == "portamento"){
            this.audioNodes.synth.set({
                'portamento': value,
            }) 
        } else super.setParameterInAudioGraph(name, value, preset);
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.synth.triggerRelease()
    }

    unfinishedNotes = [];
    onMidiNote(midiNoteNumber, midiVelocity, noteOff, extras) {
        if (!getAudioGraphInstance().isGraphBuilt()) return;

        midiNoteNumber = this.adjustMidiNoteToEstacioRange(midiNoteNumber);

        const adjustedNote = this.adjustNoteForWaveform(midiNoteNumber);
        if (!noteOff) {
            if (!extras.skipStack) this.unfinishedNotes.push(midiNoteNumber);
            this.audioNodes.synth.triggerAttack(Tone.Frequency(adjustedNote, "midi").toNote());
        }
        else {
            const removedIndex = this.unfinishedNotes.indexOf(midiNoteNumber);
            this.unfinishedNotes.splice(removedIndex, 1);
            const newStackLength = this.unfinishedNotes.length;
            if (removedIndex === newStackLength) { // if removed note was the last one (sounding...)
                this.audioNodes.synth.triggerRelease(); // release it
                // ...and if there were other notes pressed, play the newest one among them
                if (newStackLength > 0) this.onMidiNote(this.unfinishedNotes[newStackLength-1], midiVelocity, false, {...extras, skipStack: true})
            }
        }
        
        if (!extras.skipRecording) this.handlePianoRollRecording(midiNoteNumber, midiVelocity, noteOff);
    }
}
