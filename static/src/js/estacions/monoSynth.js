import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { units } from "../utils";

export class MonoSynth extends EstacioBase {

    tipus = 'mono_synth'
    versio = '0.1'
    static parametersDescription = {
        ...EstacioBase.parametersDescription,
        // Notes
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], followsPreset: true, isMono: true},
        // Synth params
        attack: {type: 'float', label:'Attack', unit: units.second, min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', unit: units.second, min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', unit: units.second, min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sawtooth', 'triangle', 'square', 'sine'], initial: 'sawtooth'},
        lpf: {type: 'float', label: 'LPF', min: 300, unit: units.hertz, max: 12000, initial: 12000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 200, unit: units.hertz, max: 3000, initial: 200, logarithmic: true},
        portamento: {type: 'float', label: 'Glide', unit: units.second, min: 0.0, max: 0.3, initial: 0.0},
        harmonicity: {type: 'float', label: 'Detune', min: 0.95, max: 1.05, initial: 1.0},
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els connectem entre ells
        const hpf = new Tone.Filter(6000, "highpass", -24);
        const lpf = new Tone.Filter(500, "lowpass", -24).connect(hpf);
        const synth = new Tone.DuoSynth().connect(lpf);
        
        // Settejem alguns paràmetres inicials que no canviaran
        synth.set({
            vibratoAmount: 0.0,
            voice0: {
                attackCurve: "exponential",
                decayCurve: "exponential",
                releaseCurve: "exponential"
            },
            voice1: {
                attackCurve: "exponential",
                decayCurve: "exponential",
                releaseCurve: "exponential"
            },
            volume: -20 // Avoid clipping, specially when using sine
        });

        // Adegeix els nodes al diccionari de nodes de l'estació
        this.audioNodes = {
            synth: synth,
            lpf: lpf,
            hpf: hpf,
        };

        // Crea els nodes d'efectes (això també els afegirà al diccionari de nodes de l'estació)
        this.addEffectChainNodes(hpf, estacioMasterChannel);
    }

    setParameterInAudioGraph(name, value, preset) {
        if (name == "lpf") {
            this.audioNodes.lpf.frequency.rampTo(value, 0.01);
        } else if (name == "hpf") {
            this.audioNodes.hpf.frequency.rampTo(value, 0.01);
        } else if (name == "harmonicity") {
            this.audioNodes.synth.set({
                'harmonicity': value,
            });
        } else if ((name == "attack")
                || (name == "decay")
                || (name == "sustain")
                || (name == "release")
        ){
            this.audioNodes.synth.set({
                voice0: {'envelope': {[name]: value}},
                voice1: {'envelope': {[name]: value}},
            })
        } else if (name == "waveform"){
            this.audioNodes.synth.set({
                voice0: {'oscillator': { type: value }},
                voice1: {'oscillator': { type: value }},
            })
        } else if (name == "portamento"){
            this.audioNodes.synth.set({
                'portamento': value,
            }) 
        } 
    }

    adjustNoteForWaveform(note) {
        const waveform = this.getParameterValue('waveform');
        if (waveform === 'sine' || waveform === 'triangle') {
            return note + 12; 
        }
        return note;
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
                const ajustedNote = this.adjustNoteForWaveform(note.n);
                this.audioNodes.synth.triggerAttackRelease(Tone.Frequency(ajustedNote, "midi").toNote(), note.d * Tone.Time("16n").toSeconds(), time);
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.synth.triggerRelease(Tone.now())
    }

    unfinishedNotes = [];
    onMidiNote(midiNoteNumber, midiVelocity, noteOff, extras) {
        if (!getAudioGraphInstance().isGraphBuilt()) return;

        const adjustedNote = this.adjustNoteForWaveform(midiNoteNumber);
        if (!noteOff) {
            if (!extras.skipStack) this.unfinishedNotes.push(midiNoteNumber);
            this.audioNodes.synth.triggerAttack(Tone.Frequency(adjustedNote, "midi").toNote(), Tone.now());
        }
        else {
            const removedIndex = this.unfinishedNotes.indexOf(midiNoteNumber);
            this.unfinishedNotes.splice(removedIndex, 1);
            const newStackLength = this.unfinishedNotes.length;
            if (removedIndex === newStackLength) { // if removed note was the last one (sounding...)
                this.audioNodes.synth.triggerRelease(Tone.now()); // release it
                // ...and if there were other notes pressed, play the newest one among them
                if (newStackLength > 0) this.onMidiNote(this.unfinishedNotes[newStackLength-1], midiVelocity, false, {...extras, skipStack: true})
            }
        }
        
        if (!extras.skipRecording) this.handlePianoRollRecording(midiNoteNumber, noteOff);
    }
}
