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

    getAudioGraph(estacioObj) {
        // Init volatile state
        estacioObj.volatileState = {
            currentStep: 0,
            loadedSound1URL: "",
            loadedSound2URL: "",
        }
        const estacioObjState = estacioObj.store.getState();

        // Create sampler and add initial sounds
        const sampler = new Tone.Sampler().toDestination();
        const bufferSound1 = new Tone.ToneAudioBuffer(estacioObjState.sound1URL, () => {
            sampler.add('C4', bufferSound1);
            estacioObj.volatileState.loadedSound1URL = estacioObjState.sound1URL;
        });
        const bufferSound2 = new Tone.ToneAudioBuffer(estacioObjState.sound2URL, () => {
            sampler.add('D#4', bufferSound2);
            estacioObj.volatileState.loadedSound2URL = estacioObjState.sound2URL;
        });

        // Create loop sequencer
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
        };
    }

    updateAudioGraph(audioGraphEstacio, estacioObj, nomParametre, valor) {
        
        if (nomParametre === 'sound1URL') {
            if (valor !== estacioObj.volatileState.loadedSound1URL) {
                const buffer = new Tone.ToneAudioBuffer(valor, () => {
                    audioGraphEstacio.sampler.add('C4', buffer);
                    estacioObj.volatileState.loadedSound1URL = valor;
                });
            }
        } else if (nomParametre === 'sound2URL') {
            if (valor !== estacioObj.volatileState.loadedSound2URL) {
                const buffer = new Tone.ToneAudioBuffer(valor, () => {
                    audioGraphEstacio.sampler.add('D#4', buffer);
                    estacioObj.volatileState.loadedSound2URL = valor;
                });
            }
        }
        // Per els altres parmetres no cal actualitzar res en el graph perqupè els steps ja es llegeixen directament del store
    }
}

registerEstacioHelperInstance(new EstacioSequenciadorHelper());
