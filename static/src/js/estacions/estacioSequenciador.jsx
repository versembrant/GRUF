import * as Tone from 'tone'
import { EstacioHelperBase, registerEstacioHelperInstance } from "../estacions";

class EstacioSequenciadorHelper extends EstacioHelperBase {
    
    constructor() {
        super();
        this.tipus = 'sequenciador'
        this.versio = '0.1'
        this.numSteps = 16
        this.parametersData = {
            sound1URL: {type: 'text', initial: 'https://cdn.freesound.org/previews/0/808_797-hq.mp3'},
            sound1Steps: {type: 'steps', initial: new Array(this.numSteps).fill(0.0)},
            sound2URL: {type: 'text', initial: 'https://cdn.freesound.org/previews/561/561514_12517458-hq.mp3'},
            sound2Steps: {type: 'steps', initial: new Array(this.numSteps).fill(0.0)},
        }
    }

    loadSoundInSamplerNote(samplerNode, note, url, estacioObj) {
        if (estacioObj.volatileState.loadedSoundURLsPerNote[note] !== url) {
            // Només carreguem el so si no estava carregat ja
            const buffer = new Tone.ToneAudioBuffer(url, () => {
                samplerNode.add(note, buffer);
                
            });
            estacioObj.volatileState.loadedSoundURLsPerNote[note] = url;
        }
    }

    buildEstacioAudioGraph(estacioObj, estacioMasterGainNode) {
        // Inicialitzem estat volàtil
        estacioObj.volatileState = {
            currentStep: 0,
            loadedSoundURLsPerNote: {},
        }

        // Creem els nodes del graph
        const sampler = new Tone.Sampler().connect(estacioMasterGainNode);
        const loopSequencer = new Tone.Loop(time => {
            // Check if sounds should be played in the current step and do it
            const estacioObjState = estacioObj.store.getState();
            const shouldPlaySound1 = estacioObjState.sound1Steps[estacioObj.volatileState.currentStep] === 1;
            const shouldPlaySound2 = estacioObjState.sound2Steps[estacioObj.volatileState.currentStep] === 1;
            if (shouldPlaySound1) {
                sampler.triggerAttack("C4", time);
            }
            if (shouldPlaySound2) {
                sampler.triggerAttack("D#4", time);
            }
            // Advance current step and update volatile state
            estacioObj.volatileState.currentStep += 1;
            if (estacioObj.volatileState.currentStep >= this.numSteps) {
                estacioObj.volatileState.currentStep = 0;
            }
        }, "16n").start(0);

        return {
            sampler: sampler,
            loopSequencer: loopSequencer,
        }
    }

    updateAudioGraphFromState(audioGraphEstacio, estacioObj) {
        const estacioObjState = estacioObj.store.getState();        

        // Carreguem els sons al sampler
        this.loadSoundInSamplerNote(audioGraphEstacio.sampler, 'C4', estacioObjState.sound1URL, estacioObj);
        this.loadSoundInSamplerNote(audioGraphEstacio.sampler, 'D#4', estacioObjState.sound2URL, estacioObj);
    }

    updateAudioGraphParameter(audioGraphEstacio, estacioObj, nomParametre) {
        if (nomParametre === 'sound1URL') {
            this.loadSoundInSamplerNote(audioGraphEstacio.sampler, 'C4', estacioObjState.sound1URL, estacioObj);
        } else if (nomParametre === 'sound2URL') {
            this.loadSoundInSamplerNote(audioGraphEstacio.sampler, 'D#4', estacioObjState.sound2URL, estacioObj);
        }
        // Per els altres parmetres no cal actualitzar res en el graph perqupè els steps ja es llegeixen directament del store
    }
}

registerEstacioHelperInstance(new EstacioSequenciadorHelper());
