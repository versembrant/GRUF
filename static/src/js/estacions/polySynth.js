import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';
import { theWindow } from 'tone/build/esm/core/context/AudioContext';

export class PolySynth extends EstacioBase {

    tipus = 'synth'
    versio = '0.1'
    parametersDescription = {
        noteBase: {type: 'float', label:'Nota base', min: 0, max: 127, step: 1, initial: 64},
        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'sine'},
        lpf: {type: 'float', label: 'LPF', min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 3000, initial: 20, logarithmic: true},
        notes: {type: 'grid', label:'Notes', numRows: 8, numCols: 16, initial:[]},
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
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('notes').numCols;
        const notes = this.getParameterValue('notes', this.currentPreset);
        const notesToPlay = [];
        for (let i = 0; i < this.getParameterDescription('notes').numRows; i++) {
            if (indexOfArrayMatchingObject(notes, {'i': i, 'j': currentStep}) > -1){
                const noteOffset = this.getParameterDescription('notes').numRows - 1 - i;  // 0 = nota més greu, numRows = nota més aguda
                const noteOffsetMap = [0, 2, 4, 5, 7, 9, 11, 12];  // Mapa de offsets de notes (per fer intervals musicals)
                const midiNoteNumber = this.getParameterValue('noteBase', this.currentPreset) + noteOffsetMap[noteOffset];  // Midi numbers
                notesToPlay.push(Tone.Frequency(midiNoteNumber, "midi").toNote());
            }
        }
        this.audioNodes.synth.triggerAttackRelease(notesToPlay, "16n", time);
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };
        if (!noteOff){
            this.audioNodes.synth.triggerAttack([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
        } else {
            this.audioNodes.synth.triggerRelease([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
        }
    }
}
