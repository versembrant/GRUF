import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArray } from '../utils';

export class EstacioDrumMachine extends EstacioBase {
    
    tipus = 'drum machine'
    versio = '0.1'
    parametersDescription = {
        sound1URL: {type: 'text', label: 'Clap', initial: 'https://cdn.freesound.org/previews/125/125591_4948-hq.mp3'}, // Clap
        sound2URL: {type: 'text', label: 'HiHat', initial: 'https://cdn.freesound.org/previews/75/75840_260058-hq.mp3'}, // Hat
        sound3URL: {type: 'text', label: 'Snare', initial: 'https://cdn.freesound.org/previews/693/693151_14904072-hq.mp3'}, // Snare
        sound4URL: {type: 'text', label: 'Kick', initial: 'https://cdn.freesound.org/previews/274/274775_4965320-hq.mp3'}, // Kick
        pattern: {type: 'grid', label:'Pattern', numRows: 4, numCols: 16, initial:[]},
        //swing1: {type: 'float', label: 'Swing1', min: 0, max: 1, initial: 0}
    }
    noteURLsNumbers = {}

    getNoteNumber(url) {
        if (this.noteURLsNumbers.hasOwnProperty(url)){
            return this.noteURLsNumbers[url]
        }
    }

    loadSoundInSampler(url) {
        if (!this.noteURLsNumbers.hasOwnProperty(url)){
            // Només carreguem el so si no estava carregat ja
            const note = Tone.Frequency(Object.keys(this.noteURLsNumbers).length, "midi").toNote();
            this.noteURLsNumbers[url] = note
            const buffer = new Tone.ToneAudioBuffer(url, () => {
                this.audioNodes.sampler.add(note, buffer);
            });
        }
    }

    buildEstacioAudioGraph(estacioMasterGainNode) {
        // Creem els nodes del graph
        this.audioNodes = {
            sampler: new Tone.Sampler().connect(estacioMasterGainNode),
        }
    }

    updateAudioGraphFromState(preset) {
        // Carreguem tots els sons de tots els presets (si n'hi ha de repetits es carregaran només un cop)
        // Ignorem l'argument "preset" perquè volem carregar tots els sons de tots els presets
        for (let i=0; i<this.numPresets; i++) {
            this.loadSoundInSampler(this.getParameterValue('sound1URL', i));
            this.loadSoundInSampler(this.getParameterValue('sound2URL', i));
            this.loadSoundInSampler(this.getParameterValue('sound3URL', i));
            this.loadSoundInSampler(this.getParameterValue('sound4URL', i));
        }
    }

    updateAudioGraphParameter(nomParametre, preset) {
        // Si el parametre que ha canviat és la URL d'un so, el carreguem al sampler
        // Per els altres parmetres no cal actualitzar res en el graph perquè els steps ja es llegeixen directament del store
        if (nomParametre === 'sound1URL' || nomParametre === 'sound2URL' || nomParametre === 'sound3URL' || nomParametre === 'sound4URL') {
            this.loadSoundInSampler(this.getParameterValue(nomParametre, preset))
        }
    }

    playSoundFromUrl(url, time) {
        const note = this.getNoteNumber(url)
        //let swing = this.getParameterValue ('swing1')
        if (note !== undefined){
            this.audioNodes.sampler.triggerAttack(note, time);
        }
        //this.audioNodes.sampler.Transport.swing = swing;

    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('pattern').numCols;
        const pattern = this.getParameterValue('pattern', this.currentPreset);
        const shouldPlaySound1 = indexOfArray(pattern, [0, currentStep]) > -1;
        const shouldPlaySound2 = indexOfArray(pattern, [1, currentStep]) > -1;
        const shouldPlaySound3 = indexOfArray(pattern, [2, currentStep]) > -1;
        const shouldPlaySound4 = indexOfArray(pattern, [3, currentStep]) > -1;
        if (shouldPlaySound1) {
            this.playSoundFromUrl(this.getParameterValue('sound1URL', this.currentPreset), time)
        }
        if (shouldPlaySound2) {
            this.playSoundFromUrl(this.getParameterValue('sound2URL', this.currentPreset), time)
        }
        if (shouldPlaySound3) {
            this.playSoundFromUrl(this.getParameterValue('sound3URL', this.currentPreset), time)
        }
        if (shouldPlaySound4) {
            this.playSoundFromUrl(this.getParameterValue('sound4URL', this.currentPreset), time)
        }
    }
}
