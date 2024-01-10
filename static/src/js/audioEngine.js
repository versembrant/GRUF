import * as Tone from 'tone'
import { getCurrentSession } from './sessionManager'
import { socket } from './utils';

var audioContextIsReady = false;


export class AudioGraph {
    constructor() {
        this.graphIsBuilt = false;
        this.isMasterAudioEngine = true;
        this.audioEngineSyncedToRemote = true;
        this.remoteMainSequencerCurrentStep = -1;
        this.running = false;

        console.log("Audio Graph initialized!")
    }
    
    setMainSequencerCurrentStep(currentStep) {
        this.mainSequencerCurrentStep = currentStep;
        if (this.isMasterAudioEngine === true) {
            socket.emit('update_master_sequencer_current_step', {session_uuid: getCurrentSession().getUUID(), current_step: this.mainSequencerCurrentStep});
        }
        getCurrentSession().store.dispatch({ type: 'SET_mainSequencerCurrentStep', value: this.mainSequencerCurrentStep });
    }

    receiveRemoteMainSequencerCurrentStep(currentStep) {
        this.remoteMainSequencerCurrentStep = currentStep;
        if (!this.isMasterAudioEngine && !this.running && this.audioEngineSyncedToRemote){
            getCurrentSession().store.dispatch({ type: 'SET_mainSequencerCurrentStep', value: this.remoteMainSequencerCurrentStep });
        }
    }
    
    buildAudioGraph() {
        console.log("Building audio graph")
        this.estacionsMasterGainNodes = {};
        this.graphIsBuilt = false;
        this.setMainSequencerCurrentStep(-1);
        
        // Crea node master gain (per tenir un volum general)
        this.masterGainNode = new Tone.Gain(1.0).toDestination();
        
        // Crea el node "loop" principal per marcar passos a les estacions que segueixen el sequenciador
        this.mainSequencer = new Tone.Loop(time => {
            if (this.running) {
                // Call sequencer tick functions on all stations
                getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                    const estacio = getCurrentSession().getEstacio(nomEstacio);
                    estacio.onSequencerTick(this.mainSequencerCurrentStep, time);
                });

                // Advance master sequencer current step
                this.setMainSequencerCurrentStep(this.mainSequencerCurrentStep + 1)
            }
        }, "16n").start(0);
        
        // Crea els nodes de cada estació i crea un gain individual per cada node (i guarda una referència a cada gain node)
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            const estacioMasterGainNode = new Tone.Gain(1.0).connect(this.masterGainNode);
            estacio.buildEstacioAudioGraph(estacioMasterGainNode);
            estacio.updateAudioGraphFromState();
            this.estacionsMasterGainNodes[nomEstacio] = estacioMasterGainNode;
        })
        
        // Marca el graph com a construït
        this.graphIsBuilt = true;
    }
    
    async startAudioContext() {
        if (audioContextIsReady === false){
            await Tone.start()
            console.log("Audio context started")
            audioContextIsReady = true;
        }
    }
    
    transportStart() {
        if (this.graphIsBuilt === true) {
            console.log("Transport start")
            this.running = true;
            
            // Posiciona el current step del sequenciador a 0 (o a un altre valor si l'audio engine no és master i està synced amb un altre audio engine que sí que ho és)
            if (this.isMasterAudioEngine){
                this.setMainSequencerCurrentStep(0);
            } else {
                if (this.audioEngineSyncedToRemote){
                    this.setMainSequencerCurrentStep(this.remoteMainSequencerCurrentStep > -1 ? this.remoteMainSequencerCurrentStep : 0);
                } else {
                    this.setMainSequencerCurrentStep(0);
                }
            }
            
            // Trigueja el transport start a totes les estacions i el transport general
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                const estacio = getCurrentSession().getEstacio(nomEstacio);
                estacio.onTransportStart();
            });
            Tone.Transport.start()
        }
    }
    
    transportStop() {
        if (this.graphIsBuilt === true) {
            console.log("Transport stop")
            this.running = false;
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                const estacio = getCurrentSession().getEstacio(nomEstacio);
                estacio.onTransportStop();
            });
            Tone.Transport.stop()
            this.setMainSequencerCurrentStep(-1);
        }
    }
    
    getMasterGain() {
        return this.masterGainNode.gain.value;
    }
    
    setMasterGain(gain) {
        this.masterGainNode.gain.rampTo(gain);
    }
    
    getBpm() {
        return Tone.Transport.bpm.value;
    }
    
    setBpm(bpm) {
        Tone.Transport.bpm.rampTo(bpm);
    }
}

const audioGraph = new AudioGraph();

export const getAudioGraphInstance = () => {
    return audioGraph;
}

socket.on('update_master_sequencer_current_step', function (data) {
    audioGraph.receiveRemoteMainSequencerCurrentStep(data.current_step);
});