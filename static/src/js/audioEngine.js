import * as Tone from 'tone'
import { createStore, combineReducers } from "redux";
import { getCurrentSession } from './sessionManager'
import { socket } from './utils';

var audioContextIsReady = false;


export class AudioGraph {
    constructor() {
        this.remoteMainSequencerCurrentStep = -1;  // Aquest parametre no el posem a l'store perquè no volem que es propagui a la UI
        this.estacionsMasterGainNodes = {};

        // Inicialitza un redux store amb les propietats relacionades amb audio
        const defaultsForPropertiesInStore = {
            bpm: 120,
            masterGain: 1.0,
            gainsEstacions: {},
            mainSequencerCurrentStep: -1,
            graphIsBuilt: false,
            isMasterAudioEngine: true,
            audioEngineSyncedToRemote: true,
            running: false
        }
        const propertiesInStore = Object.keys(defaultsForPropertiesInStore);
        const reducers = {};
        propertiesInStore.forEach(propertyName => {
            reducers[propertyName] = (state = defaultsForPropertiesInStore[propertyName], action) => {
                switch (action.type) {
                    case 'SET_' + propertyName:
                    return action.value;
                    default:
                    return state;
                }
            }
        });
        this.store = createStore(combineReducers(reducers));

        console.log("Audio Graph initialized!")
    }

    setParametreInStore(nomParametre, valor) {
        this.store.dispatch({ type: `SET_${nomParametre}`, value: valor });
    }

    isRunning() {
        return this.store.getState().running;
    }

    graphIsBuilt() {
        return this.store.getState().graphIsBuilt;
    }

    isMasterAudioEngine() {
        return this.store.getState().isMasterAudioEngine;
    }

    setMasterAudioEngine(valor) {
        this.setParametreInStore('isMasterAudioEngine', valor);
    }

    audioEngineIsSyncedToRemote() {
        return this.store.getState().audioEngineSyncedToRemote;
    }
    
    setMainSequencerCurrentStep(currentStep) {
        this.mainSequencerCurrentStep = currentStep;
        if (this.isMasterAudioEngine()) {
            getCurrentSession().updateMasterSequencerCurrentStepInServer(this.mainSequencerCurrentStep);
        }
        this.setParametreInStore('mainSequencerCurrentStep', this.mainSequencerCurrentStep);
    }

    getMainSequencerCurrentStep() {
        return this.store.getState().mainSequencerCurrentStep
    }

    receiveRemoteMainSequencerCurrentStep(currentStep) {
        this.remoteMainSequencerCurrentStep = currentStep;
        if (!this.isMasterAudioEngine() && !this.isRunning() && this.audioEngineIsSyncedToRemote()){
            this.setParametreInStore('mainSequencerCurrentStep', this.remoteMainSequencerCurrentStep);
        }
    }

    getMasterGainNodeForEstacio(nomEstacio) {
        return this.estacionsMasterGainNodes[nomEstacio]
    }
    
    buildAudioGraph() {
        console.log("Building audio graph")
        this.setParametreInStore('graphIsBuilt', false);
        this.setMainSequencerCurrentStep(-1);

        // Setteja el bpm al valor guardat
        Tone.Transport.bpm.value = this.getBpm();
        
        // Crea node master gain (per tenir un volum general)
        this.masterGainNode = new Tone.Gain(this.getMasterGain()).toDestination();
        
        // Crea el node "loop" principal per marcar passos a les estacions que segueixen el sequenciador
        this.mainSequencer = new Tone.Loop(time => {
            if (this.isRunning()) {
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
        this.setParametreInStore('graphIsBuilt', true);
    }
    
    async startAudioContext() {
        if (audioContextIsReady === false){
            await Tone.start()
            console.log("Audio context started")
            audioContextIsReady = true;
        }
    }
    
    transportStart() {
        if (this.graphIsBuilt()) {
            console.log("Transport start")
            this.setParametreInStore('running', true);
            
            // Posiciona el current step del sequenciador a 0 (o a un altre valor si l'audio engine no és master i està synced amb un altre audio engine que sí que ho és)
            if (this.isMasterAudioEngine()){
                this.setMainSequencerCurrentStep(0);
            } else {
                if (this.audioEngineIsSyncedToRemote()){
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
        if (this.graphIsBuilt()) {
            console.log("Transport stop")
            this.setParametreInStore('running', false);
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                const estacio = getCurrentSession().getEstacio(nomEstacio);
                estacio.onTransportStop();
            });
            Tone.Transport.stop()
            this.setMainSequencerCurrentStep(-1);
        }
    }

    getMasterGain() {
        return this.store.getState().masterGain;
    }
    
    setMasterGain(gain) {
        this.setParametreInStore('masterGain', gain);
        if (this.graphIsBuilt()){
            this.masterGainNode.gain.value = gain;
        }
    }
    
    getBpm() {
        return this.store.getState().bpm;
    }
    
    setBpm(bpm) {
        this.setParametreInStore('bpm', bpm);
        if (this.graphIsBuilt()){
            Tone.Transport.bpm.rampTo(bpm);
        }
    }

    updateBpmInServer(bpm) {
        socket.emit('update_parametre_audio_transport', {session_id: getCurrentSession().getID(), nom_parametre: 'bpm', valor: bpm});
    }

    getGainsEstacions() {
        return this.store.getState().gainsEstacions;
    }
    
    setGainsEstacions(gainsEstacions) {
        this.setParametreInStore('gainsEstacions', gainsEstacions);
        if (this.graphIsBuilt()){
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                const gainNode = this.getMasterGainNodeForEstacio(nomEstacio);
                gainNode.gain.value = gainsEstacions[nomEstacio];
            })
        }
    }

    updateGainsEstacionsInServer(gainsEstacions) {
        socket.emit('update_parametre_audio_transport', {session_id: getCurrentSession().getID(), nom_parametre: 'gainsEstacions', valor: gainsEstacions});
    }

    
}

const audioGraph = new AudioGraph();

export const getAudioGraphInstance = () => {
    return audioGraph;
}

socket.on('update_master_sequencer_current_step', function (data) {
    getAudioGraphInstance().receiveRemoteMainSequencerCurrentStep(data.current_step);
});

socket.on('update_parametre_audio_transport', function (data) {
    // Some parameters have specific methods to set them because they also affect the audio graph, others just go to the state (but are actually not likely to be set from remote server)
    if (data.nom_parametre === 'bpm') {
        getAudioGraphInstance().setBpm(data.valor);
    } else if (data.nom_parametre === 'masterGain') {
        getAudioGraphInstance().setMasterGain(data.valor);
    } else if (data.nom_parametre === 'gainsEstacions') {
        getAudioGraphInstance().setGainsEstacions(data.valor);
    } else {
        getAudioGraphInstance().setParametreInStore(data.nom_parametre, data.valor);
    }
});