import * as Tone from 'tone';
import { createStore, combineReducers } from "redux";
import { makePartial } from 'redux-partial';
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
        this.spectrumSize = 64;

        this.parametersDescription = {
            bpm: {type: 'float', min: 40, max: 300, initial: 90},
            masterGain: {type: 'float', min: 0.0, max: 1.0, initial: 1.0},
            masterPan: {type: 'float', min: -1.0, max: 1.0, initial: 0.0, label: "Pan"},
            gainsEstacions: {initial: {}},
            pansEstacions: {initial: {}},
            mutesEstacions: {initial: {}},
            solosEstacions: {initial: {}},
            mainSequencerCurrentStep: {type: 'int', initial: -1},
            isGraphBuilt: {type: 'bool', initial: false},
            isMasterAudioEngine: {type: 'bool', initial: true},
            isAudioEngineSyncedToRemote: {type: 'bool', initial: true},
            isPlaying: {type: 'bool', initial: false},
            isPlayingArranjament: {type: 'bool', initial: false},
            swing: {type: 'float', min: 0.0, max: 1.0, initial: 0.0},
            compas: {type: 'enum', options: ['2/4', '3/4', '4/4'], initial: '4/4'},
            tonality: {
                type: 'enum',
                options:['cmajor', 'cminor',
                    'c#major', 'c#minor',
                    'dmajor', 'dminor',
                    'ebmajor', 'ebminor',
                    'emajor', 'eminor',
                    'fmajor', 'fminor',
                    'f#major', 'f#minor',
                    'gmajor', 'gminor',
                    'abmajor', 'abminor',
                    'amajor', 'aminor',
                    'bbmajor', 'bbminor',
                    'bmajor', 'bminor'],
                initial: 'cminor'},
            effectParameters: {
                initial: {
                    reverbWet:0,
                    reverbDecay: 0.1,
                    delayWet: 0,
                    delayTime: 1,
                    delayFeedback:0,
                    drive: 0,
                    eq3HighGain: 0,
                    eq3MidGain: 0,
                    eq3LowGain: 0,
                }
            }
        }

        // Inicialitza un redux store amb les propietats relacionades amb audio
        const propertiesInStore = Object.keys(this.parametersDescription);
        const reducers = {};
        propertiesInStore.forEach(propertyName => {
            reducers[propertyName] = (state = this.parametersDescription[propertyName].initial, action) => {
                switch (action.type) {
                    case 'SET_' + propertyName:
                    return action.value;
                    default:
                    return state;
                }
            }
        });
        this.store = makePartial(createStore(combineReducers(reducers)));
    }

    getParameterDescription(parameterName) {
        return this.parametersDescription[parameterName]
    }

    setParametreInStore(nomParametre, valor) {
        this.store.dispatch({ type: `SET_${nomParametre}`, value: valor });
    }

    setParameterValue(nomParametre, valor) {
        const methodName = `set${nomParametre.charAt(0).toUpperCase() + nomParametre.slice(1)}`;
        this[methodName](valor);
    }

    getParameterValue(nomParametre) {
        const methodName =  nomParametre.startsWith('is') ? nomParametre : // for booleans
        `get${nomParametre.charAt(0).toUpperCase() + nomParametre.slice(1)}`; // for the rest
        return this[methodName]();
    }

    isPlaying() {
        return this.store.getState().isPlaying;
    }

    isPlayingArranjament() {
        return this.store.getState().isPlayingArranjament;
    }

    setIsPlayingArranjament(value) {
        this.setParametreInStore('isPlayingArranjament', value);
    }

    isPlayingLive() {
        return !this.isPlayingArranjament();
    }

    getMasterGain() {
        return this.store.getState().masterGain;
    }
    
    setMasterGain(gain) {
        this.setParametreInStore('masterGain', gain);
        if (!this.isGraphBuilt()) return;
        this.masterGainNode.volume.value = Tone.gainToDb(gain);
    }

    getMasterPan(){
        return this.store.getState().masterPan;
    }

    setMasterPan(pan){
        this.setParametreInStore('masterPan', pan);
        if (!this.isGraphBuilt()) return;
        this.masterGainNode.pan.setValueAtTime(pan, 0.05);
    }

    getMasterSpectrumSize() {
        return this.spectrumSize;
    }
    
    getMasterSpectrumData() {
        return this.masterSpectrum?.getValue(); // returns undefined if audiograph is not built
    }

    getBpm() {
        return this.store.getState().bpm;
    }
    
    setBpm(bpm) {
        this.setParametreInStore('bpm', bpm);
        if (!this.isGraphBuilt()) return;
        Tone.Transport.bpm.rampTo(bpm);
        this.delay.delayTime.value = 60.0/bpm; // Fes que el delay time estigui sincronitzat amb el bpm
    }

    getSwing(){
        return this.store.getState().swing;
    }

    setSwing(swing) {
        this.setParametreInStore('swing', swing);
    }

    getCompas(){
        return this.store.getState().compas;
    }

    setCompas(compas) {
        this.setParametreInStore('compas', compas);
    }

    getTonality(){
        return this.store.getState().tonality;
    }

    setTonality(tonality) {
        this.setParametreInStore('tonality', tonality);
    }

    getNumSteps (nCompassos = 2){
        const compas = this.getCompas();
        const beatsPerBar = parseInt(compas.slice(0,1));
        const stepsPerBeat = 4;
        return beatsPerBar * stepsPerBeat * nCompassos;
    }

    isGraphBuilt() {
        return this.store.getState().isGraphBuilt;
    }

    isMasterAudioEngine() {
        return this.store.getState().isMasterAudioEngine;
    }

    setMasterAudioEngine(valor) {
        this.setParametreInStore('isMasterAudioEngine', valor);
        console.log("Master audio engine: ", this.isMasterAudioEngine())
    }

    isAudioEngineSyncedToRemote() {
        return this.store.getState().isAudioEngineSyncedToRemote;
    }
    
    setMainSequencerCurrentStep(currentStep) {
        this.mainSequencerCurrentStep = currentStep;
        if (this.isMasterAudioEngine() && !getCurrentSession().localMode) {
            sendMessageToServer('update_master_sequencer_current_step', {current_step: currentStep});
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
        if (!this.isGraphBuilt()) return {"db": -60, "gain": 0};
        const dBFSLevel = this.estacionsMeterNodes[nomEstacio].getValue();
        const dBuLevel = dBFSLevel + 18;
        const gainLevel = Tone.dbToGain(dBFSLevel)
        return {"db": clamp(dBuLevel, -60, 6), "gain": clamp(gainLevel, 0, 1)};
    }

    getCurrentMasterLevelStereo() {
        if (!this.isGraphBuilt()) return {
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
        if (!this.isGraphBuilt()) return false;
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
        if (!this.isGraphBuilt()) return;
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
        this.setParametreInStore('isGraphBuilt', false);
        this.setMainSequencerCurrentStep(-1);

        // Setteja el bpm al valor guardat
        Tone.Transport.bpm.value = this.getBpm();

        // Crea els nodes master  (per tenir un controls general)
        this.masterMeterNode = new Tone.Meter({ channels:2, channelCount: 2 });
        this.masterLimiter = new Tone.Limiter(-1).toDestination();
        this.masterGainNode = new Tone.Channel({
            channelCount: 2,
            volume: this.getMasterGain(),
            pan: this.getMasterPan(),
        }).chain(this.masterMeterNode, this.masterLimiter);

        this.masterSpectrum = new Tone.Analyser('fft', this.spectrumSize);
        this.masterGainNode.connect(this.masterSpectrum);

        // Crea el node "loop" principal per marcar passos a les estacions que segueixen el sequenciador
        this.mainSequencer = new Tone.Loop(time => {
            if (this.isPlaying()) this.onMainSequencerTick(time);
        }, "16n").start(0);

        // Inicialitzem els efectes
        this.initEffects();

        // Crea els nodes de cada estació i crea un gain individual per cada node (i guarda una referència a cada gain node)
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            const estacioMasterChannel = new Tone.Channel({channelCount: 2}).connect(this.masterGainNode);
            const estacioPremuteChannel = new Tone.Channel();
            const estacioMeterNode = new Tone.Meter();
            estacioPremuteChannel.connect(estacioMasterChannel);
            estacioPremuteChannel.connect(estacioMeterNode);
            estacio.buildEstacioAudioGraph(estacioPremuteChannel);
            estacio.updateAudioGraphFromState(estacio.currentPreset);
            this.estacionsMasterChannelNodes[nomEstacio] = estacioMasterChannel;
            this.estacionsMeterNodes[nomEstacio] = estacioMeterNode;
        })
        
        // Marca el graph com a construït
        this.setParametreInStore('isGraphBuilt', true);

        // Carrega els volumns, pans, mute i solo dels channels de cada estació ara que els objectes ha estan creats
        getCurrentSession().setLiveGainsEstacions(getCurrentSession().rawData.live.gainsEstacions);
        getCurrentSession().setLivePansEstacions(getCurrentSession().rawData.live.pansEstacions);
        getCurrentSession().setLiveMutesEstacions(getCurrentSession().rawData.live.mutesEstacions);
        getCurrentSession().setLiveSolosEstacions(getCurrentSession().rawData.live.solosEstacions);

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
        if (!this.isGraphBuilt()) return;
        console.log("Transport start")
        this.setParametreInStore('isPlaying', true);

        // Posiciona el current step del sequenciador a 0 (o a un altre valor si l'audio engine no és master i està synced amb un altre audio engine que sí que ho és)
        if (this.isMasterAudioEngine() || !this.isAudioEngineSyncedToRemote()){
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
        if (!this.isGraphBuilt()) return;
        console.log("Transport stop")
        this.setParametreInStore('isPlaying', false);
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            estacio.onTransportStop();
        });
        Tone.Transport.stop()
        this.setMainSequencerCurrentStep(-1);

        this.updateParametreAudioGraph('isPlayingArranjament', false);
    }

    onMainSequencerTick(time) {
        this.setMainSequencerCurrentStep(this.mainSequencerCurrentStep + 1); // primer, actualitzem el current step
        // després, enviem aquesta dada a on calgui
        if (this.isPlayingLive()){
            // En mode live, trigueja el tick del sequenciador a totes les estacions
            // amb el referent de temps actual i el beat general. Les estacions s'encarreguen
            // de transformar el número de beat global a la seva duració interna
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                const estacio = getCurrentSession().getEstacio(nomEstacio);
                estacio.onSequencerTick(this.mainSequencerCurrentStep, time);
            });
        } else if (this.isPlayingArranjament()) {
            // Primer settejem la propietat arranjamentPreset de totes les estacions a -1, més tard canviarem aquest valor si hi ha clips que s'han de 
            // reproduir en aquest beat. Això només ho fem servir per saber quan hem de pintar el playhead vermell a les estacions quan estiguem en mode arranjament.
            getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                getCurrentSession().getEstacio(nomEstacio).arranjamentPreset = -1;
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
                    estacio.arranjamentPreset = clip.preset // Això només ho fem servir per saber quan hem de pintar el playhead vermell a les estacions quan estiguem en mode arranjament.
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
        sendMessageToServer('midi_event', {nom_estacio: nomEstacio, midi_event_data: data});
    }

    receiveMidiEventFromServer(nomEstacio, data) {
        
        if ((!getCurrentSession().localMode) && (data.origin_socket_id === getSocketID())){
            // If message comes from same client, ignore it (see comment in sendMidiEvent)
            return;
        }

        // If a nomEstacio is provided, only send to the estacio with that name. Otherwise send to all estacions
        const targetStationsNoms = nomEstacio ? [nomEstacio] : getCurrentSession().getNomsEstacions();
        targetStationsNoms.forEach(nomEstacio => {
                const {noteNumber, velocity, type, ...extras} = data;
                getCurrentSession().getEstacio(nomEstacio).onMidiNote(noteNumber, velocity, type === 'noteOff', {...extras, skipRecording: false});
        });

        //Aquest event s'utilitza en el piano roll per dibuixar els requadres sobre les notes que s'estan tocant
        // i en el grid de pads del sampler per seleccionar el pad de l'última nota que s'ha tocat
        if (!data.skipTriggerEvent) {    
            const event = new CustomEvent("midiNote-" + nomEstacio, { detail: {note: data.noteNumber, velocity: data.noteVelocity, type: data.type }});
            document.dispatchEvent(event);
        }
    }

    updateParametreAudioGraph(nomParametre, valor) {
        if (getCurrentSession().localMode || getCurrentSession().performLocalUpdatesBeforeServerUpdates) {
            getAudioGraphInstance().receiveUpdateParametreAudioGraphFromServer(nomParametre, valor, null);
        }
        if (getCurrentSession().localMode) return;
        // In remote mode, we send parameter update to the server and the server will send it back
        // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
        // locally before sending it to the sever and in this way the user experience is better as
        // parameter changes are more responsive
        sendMessageToServer('update_parametre_audio_graph', {nom_parametre: nomParametre, valor: valor});
    }
    receiveUpdateParametreAudioGraphFromServer(nomParametre, valor, originSocketID) {
        if (getCurrentSession().performLocalUpdatesBeforeServerUpdates && originSocketID === getSocketID()) return;
        this.setParameterValue(nomParametre, valor);
    }

    receiveRemoteMainSequencerCurrentStep(currentStep) {
        this.remoteMainSequencerCurrentStep = currentStep;
        if (!this.isMasterAudioEngine() && !this.isPlaying() && this.isAudioEngineSyncedToRemote()){
            this.setParametreInStore('mainSequencerCurrentStep', this.remoteMainSequencerCurrentStep);
        }
    }
}

const audioGraph = new AudioGraph();
