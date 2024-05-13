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
        noteBase: {type: 'float', label:'Nota base', min: 0, max: 127, step: 1, initial: 64},
        notes: {type: 'grid', label:'Notes', numRows: 8, numCols: 16, initial:[]},
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const piano = new Piano({velocities: 2}).connect(estacioMasterChannel);
        piano.load().then(() => { console.log('Mostres del piano carregades!') })

        this.audioNodes = {
            piano: piano,
        };
    }

    updateAudioGraphFromState(preset) {
    }

    updateAudioGraphParameter(nomParametre, preset) {
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('notes').numCols;
        const notes = this.getParameterValue('notes', this.currentPreset);
        const tempsBeat = 60.0 / getAudioGraphInstance().getBpm() / 4.0;
        for (let i = 0; i < this.getParameterDescription('notes').numRows; i++) {
            if (indexOfArrayMatchingObject(notes, {'i': i, 'j': currentStep}) > -1){
                const noteOffset = this.getParameterDescription('notes').numRows - 1 - i;  // 0 = nota més greu, numRows = nota més aguda
                const noteOffsetMap = [0, 2, 4, 5, 7, 9, 11, 12];  // Mapa de offsets de notes (per fer intervals musicals)
                const midiNoteNumber = this.getParameterValue('noteBase', this.currentPreset) + noteOffsetMap[noteOffset];  // Midi numbers
                this.audioNodes.piano.keyDown({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:time})
                this.audioNodes.piano.keyUp({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:time + tempsBeat})  // hem de fer note off també perquè sino en el grid no n'hi ha
            }
        }
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };
        if (!noteOff){
            this.audioNodes.piano.keyDown({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:Tone.now()})
        } else {
            this.audioNodes.piano.keyUp({note:Tone.Frequency(midiNoteNumber, "midi").toNote(), time:Tone.now()})
        }
    }
}
