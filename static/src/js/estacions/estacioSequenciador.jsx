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
        // Inicialitzem estat volàtil
        this.volatileState = {
            currentStep: 0,
            loadedSoundURLsPerNote: {},
        }

        // Creem els nodes del graph
        const sampler = new Tone.Sampler().connect(estacioMasterGainNode);
        const loopSequencer = new Tone.Loop(time => {
            // Check if sounds should be played in the current step and do it
            const shouldPlaySound1 = this.getParameterValue('sound1Steps')[this.volatileState.currentStep] === 1;
            const shouldPlaySound2 = this.getParameterValue('sound2Steps')[this.volatileState.currentStep] === 1;
            if (shouldPlaySound1) {
                sampler.triggerAttack("C4", time);
            }
            if (shouldPlaySound2) {
                sampler.triggerAttack("D#4", time);
            }
            // Advance current step and update volatile state
            this.volatileState.currentStep += 1;
            if (this.volatileState.currentStep >= this.numSteps) {
                this.volatileState.currentStep = 0;
            }
        }, "16n").start(0);

        this.audioNodes = {
            sampler: sampler,
            loopSequencer: loopSequencer,
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
}

registerEstacioDisponible(tipus, EstacioSequenciador);
