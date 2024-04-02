import * as Tone from 'tone';
import { createStore, combineReducers } from "redux";
import { getCurrentSession } from './sessionManager';
import { sendMessageToServer, getSocketID } from './serverComs';

var audioContextIsReady = false;

export const getAudioGraphInstance = () => {
    return audioGraph;
}

export class AudioGraph {
    constructor() {
        this.remoteMainSequencerCurrentStep = -1;  // Aquest parametre no el posem a l'store perquè no volem que es propagui a la UI
        this.estacionsMasterChannelNodes = {};

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
            swing: 0,
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

    getMasterChannelNodeForEstacio(nomEstacio) {
        return this.estacionsMasterChannelNodes[nomEstacio]
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

        // Crea uns efectes

        this.chorus = new Tone.Chorus({wet: 1, frequency: 4, depth: 0.5, delayTime: 2.5}).connect(this.masterGainNode).start();  // Aquest efecte necessita start() perquè sino el LFO intern no funciona
        this.chorusChannel = new Tone.Channel({ volume: 0 }).connect(this.chorus);
        this.chorusChannel.receive("chorus");
        
        this.reverb = new Tone.Reverb({wet: 1, decay: 5}).connect(this.masterGainNode);
        this.reverbChannel = new Tone.Channel({ volume: 0 }).connect(this.reverb);
        this.reverbChannel.receive("reverb");

        this.delay = new Tone.FeedbackDelay({wet: 1, delayTime: 60.0/this.getBpm(), feedback: 0.1}).connect(this.masterGainNode);
        this.delayChannel = new Tone.Channel({ volume: 0 }).connect(this.delay);
        this.delayChannel.receive("delay");

        // Crea els nodes de cada estació i crea un gain individual per cada node (i guarda una referència a cada gain node)
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            const estacioMasterChannel = new Tone.Channel().connect(this.masterGainNode);
            estacio.buildEstacioAudioGraph(estacioMasterChannel);
            estacio.updateAudioGraphFromState(estacio.currentPreset);
            this.estacionsMasterChannelNodes[nomEstacio] = estacioMasterChannel;
        })
        
        // Marca el graph com a construït
        this.setParametreInStore('graphIsBuilt', true);

        // Carrega els volumns dels channels de cada estació ara que els objectes ha estan creats
        getCurrentSession().liveSetGainsEstacions(getCurrentSession().rawData.live.gainsEstacions);
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
            // Primer settejem la propietat arranjamentPreset de totes les estacions a -1, més tard canviarem aquest valor si hi ha clips que s'han de 
            // reproduir en aquest beat. Això només ho fem servir per saber quan hem de pintar el playhead vermell a les estacions quan estiguem en mode arranjament.
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                getCurrentSession().getEstacio(nomEstacio).arranjementPreset = -1;
            })

            // En mode arranjament, calculem el beat intern que li tocaria a cada estació segons la seva duració,
            // i si hi ha clips de cada estació que s'haurien de reproduir en aquest beat global, els disparem
            getCurrentSession().getArranjamentClips().forEach(clip => {
                if (clip.beatInici <= this.mainSequencerCurrentStep && (clip.duradaBeats + clip.beatInici) > this.mainSequencerCurrentStep){
                    const estacio = getCurrentSession().getEstacio(clip.estacio);
                    const beatIntern = this.mainSequencerCurrentStep - clip.beatInici;
                    if (clip.preset !== estacio.currentPreset){
                        // If required preset not loaded, do it now
                        estacio.setCurrentPreset(clip.preset)
                    }
                    estacio.arranjementPreset = clip.preset // Això només ho fem servir per saber quan hem de pintar el playhead vermell a les estacions quan estiguem en mode arranjament.
                    estacio.onSequencerTick(beatIntern, time);
                }
            })

            // Check if we have to stop the arranjament
            if (this.mainSequencerCurrentStep >= (getCurrentSession().getArranjament().numSteps * getCurrentSession().getArranjament().beatsPerStep) -1){
                this.transportStop();
            }
        }
    }

    sendMidiEvent(nomEstacio, data, forwardToServer = false) {
        // MIDI notes require the less latency the better, so we always directly invoke the method "receiveMidiEventFromServer" even if we're
        // not in local mode. However, unlike other parameters, we can nto accept repeated note that would be cause by we calling 
        // "receiveMidiEventFromServer" and then "receiveMidiEventFromServer" being called again by the server when the note event hits the
        // server and is sent to all clients (including the client who sent it). To avoid this problem, we ignore received note messages 
        // that originate from the same client (the same socket ID)
        getAudioGraphInstance().receiveMidiEventFromServer(nomEstacio, data);
        if (!getCurrentSession().localMode && forwardToServer) {
            data.origin_socket_id = getSocketID();
            console.log("Sending MIDI event to server")
            sendMessageToServer('midi_event', {session_id: getCurrentSession().getID(), nom_estacio: nomEstacio, midi_event_data: data});
        }
    }

    receiveMidiEventFromServer(nomEstacio, data) {
        if ((!getCurrentSession().localMode) && (data.origin_socket_id === getSocketID())){
            // If message comes from same client, ignore it
            return;
        }
        if (nomEstacio !== undefined) {
            // If a nomEstacio is provided, only send to the estacio with that name
            getCurrentSession().getEstacio(nomEstacio).onMidiNote(data.noteNumber, data.velocity, data.type === 'noteOff');
        } else {
            // Otherwise send to all estacions
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                getCurrentSession().getEstacio(nomEstacio).onMidiNote(data.noteNumber, data.velocity, data.type === 'noteOff');
            });
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
            this.delay.delayTime.value = 60.0/bpm; // Fes que el delay time estigui sincronitzat amb el bpm
        }
    }

    getSwing(){
        return this.store.getState().swing;
    }

    setSwing(swing){
        this.setParametreInStore('swing', swing);
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
        } else if (nomParametre === 'swing'){
            this.setSwing(valor);
        }
        else {
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
