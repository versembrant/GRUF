import * as Tone from 'tone'
import { EstacioBase, registerEstacioDisponible } from "../sessionManager";

const tipus = 'sequenciador'

class EstacioSequenciador extends EstacioBase {
    
    constructor(nom) {
        super(nom);
        this.tipus = tipus
        this.versio = '0.1'
        this.numSteps = 16
        this.parametersDescription = {
            sound1URL: {type: 'text', label: 'URL so 1', initial: 'https://cdn.freesound.org/previews/0/808_797-hq.mp3'},
            sound1Steps: {type: 'steps', label: 'Steps so 1', initial: new Array(this.numSteps).fill(0.0)},
            sound2URL: {type: 'text', label: 'URL so 2', initial: 'https://cdn.freesound.org/previews/561/561514_12517458-hq.mp3'},
            sound2Steps: {type: 'steps', label: 'Steps so 2', initial: new Array(this.numSteps).fill(0.0)},
        }
        this.updatesUiWithMainSequencer = true;
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
        this.loadSoundInSamplerNote('D#4', this.getParameterValue('sound2URL'));
    }

    updateAudioGraphParameter(nomParametre) {
        // Si el parametre que ha canviat és la URL d'un so, el carreguem al sampler
        // Per els altres parmetres no cal actualitzar res en el graph perqupè els steps ja es llegeixen directament del store
        if (nomParametre === 'sound1URL') {
            this.loadSoundInSamplerNote('C4', this.getParameterValue('sound1URL'));
        } else if (nomParametre === 'sound2URL') {
            this.loadSoundInSamplerNote('D#4', this.getParameterValue('sound2URL'));
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.numSteps;
        const shouldPlaySound1 = this.getParameterValue('sound1Steps')[currentStep] === 1;
        const shouldPlaySound2 = this.getParameterValue('sound2Steps')[currentStep] === 1;
        if (shouldPlaySound1) {
            this.audioNodes.sampler.triggerAttack("C4", time);
        }
        if (shouldPlaySound2) {
            this.audioNodes.sampler.triggerAttack("D#4", time);
        }
    }
}

registerEstacioDisponible(tipus, EstacioSequenciador);
