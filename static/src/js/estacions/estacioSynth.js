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
        cutoff: {type: 'float', label: 'Filtre', min: 500, max: 15000, initial: 15000, logarithmic: true},
        //shelf: {type: 'float', label: 'Shelf', min: -2, max: 2, initial: 0},
        notes: {type: 'grid', label:'Notes', numRows: 8, numCols: 16, initial:[]},
        chorusSend:{type: 'float', label: 'Chorus Send', min: -60, max: 6, initial: -60},
        reverbSend:{type: 'float', label: 'Reverb Send', min: -60, max: 6, initial: -60},
        delaySend:{type: 'float', label: 'Delay Send', min: -60, max: 6, initial: -60},
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const filtre = new Tone.Filter(500, "lowpass").connect(estacioMasterChannel);
        const synth = new Tone.PolySynth(Tone.Synth).connect(filtre);
        synth.set({maxPolyphony: 16});
        this.audioNodes = {
            synth: synth,
            filtre: filtre,
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
        this.audioNodes.filtre.frequency.rampTo(this.getParameterValue('cutoff', preset),0.01);
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
