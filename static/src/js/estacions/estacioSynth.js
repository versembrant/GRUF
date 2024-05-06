import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';

export class EstacioSynth extends EstacioBase {

    tipus = 'synth'
    versio = '0.1'
    parametersDescription = {
        noteBase: {type: 'float', label:'Nota base', min: 0, max: 127, step: 1, initial: 64},
        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'sine'},
        lpf: {type: 'float', label: 'LPF', min: 500, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 6000, initial: 20, logarithmic: true},
        notes: {type: 'grid', label:'Notes', numRows: 13, numCols: 16, initial:[], escales: [
            {'nom': 'Major', 'escala': [{"i":12,"j":0},{"i":10,"j":1},{"i":8,"j":2},{"i":7,"j":3},{"i":5,"j":4},{"i":3,"j":5},{"i":1,"j":6},{"i":0,"j":7},{"i":12,"j":8},{"i":10,"j":9},{"i":8,"j":10},{"i":7,"j":11},{"i":5,"j":12},{"i":3,"j":13},{"i":1,"j":14},{"i":0,"j":15}]},
            {'nom': 'Menor', 'escala': [{"i":12,"j":0},{"i":10,"j":1},{"i":7,"j":3},{"i":5,"j":4},{"i":0,"j":7},{"i":12,"j":8},{"i":10,"j":9},{"i":7,"j":11},{"i":5,"j":12},{"i":0,"j":15},{"i":9,"j":2},{"i":2,"j":6},{"i":4,"j":5},{"i":9,"j":10},{"i":4,"j":13},{"i":2,"j":14}]},
        ]},
        chorusSend:{type: 'float', label: 'Chorus Send', min: -60, max: 6, initial: -60},
        reverbSend:{type: 'float', label: 'Reverb Send', min: -60, max: 6, initial: -60},
        delaySend:{type: 'float', label: 'Delay Send', min: -60, max: 6, initial: -60},
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const lpf = new Tone.Filter(500, "lowpass").connect(estacioMasterChannel);
        const hpf = new Tone.Filter(6000, "highpass").connect(estacioMasterChannel);
        const synth = new Tone.PolySynth(Tone.Synth).connect(lpf).connect(hpf);
        synth.set({maxPolyphony: 16});
        this.audioNodes = {
            synth: synth,
            lpf: lpf,
            hpf: hpf,
            sendReverbGainNode: estacioMasterChannel.send("reverb", -100),
            sendChorusGainNode: estacioMasterChannel.send("chorus", -100),
            sendDelayGainNode: estacioMasterChannel.send("delay", -100),
        };
    }

    updateAudioGraphFromState(preset) {
        this.audioNodes.synth.set({
            'envelope': {
                attack:  this.getParameterValue('attack', preset),
                decay: this.getParameterValue('decay', preset),
                sustain: this.getParameterValue('sustain', preset),
                release: this.getParameterValue('release', preset),
            },
            'oscillator': {
                type: this.getParameterValue('waveform', preset),
            },
            'volume': -12,  // Avoid clipping, specially when using sine
        });
        this.audioNodes.lpf.frequency.rampTo(this.getParameterValue('lpf', preset),0.01);
        this.audioNodes.hpf.frequency.rampTo(this.getParameterValue('hpf', preset),0.01);
        this.audioNodes.sendReverbGainNode.gain.value = this.getParameterValue('reverbSend',preset);
        this.audioNodes.sendChorusGainNode.gain.value = this.getParameterValue('chorusSend',preset);
        this.audioNodes.sendDelayGainNode.gain.value = this.getParameterValue('delaySend',preset);
    }

    updateAudioGraphParameter(nomParametre, preset) {
        // Com que hi ha molt poc a actualizar, sempre actualitzem tots els parametres sense comprovar quin ha canviat (sense optimitzar)
        this.updateAudioGraphFromState(preset);
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('notes').numCols;
        const notes = this.getParameterValue('notes', this.currentPreset);
        const notesToPlay = [];
        for (let i = 0; i < this.getParameterDescription('notes').numRows; i++) {
            if (indexOfArrayMatchingObject(notes, {'i': i, 'j': currentStep}) > -1){
                const noteOffset = this.getParameterDescription('notes').numRows - 1 - i;  // 0 = nota més greu, numRows = nota més aguda
                const noteOffsetMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];  // Mapa de offsets de notes 
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
