import * as Tone from 'tone'
import { createStore, combineReducers } from "redux";
import { getCurrentSession } from './sessionManager'
import { sendMessageToServer } from './serverComs';

var audioContextIsReady = false;

export const getAudioGraphInstance = () => {
    return audioGraph;
}

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
            playing: false,
            playingArranjement: false,
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
    }

    setParametreInStore(nomParametre, valor) {
        this.store.dispatch({ type: `SET_${nomParametre}`, value: valor });
    }

    isPlaying() {
        return this.store.getState().playing;
    }

    isPlayingArranjement() {
        return this.store.getState().playingArranjement;
    }

    isPlayingLive() {
        return !this.isPlayingArranjement();
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
            if (!getCurrentSession().localMode) {
                sendMessageToServer('update_master_sequencer_current_step', {session_id: getCurrentSession().getID(), current_step: currentStep});
            }
        }
        this.setParametreInStore('mainSequencerCurrentStep', this.mainSequencerCurrentStep);
    }

    getMainSequencerCurrentStep() {
        return this.store.getState().mainSequencerCurrentStep
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
            if (this.isPlaying()) {
                this.onMainSequencerTick(time)
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
            this.setParametreInStore('playing', true);
            
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
            this.setParametreInStore('playing', false);
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                const estacio = getCurrentSession().getEstacio(nomEstacio);
                estacio.onTransportStop();
            });
            Tone.Transport.stop()
            this.setMainSequencerCurrentStep(-1);
        }
    }

    onMainSequencerTick(time) {
        if (this.isPlayingLive()){
            // En mode live, trigueja el tick del sequenciador a totes les estacions
            // amb el referent de temps actual i el beat general. Les estacions s'encarreguen
            // de transformar el número de beat global a la seva duració interna
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                const estacio = getCurrentSession().getEstacio(nomEstacio);
                estacio.onSequencerTick(this.mainSequencerCurrentStep, time);
            });
        } else if (this.isPlayingArranjement()) {
            this.prepareEstacionsPresetsForArranjament();
            
            // En mode arranjament, calculem el beat intern que li tocaria a cada estació segons la seva duració,
            // i si hi ha clips de cada estació que s'haurien de reproduir en aquest beat global, els disparem
            const arranjament = getCurrentSession().getArranjament();
            arranjament.clips.forEach(clip => {
                if (clip.beatInici <= this.mainSequencerCurrentStep && (clip.duradaBeats + clip.beatInici) > this.mainSequencerCurrentStep){
                    const estacio = getCurrentSession().getEstacio(clip.estacio);
                    const beatIntern = this.mainSequencerCurrentStep - clip.beatInici;
                    estacio.onSequencerTick(beatIntern, time);
                }
            })
        }
    }

    prepareEstacionsPresetsForArranjament() {
        const arranjament = getCurrentSession().getArranjament();
        // Per cada estació, mirar si el preset triat és el preset que li toca segons l'arranjament o el següent
        // que s'haurà de reproduïr i es precarrga.
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            let presetToSet = undefined;
            // Buscar el proper preset (o l'actual) que s'haurà de reproduïr segons l'arranjament
            // Aquest codi només funciona si els clips estan ordenats per beatInici
            for (let i = 0; i < arranjament.clips.length; i++) {
                const clip = arranjament.clips[i];
                if ((clip.estacio == nomEstacio) && (this.mainSequencerCurrentStep < (clip.beatInici + clip.duradaBeats))) {
                    presetToSet = clip.preset;
                    break;
                }
            }
            const currentPreset = getCurrentSession().getSelectedPresetForEstacio(nomEstacio)
            if ((presetToSet !== undefined) && (currentPreset !== presetToSet)) {
                getCurrentSession().setSelectedPresetForEstacio(nomEstacio, presetToSet)
            }
        })
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

    updateParametreAudioGraph(nomParametre, valor) {
        if (!getCurrentSession().localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
            // locally before sending it to the sever and in this way the user experience is better as
            // parameter changes are more responsive
            if (getCurrentSession().performLocalUpdatesBeforeServerUpdates) {
                getAudioGraphInstance().receiveUpdateParametreAudioGraphFromServer(nomParametre, valor)
            }
            sendMessageToServer('update_parametre_audio_graph', {session_id: getCurrentSession().getID(), nom_parametre: nomParametre, valor: valor});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            getAudioGraphInstance().receiveUpdateParametreAudioGraphFromServer(nomParametre, valor)
        }
    }

    receiveUpdateParametreAudioGraphFromServer(nomParametre, valor) {
        // Some parameters have specific methods to set them because they also affect the audio graph, others just go to the state (but 
        // are actually not likely to be set from the remote server)
        if (nomParametre === 'bpm') {
            this.setBpm(valor);
        } else if (nomParametre === 'masterGain') {
            this.setMasterGain(valor);
        } else if (nomParametre === 'gainsEstacions') {
            this.setGainsEstacions(valor);
        } else {
            this.setParametreInStore(nomParametre, valor);
        }
    } 

    receiveRemoteMainSequencerCurrentStep(currentStep) {
        this.remoteMainSequencerCurrentStep = currentStep;
        if (!this.isMasterAudioEngine() && !this.isPlaying() && this.audioEngineIsSyncedToRemote()){
            this.setParametreInStore('mainSequencerCurrentStep', this.remoteMainSequencerCurrentStep);
        }
    }
}

const audioGraph = new AudioGraph();
