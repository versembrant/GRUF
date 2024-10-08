import * as Tone from 'tone';
import { createStore, combineReducers } from "redux";
import { getCurrentSession } from './sessionManager';
import { sendMessageToServer, getSocketID } from './serverComs';
import { clamp } from './utils';

var audioContextIsReady = false;

export const getAudioGraphInstance = () => {
    return audioGraph;
}

export class AudioGraph {
    constructor() {
        this.remoteMainSequencerCurrentStep = -1;  // Aquest parametre no el posem a l'store perquè no volem que es propagui a la UI
        this.estacionsMasterChannelNodes = {};
        this.estacionsMeterNodes = {};

        // Inicialitza un redux store amb les propietats relacionades amb audio
        const defaultsForPropertiesInStore = {
            bpm: 120,
            masterGain: 1.0,
            masterPan:0.0,
            gainsEstacions: {},
            mutesEstacions: {},
            solosEstacions: {},
            mainSequencerCurrentStep: -1,
            graphIsBuilt: false,
            isMasterAudioEngine: true,
            audioEngineSyncedToRemote: true,
            playing: false,
            playingArranjement: false,
            swing: 0,
            compas: '4/4',
            tonality : 'cmajor',
            effectParameters: {
                reverbWet:0,
                reverbDecay: 0.1,
                delayWet: 0,
                delayTime: 1,
                delayFeedback:0,
                drive: 0,
                eq3HighGain: 0,
                eq3MidGain: 0,
                eq3LowGain: 0,
            },
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
        console.log("Master audio engine: ", this.isMasterAudioEngine())
    }

    audioEngineIsSyncedToRemote() {
        return this.store.getState().audioEngineSyncedToRemote;
    }
    
    setMainSequencerCurrentStep(currentStep) {
        this.mainSequencerCurrentStep = currentStep;
        if (this.isMasterAudioEngine() && !getCurrentSession().localMode) {
            sendMessageToServer('update_master_sequencer_current_step', {session_id: getCurrentSession().getID(), current_step: currentStep});
        }
        this.setParametreInStore('mainSequencerCurrentStep', this.mainSequencerCurrentStep);
    }

    getMainSequencerCurrentStep() {
        return this.store.getState().mainSequencerCurrentStep
    }

    getMasterChannelNodeForEstacio(nomEstacio) {
        return this.estacionsMasterChannelNodes[nomEstacio]
    }

    getCurrentLevelEstacio(nomEstacio) {
        if (!this.graphIsBuilt()) return {"db": -60, "gain": 0};
        const dBFSLevel = this.estacionsMeterNodes[nomEstacio].getValue();
        const dBuLevel = dBFSLevel + 18;
        const gainLevel = Tone.dbToGain(dBFSLevel)
        return {"db": clamp(dBuLevel, -60, 6), "gain": clamp(gainLevel, 0, 1)};
    }

    getCurrentMasterLevelStereo() {
        if (!this.graphIsBuilt()) return {
            left: { db: -60, gain: 0 },
            right: { db: -60, gain: 0 }
        };
        const levels = this.masterMeterNode.getValue();
        const leftChannelLevel = levels[0];
        const rightChannelLevel = levels[1];

        const dBuLeft = leftChannelLevel + 18;
        const dBuRight = rightChannelLevel + 18;

        return {
            left: {
                db: clamp(dBuLeft, -60, 6),
                gain: clamp(Tone.dbToGain(dBuLeft), 0, 1),
            },
            right: {
                db: clamp(dBuRight, -60, 6),
                gain: clamp(Tone.dbToGain(dBuRight), 0, 1),
            }
        };
    }

    isMutedEstacio(nomEstacio) {
        if (!this.graphIsBuilt()) return false;
        return this.getMasterChannelNodeForEstacio(nomEstacio).mute;
    }

    //Creem uns efectes
    initEffects(){
        this.reverb = new Tone.Reverb().connect(this.masterGainNode);
        this.reverbChannel = new Tone.Channel({ volume: 0 }).connect(this.reverb);
        this.reverbChannel.receive("reverb");

        this.delay = new Tone.FeedbackDelay().connect(this.masterGainNode);
        this.delayChannel = new Tone.Channel({ volume: 0 }).connect(this.delay);
        this.delayChannel.receive("delay");

        this.drive = new Tone.Distortion().connect(this.masterGainNode);
        this.driveChannel = new Tone.Channel({ volume: 0 }).connect(this.drive);
        this.driveChannel.receive("drive");

        this.eq3 = new Tone.EQ3().connect(this.masterGainNode);
        this.eq3Channel = new Tone.Channel({ volume: 0 }).connect(this.eq3);
        this.eq3Channel.receive("eq3");
    }

    applyEffectParameters(effectParams) {
        if (!this.graphIsBuilt()) return;
        this.reverb.wet.value = effectParams.reverbWet;
        this.reverb.decay = effectParams.reverbDecay;
        this.delay.wet.value = effectParams.delayWet;
        this.delay.delayTime.value = 60/ (this.getBpm() * effectParams.delayTime);
        this.delay.feedback.value = effectParams.delayFeedback;
        this.drive.distortion = effectParams.drive;
        this.eq3.set({
            low: effectParams.eq3LowGain,
            mid: effectParams.eq3MidGain,
            high: effectParams.eq3HighGain
        });
    }

    setEffectParameters(newEffectParameters) {
        this.setParametreInStore('effectParameters', newEffectParameters);
        this.applyEffectParameters(newEffectParameters);
    }

    getEffectParameters() {
        return this.store.getState().effectParameters;
    }
    
    buildAudioGraph() {
        console.log("Building audio graph")
        this.setParametreInStore('graphIsBuilt', false);
        this.setMainSequencerCurrentStep(-1);

        // Setteja el bpm al valor guardat
        Tone.Transport.bpm.value = this.getBpm();

        // Crea els nodes master  (per tenir un controls general)
        this.masterMeterNode = new Tone.Meter({ channels:2 });
        this.masterLimiter = new Tone.Limiter(-1).toDestination();
        //this.masterPanNode = new Tone.Panner().connect(this.masterLimiter);
        this.masterGainNode = new Tone.Channel({
            volume: this.getMasterGain(),
            pan: this.getMasterPan(),
        }).chain(this.masterMeterNode, this.masterLimiter);

        // Crea el node "loop" principal per marcar passos a les estacions que segueixen el sequenciador
        this.mainSequencer = new Tone.Loop(time => {
            if (this.isPlaying()) {
                this.onMainSequencerTick(time)
                this.setMainSequencerCurrentStep(this.mainSequencerCurrentStep + 1)
            }
        }, "16n").start(0);

        // Inicialitzem els efectes
        this.initEffects();

        // Crea els nodes de cada estació i crea un gain individual per cada node (i guarda una referència a cada gain node)
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            const estacioMasterChannel = new Tone.Channel().connect(this.masterGainNode);
            const estacioPremuteChannel = new Tone.Gain().connect(estacioMasterChannel);
            const estacioMeterNode = new Tone.Meter();
            estacioPremuteChannel.connect(estacioMeterNode);
            estacio.buildEstacioAudioGraph(estacioPremuteChannel);
            estacio.updateAudioGraphFromState(estacio.currentPreset);
            this.estacionsMasterChannelNodes[nomEstacio] = estacioMasterChannel;
            this.estacionsMeterNodes[nomEstacio] = estacioMeterNode;
        })
        
        // Marca el graph com a construït
        this.setParametreInStore('graphIsBuilt', true);

        // Carrega els volumns, mute i solo dels channels de cada estació ara que els objectes ha estan creats
        getCurrentSession().liveSetGainsEstacions(getCurrentSession().rawData.live.gainsEstacions);
        getCurrentSession().liveSetMutesEstacions(getCurrentSession().rawData.live.mutesEstacions);
        getCurrentSession().liveSetSolosEstacions(getCurrentSession().rawData.live.solosEstacions);

        // Carrega els paràmetres dels efectes
        this.applyEffectParameters(this.getEffectParameters());
    }
    
    async startAudioContext() {
        if (audioContextIsReady) return;
        await Tone.start()
        console.log("Audio context started")
        audioContextIsReady = true;
    }

    transportStart() {
        if (!this.graphIsBuilt()) return;
        console.log("Transport start")
        this.setParametreInStore('playing', true);

        // Posiciona el current step del sequenciador a 0 (o a un altre valor si l'audio engine no és master i està synced amb un altre audio engine que sí que ho és)
        if (this.isMasterAudioEngine() || !this.audioEngineIsSyncedToRemote()){
            this.setMainSequencerCurrentStep(0);
        } else {
            this.setMainSequencerCurrentStep(this.remoteMainSequencerCurrentStep > -1 ? this.remoteMainSequencerCurrentStep : 0);
        }

        // Trigueja el transport start a totes les estacions i el transport general
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            estacio.onTransportStart();
        });
        Tone.Transport.start();
    }
    
    transportStop() {
        if (!this.graphIsBuilt()) return;
        console.log("Transport stop")
        this.setParametreInStore('playing', false);
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            estacio.onTransportStop();
        });
        Tone.Transport.stop()
        this.setMainSequencerCurrentStep(-1);

        this.updateParametreAudioGraph('playingArranjement', false);
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
        // not in local mode. However, unlike other parameters, we can not accept repeated note that would be cause by we calling 
        // "receiveMidiEventFromServer" and then "receiveMidiEventFromServer" being called again by the server when the note event hits the
        // server and is sent to all clients (including the client who sent it). To avoid this problem, we ignore received note messages 
        // that originate from the same client (the same socket ID)
        getAudioGraphInstance().receiveMidiEventFromServer(nomEstacio, data);
        if (getCurrentSession().localMode || !forwardToServer) return;
        data.origin_socket_id = getSocketID();
        console.log("Sending MIDI event to server")
        sendMessageToServer('midi_event', {session_id: getCurrentSession().getID(), nom_estacio: nomEstacio, midi_event_data: data});
    }

    receiveMidiEventFromServer(nomEstacio, data) {
        
        if ((!getCurrentSession().localMode) && (data.origin_socket_id === getSocketID())){
            // If message comes from same client, ignore it (see comment in sendMidiEvent)
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

        //Aquest event s'utilitza en el piano roll per dibuixar els requadres sobre les notes que s'estan tocant
        if (!data.skipTriggerEvent) {    
            const event = new CustomEvent("midiNoteOn-" + nomEstacio, { detail: {note: data.noteNumber, velocity: data.noteVelocity }});
            document.dispatchEvent(event);
        }
    }

    getMasterGain() {
        return this.store.getState().masterGain;
    }
    
    setMasterGain(gain) {
        this.setParametreInStore('masterGain', gain);
        if (!this.graphIsBuilt()) return;
        this.masterGainNode.volume.value = Tone.gainToDb(gain);
    }

    getMasterPan(){
        return this.store.getState().masterPan;
    }

    setMasterPan(pan){
        this.setParametreInStore('masterPan', pan);
        if (!this.graphIsBuilt()) return;
        this.masterGainNode.pan.setValueAtTime(pan, 0.05);
    }
    
    getBpm() {
        return this.store.getState().bpm;
    }
    
    setBpm(bpm) {
        this.setParametreInStore('bpm', bpm);
        if (!this.graphIsBuilt()) return;
        Tone.Transport.bpm.rampTo(bpm);
        this.delay.delayTime.value = 60.0/bpm; // Fes que el delay time estigui sincronitzat amb el bpm
    }

    getSwing(){
        return this.store.getState().swing;
    }

    getCompas(){
        return this.store.getState().compas;
    }

    getTonality(){
        return this.store.getState().tonality;
    }

    getNumSteps (nCompassos = 2){

        const compas = this.getCompas();
        if (compas === '2/4'){
            return 8 * nCompassos;
        } 
        else if (compas === '3/4') {
            return 12 * nCompassos;
        }
        else if (compas === '4/4') {
            return 16 * nCompassos;
        }
    } 

    getPanForEstacio(nomEstacio) {
        return this.estacionsMasterChannelNodes[nomEstacio]?.pan?.value || 0; // Retorna el valor del panning o 0 si no està definit
    }

    setPanForEstacio(nomEstacio, panValue) {
        const channelNode = this.estacionsMasterChannelNodes[nomEstacio];
        if (!channelNode) return;
        channelNode.pan.value = panValue; // Ajusta el panning
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
        this.setParametre(nomParametre, valor);
    }

    setParametre(nomParametre, valor) {
        // Some parameters have specific methods to set them because they also affect the audio graph, others just go to the state (but 
        // are actually not likely to be set from the remote server)
        const effectKey = nomParametre.split('.')[1];
        switch (nomParametre) {
            case 'bpm':
            this.setBpm(valor);
            break;
            case 'masterGain':
            this.setMasterGain(valor);
            case 'masterAudioEngine':
            this.setMasterAudioEngine(valor);
            break;
            case 'effectParameters':
            this.setEffectParameters(valor);
            break;
            default:
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
