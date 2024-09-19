import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { EstacioSynthUI } from "../components/estacioSynth";

export class Synth extends EstacioBase {

    tipus = 'synth'
    versio = '0.1'
    parametersDescription = {
        // Notes
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], followsPreset: true, rangDeNotesPermeses: 36, permetScrollVertical: true},
        // Synth params
        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sawtooth', 'triangle', 'square', 'sine'], initial: 'sawtooth'},
        lpf: {type: 'float', label: 'LPF', min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 3000, initial: 20, logarithmic: true},
        harmonicity: {type: 'float', label: 'Detune', min: 0.95, max: 1.05, initial: 1.0},
        // FX
        fxReverbWet: {type: 'float', label:'Reverb Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxReverbDecay: {type: 'float', label:'Reverb Decay', min: 0.1, max: 15, initial: 1.0},
        fxDelayOnOff: {type : 'bool', label: 'Delay On/Off', initial: false},
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
        return EstacioSynthUI
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els connectem entre ells
        const hpf = new Tone.Filter(6000, "highpass", -24);
        const lpf = new Tone.Filter(500, "lowpass", -24).connect(hpf);
        const synth = new Tone.PolySynth(Tone.DuoSynth).connect(lpf);
        
        // Settejem alguns paràmetres inicials que no canviaran
        synth.set({
            maxPolyphony: 8, 
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
        }  
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
                this.audioNodes.synth.triggerAttackRelease([Tone.Frequency(note.n, "midi").toNote()], note.d * Tone.Time("16n").toSeconds(), time);
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.synth.releaseAll()
    }

    lastNoteOnBeats = {}

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, skipRecording=false) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };

        const recEnabled = this.recEnabled('notes') && !skipRecording;
        if (!noteOff){
            this.audioNodes.synth.triggerAttack([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
            if (recEnabled){
                // If rec enabled, we can't create a note because we need to wait until the note off, but we should save
                // the note on time to save it
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
                this.lastNoteOnBeats[midiNoteNumber] = currentStep;
            }
        } else {
            this.audioNodes.synth.triggerRelease([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
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
