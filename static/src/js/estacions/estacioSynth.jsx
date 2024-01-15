import * as Tone from 'tone'
import { EstacioBase, registerEstacioDisponible } from "../sessionManager";
import { indexOfArray } from '../utils';

const tipus = 'synth'

class EstacioSynth extends EstacioBase {
    
    constructor(nom) {
        super(nom);
        this.tipus = tipus
        this.versio = '0.1'
        this.parametersDescription = {
            noteBase: {type: 'float', label:'Nota base', min: 0, max: 127, step: 1, initial: 64},
            attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
            decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
            sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
            release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
            waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'sine'},
            notes: {type: 'grid', label:'Notes', numRows: 8, numCols: 16, initial:[]}
        }
        this.followsMainSequencer = true;
    }

    buildEstacioAudioGraph(estacioMasterGainNode) {
        // Creem els nodes del graph i els guardem
        const synth = new Tone.PolySynth(Tone.Synth).connect(estacioMasterGainNode);
        synth.set({maxPolyphony: 16});
        this.audioNodes = {
            synth: synth,
        };
    }

    updateAudioGraphFromState() {
        this.audioNodes.synth.set({
            'envelope': {
                attack:  this.getParameterValue('attack'),
                decay: this.getParameterValue('decay'),
                sustain: this.getParameterValue('sustain'),
                release: this.getParameterValue('release'),
            },
            'oscillator': {
                type: this.getParameterValue('waveform'),
            },
            'volume': -12,  // Avoid clipping, specially when using sine
        });
    }

    updateAudioGraphParameter(nomParametre) {
        // Com que hi ha molt poc a actualizar, sempre actualitzem tots els parametres sense comprovar quin ha canviat (sense optimitzar)
        this.updateAudioGraphFromState();
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('notes').numCols;
        const notes = this.getParameterValue('notes');
        const notesToPlay = [];
        for (let i = 0; i < this.getParameterDescription('notes').numRows; i++) {
            if (indexOfArray(notes, [i, currentStep]) > -1){
                const noteOffset = this.getParameterDescription('notes').numRows - 1 - i;  // 0 = nota més greu, numRows = nota més aguda
                const noteOffsetMap = [0, 2, 4, 5, 7, 9, 11, 12];  // Mapa de offsets de notes (per fer intervals musicals)
                const midiNoteNumber = this.getParameterValue('noteBase') + noteOffsetMap[noteOffset];  // Midi numbers
                notesToPlay.push(Tone.Frequency(midiNoteNumber, "midi").toNote());
            }
        }
        this.audioNodes.synth.triggerAttackRelease(notesToPlay, "16n", time);
    }
}

registerEstacioDisponible(tipus, EstacioSynth);
