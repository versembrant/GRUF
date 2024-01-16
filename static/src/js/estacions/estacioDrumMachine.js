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
        pattern: {type: 'grid', label:'Pattern', numRows: 4, numCols: 16, initial:[]}
    }

    loadSoundInSamplerNote(note, url) {
        if (this.volatileState.loadedSoundURLsPerNote[note] !== url) {
            // Només carreguem el so si no estava carregat ja
            const buffer = new Tone.ToneAudioBuffer(url, () => {
                this.audioNodes.sampler.add(note, buffer);
                
            });
            this.volatileState.loadedSoundURLsPerNote[note] = url;
        }
    }

    buildEstacioAudioGraph(estacioMasterGainNode) {
        // Inicialitzem estat volàtil que utilizem per saber quins sons ja hem carregat al sampler
        this.volatileState = {
            loadedSoundURLsPerNote: {},
        }

        // Creem els nodes del graph
        this.audioNodes = {
            sampler: new Tone.Sampler().connect(estacioMasterGainNode),
        }
    }

    updateAudioGraphFromState() {
        // Carreguem els sons al sampler
        this.loadSoundInSamplerNote('C4', this.getParameterValue('sound1URL'));
        this.loadSoundInSamplerNote('C#4', this.getParameterValue('sound2URL'));
        this.loadSoundInSamplerNote('D4', this.getParameterValue('sound3URL'));
        this.loadSoundInSamplerNote('D#4', this.getParameterValue('sound4URL'));
    }

    updateAudioGraphParameter(nomParametre) {
        // Si el parametre que ha canviat és la URL d'un so, el carreguem al sampler
        // Per els altres parmetres no cal actualitzar res en el graph perqupè els steps ja es llegeixen directament del store
        if (nomParametre === 'sound1URL') {
            this.loadSoundInSamplerNote('C4', this.getParameterValue('sound1URL'));
        } else if (nomParametre === 'sound2URL') {
            this.loadSoundInSamplerNote('C#4', this.getParameterValue('sound2URL'));
        } else if (nomParametre === 'sound2URL') {
            this.loadSoundInSamplerNote('D4', this.getParameterValue('sound3URL'));
        } else if (nomParametre === 'sound2URL') {
            this.loadSoundInSamplerNote('D#4', this.getParameterValue('sound4URL'));
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('pattern').numCols;
        const pattern = this.getParameterValue('pattern');
        const shouldPlaySound1 = indexOfArray(pattern, [0, currentStep]) > -1;
        const shouldPlaySound2 = indexOfArray(pattern, [1, currentStep]) > -1;
        const shouldPlaySound3 = indexOfArray(pattern, [2, currentStep]) > -1;
        const shouldPlaySound4 = indexOfArray(pattern, [3, currentStep]) > -1;
        if (shouldPlaySound1) {
            this.audioNodes.sampler.triggerAttack("C4", time);
        }
        if (shouldPlaySound2) {
            this.audioNodes.sampler.triggerAttack("C#4", time);
        }
        if (shouldPlaySound3) {
            this.audioNodes.sampler.triggerAttack("D4", time);
        }
        if (shouldPlaySound4) {
            this.audioNodes.sampler.triggerAttack("D#4", time);
        }
    }
}
