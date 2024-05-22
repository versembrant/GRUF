import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';
import { theWindow } from 'tone/build/esm/core/context/AudioContext';

export class EstacioSynth extends EstacioBase {

    tipus = 'synth'
    versio = '0.1'
    parametersDescription = {
        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'sine'},
        lpf: {type: 'float', label: 'LPF', min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 3000, initial: 20, logarithmic: true},
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[]},
        chorusSend:{type: 'float', label: 'Chorus Send', min: -60, max: 6, initial: -60},
        reverbSend:{type: 'float', label: 'Reverb Send', min: -60, max: 6, initial: -60},
        delaySend:{type: 'float', label: 'Delay Send', min: -60, max: 6, initial: -60},
        portamento: {type: 'float', label: 'Glide', min: 0.0, max: 0.3, initial: 0.0},
        harmonicity: {type: 'float', label: 'Harmonicity', min: 0.95, max: 1.05, initial: 1.0}
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const hpf = new Tone.Filter(6000, "highpass", -24).connect(estacioMasterChannel);
        const lpf = new Tone.Filter(500, "lowpass", -24).connect(hpf);
        const synth = new Tone.PolySynth(Tone.DuoSynth).connect(lpf);
        synth.set({maxPolyphony: 8, volume: -12});  // Avoid clipping, specially when using sine
        this.audioNodes = {
            synth: synth,
            lpf: lpf,
            hpf: hpf,
            sendReverbGainNode: estacioMasterChannel.send("reverb", -100),
            sendChorusGainNode: estacioMasterChannel.send("chorus", -100),
            sendDelayGainNode: estacioMasterChannel.send("delay", -100),
        };
    }

    setParameters(parametersDict) {
        for (const [name, value] of Object.entries(parametersDict)) {
            if (name == "lpf") {
                this.audioNodes.lpf.frequency.rampTo(value, 0.01);
            } else if (name == "hpf") {
                this.audioNodes.hpf.frequency.rampTo(value, 0.01);
            } else if (name == "portamento") {
                this.audioNodes.synth.set({
                    voice0: {'portamento': value },
                    voice1: {'portamento': value },
                });
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
            } else if (name == "reverbSend"){
                this.audioNodes.sendReverbGainNode.gain.value = value;
            } else if (name == "chorusSend"){
                this.audioNodes.sendChorusGainNode.gain.value = value;
            } else if (name == "delaySend"){
                this.audioNodes.sendDelayGainNode.gain.value = value;
            }
        }
    }

    updateAudioGraphFromState(preset) {
        const parametersDict = {}
        Object.keys(this.parametersDescription).forEach(nomParametre => {
            parametersDict[nomParametre] = this.getParameterValue(nomParametre, preset);
        })
        this.setParameters(parametersDict) 
    }

    updateAudioGraphParameter(nomParametre, preset) {
        this.setParameters({[nomParametre]: this.getParameterValue(nomParametre, preset)})
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

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };

        const recEnabled = document.getElementById(this.nom + '_notes_REC').checked;
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
