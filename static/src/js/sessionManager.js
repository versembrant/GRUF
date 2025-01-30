import * as Tone from 'tone';
import { createStore, combineReducers } from "redux";
import { makePartial } from 'redux-partial';
import { sendMessageToServer, getSocketID } from "./serverComs";
import { ensureValidValue, units } from "./utils";
import { getAudioGraphInstance } from "./audioEngine";

var currentSession = undefined; 

export const getCurrentSession = () => {
    return currentSession;
}

export const setCurrentSession = (session) => {
    currentSession = session;
}

export const updateCurrentSessionWithNewData = (data) => {
    console.log('Updating current session with new data')
    
    // Update session data
    currentSession.rawData = data;

    // Update session store parameters
    currentSession.propertiesInStore.forEach(propertyName => {
        currentSession.setParametreInStore(propertyName, data[propertyName]);
    })

    // Update estacions parameters
    currentSession.getNomsEstacions().forEach(nomEstacio => {
        const estacio = currentSession.getEstacio(nomEstacio);
        const receivedParametresEstacio = data.estacions[nomEstacio].parametres;
        Object.keys(receivedParametresEstacio).forEach(nomParametreEstacio => {
            estacio.setParametreInStore(nomParametreEstacio, receivedParametresEstacio[nomParametreEstacio])
        })
    })
}

export const estacionsDisponibles = {};

export const registerEstacioDisponible = (estacioClass) => {
    const tipusEstacio = new estacioClass().tipus;
    estacionsDisponibles[tipusEstacio] = estacioClass;
}

let saveSessionAfterLoad = false;

export const shouldSaveSessionAfterLoad = () => {
    return saveSessionAfterLoad;
}

export class EstacioBase {

    tipus = 'base'
    versio = '0.0'
    static parametersDescription = {
        gain: {type: 'float', label: 'Volume', live: true, min: 0, max: 1, initial: 1},
        pan: {type: 'float', label: 'Pan', live: true, min: -1, max: 1, initial: 0},
        isRecording:{type: 'bool', initial: false, local: true},
        fxDrive:{type: 'float', label: 'Drive', min: 0.0, max: 1.0, initial: 0.0},
        fxEqOnOff: {type : 'bool', label: 'EQ On/Off', initial: true},
        fxLow:{type: 'float', label: 'Low', unit: units.decibel, min: -12, max: 12, initial: 0.0},
        fxMid:{type: 'float', label: 'Mid', unit: units.decibel, min: -12, max: 12, initial: 0.0},
        fxHigh:{type: 'float', label: 'High', unit: units.decibel, min: -12, max: 12, initial: 0.0},
        fxReverbASend: {type: 'float', label: 'Reverb A Send', min: -60, max: 6, initial: -60},
        fxDelayASend: {type: 'float', label: 'Delay A Wet', min: -60, max: 6, initial: -60},
    }
    store = undefined
    audioNodes = {}
    volatileState = {}
    numPresets = 4
    currentPreset = -1

    constructor(nom) {
        this.nom = nom
    }

    initialize(initialState = undefined) {
        // Copia els noms dels parametres a parametersDescription 
        // Ho fem aquí per no duplicar els noms quan definim els paràmetres. En alguns casos és còmode tenir el nom a part de la descripció del paràmetre
        this.getParameterNames().forEach(parameterName => {
            this.parametersDescription[parameterName].nom = parameterName;
        })
        // Inicialitza l'store Redux
        this.initializeStore(initialState)
    }

    initializeStore(initialState = undefined) {
        // Crea un store Redux per a cada paràmetre de l'estació
        const reducers = {};
        this.getParameterNames().forEach(parameterName => {
            const parameterDescription = this.getParameterDescription(parameterName);
            let initialValues = Array(this.numPresets).fill(parameterDescription.initial);
            if (initialState !== undefined) {
                if (initialState.parametres.hasOwnProperty(parameterName)) {
                    initialValues = initialState.parametres[parameterName];
                } else {
                    // If parameter was not present in the initial state and we added a default value, we should save the whole session
                    // state when we finish loading it so the new default parameters will be saved in the server and the parameter is
                    // properly synchronized with the server
                    saveSessionAfterLoad = true;
                }
            }
            reducers[parameterName] = (state = initialValues.map(value => ensureValidValue(value, parameterDescription)), action) => {
                switch (action.type) {
                    case 'SET_' + parameterName:
                    return action.values.map(value => ensureValidValue(value, parameterDescription));  // Do some checks to make sure the parameter value is valid
                    default:
                    return state;
                }
            }
        });
        this.store = makePartial(createStore(combineReducers(reducers)));
    }

    setParametreInStore(nomParametre, valor, preset) {
        const currentValues = this.store.getState()[nomParametre].map(e=>e)
        currentValues[preset] = valor;
        this.store.dispatch({ type: `SET_${nomParametre}`, values: currentValues });
    }

    getFullStateObject() {
        return {
            tipus: this.tipus,
            versio: this.versio,
            parametres: this.store.getState(),
        }
    }

    getParameterNames() {
        return Object.keys(this.parametersDescription)
    }
    
    getParameterDescription(parameterName) {
        return this.parametersDescription[parameterName]
    }

    parameterFollowsPreset(parameterName) {
        return this.getParameterDescription(parameterName).followsPreset === true;
    }

    getParameterValue(parameterName, preset=this.currentPreset) {
        if (this.getParameterDescription(parameterName) === undefined) {
            throw new Error(`Parameter ${parameterName} doesn't exist!`);
        }

        if (this.getParameterDescription(parameterName).live) {
            return getCurrentSession().getLiveParameterEstacio(this.nom, parameterName)
        }

        if (this.parameterFollowsPreset(parameterName)) {
            return this.store.getState()[parameterName][preset];
        }
        return this.store.getState()[parameterName][0];  // For parameters that don't follow presets, we always return the value of the first preset
    }

    getNumSteps() {
        return getAudioGraphInstance().getNumSteps();
    }

    getCurrentLivePreset() {
        return getCurrentSession().getLivePresetsEstacions()[this.nom]
    }

    updateParametreEstacio(nomParametre, valor) {

        if (this.getParameterDescription(nomParametre).live) {
            const parsedValue = parseFloat(valor, 10);
            getCurrentSession().setLiveParameterEstacio(this.nom, nomParametre, parsedValue);
            return;
        }

        const preset = this.parameterFollowsPreset(nomParametre) ? this.getCurrentLivePreset() : 0;  // For parameters that don't follow presets, allways update preset 0
        this.receiveUpdateParametreEstacioFromServer(nomParametre, valor, preset, null);
        if (getCurrentSession().localMode) return;
        if (this.getParameterDescription(nomParametre).local) return; // if it's a local parameter (like recording), don't send to others
        // In remote mode, we send parameter update to the server and the server will send it to the rest of users
        // However, we set it locally before sending it to the server, that way the UX is better as parameter changes are more responsive
        sendMessageToServer('update_parametre_estacio', {nom_estacio: this.nom, nom_parametre: nomParametre, valor: valor, preset: preset});
    }
    
    receiveUpdateParametreEstacioFromServer(nomParametre, valor, preset, originSocketID) {
        if (originSocketID === getSocketID()) return;
        // Triguejem canvi a l'store (que generarà canvi a la UI)
        this.setParametreInStore(nomParametre, valor, preset);

        // Triguejem canvi a l'audio graph
        if (getAudioGraphInstance().isGraphBuilt()){
            this.updateAudioGraphParameter(nomParametre, preset)
        }
    }

    setParametersInAudioGraph(parametersDict, preset) {
        for (const [name, value] of Object.entries(parametersDict)) {
            if (name.startsWith('fx')){
                this.setFxParameterInAudioGraph(name, value, preset);
            } else {
                this.setParameterInAudioGraph(name, value, preset);
            }
        }
    }

    setParameterInAudioGraph(name, value, preset) {
        // Called when a parameter gets updated and needs to update it's corresponding audio graph node
        // This needs to be implemented in each station
    }

    setFxParameterInAudioGraph(name, value, preset) {
        if (this.audioNodes.hasOwnProperty('effects') === false){
            // If estacio has no effect nodes, don't try tu update anything
            return;
        }
       
        // FX propis de l'estació
        if (name == "fxDrive"){
            this.audioNodes.effects['drive'].set({'wet': 1.0});
            this.audioNodes.effects['drive'].set({'distortion': value});
            const makeupGain = Tone.dbToGain(-1 * Math.pow(value, 0.25) * 8);  // He ajustat aquests valors manualment perquè el crossfade em sonés bé
            this.audioNodes.effects['driveMakeupGain'].set({'gain': makeupGain});
        } else if (name == "fxLow"){
            this.audioNodes.effects['eq3'].set({'low': this.getParameterValue("fxEqOnOff", preset) ? value: 0});
        } else if (name == "fxMid"){
            this.audioNodes.effects['eq3'].set({'mid': this.getParameterValue("fxEqOnOff", preset) ? value: 0});
        } else if (name == "fxHigh"){
            this.audioNodes.effects['eq3'].set({'high': this.getParameterValue("fxEqOnOff", preset) ? value: 0});
        } else if (name == "fxEqOnOff"){
            if (value) {
                this.audioNodes.effects['eq3'].set({'low': this.getParameterValue("fxLow", preset)});
                this.audioNodes.effects['eq3'].set({'mid': this.getParameterValue("fxMid", preset)});
                this.audioNodes.effects['eq3'].set({'high': this.getParameterValue("fxHigh", preset)});
            } else {
                this.audioNodes.effects['eq3'].set({'low': 0});
                this.audioNodes.effects['eq3'].set({'mid': 0});
                this.audioNodes.effects['eq3'].set({'high': 0});
            }
        }

        // FX globals
        if (name == "fxReverbASend"){
            this.audioNodes.effects.reverbASendChannel.volume.value = value == -60 ? -100 : value;
        } else if (name == "fxDelayASend"){
            this.audioNodes.effects.delayASendChannel.volume.value = value == -60 ? -100 : value;
        }
    }

    addEffectChainNodes (audioInput, audioOutput){
        // Create nodes for the effect chain
        const effects = {
            drive: new Tone.Distortion({
                distortion: 0,
            }),
            driveMakeupGain: new Tone.Gain({
                gain: 1.0,
            }),
            eq3: new Tone.EQ3({
                low: 0,
                mid: 0,
                high: 0,
            }),
            reverbASendChannel: new Tone.Channel({ 
                volume: -100 
            }),
            delayASendChannel: new Tone.Channel({ 
                volume: -100 
            })
        }
        let effectsChain = [effects.drive, effects.driveMakeupGain, effects.eq3];
        effects.reverbASendChannel.send("reverbA");
        effects.delayASendChannel.send("delayA");
        getAudioGraphInstance().getMasterChannelNodeForEstacio(this.nom).connect(effects.reverbASendChannel);
        getAudioGraphInstance().getMasterChannelNodeForEstacio(this.nom).connect(effects.delayASendChannel);

        // Add the nodes to the station's audioNodes dictionary
        this.audioNodes.effects = effects;

        // Connect the nodes in the effect chain
        audioInput.chain( ...effectsChain, audioOutput);
    }
    
    // UI stuff

    getUserInterfaceComponent() {
        throw new Error("No UI per aquiesta estació!");  // If not overriden, throw error
    }

    // AUDIO stuff

    setCurrentPreset(preset) {
        this.currentPreset = preset
        if (getAudioGraphInstance().isGraphBuilt()){
            this.updateAudioGraphFromState(preset)
        }
    }

    buildEstacioAudioGraph(outputNode) {
        return {}
    }

    updateAudioGraphFromState(preset) {
        // Called when we want to update the whole audio graph from the state (for example, to force syncing with the state)
        const parametersDict = {}
        Object.keys(this.parametersDescription).forEach(nomParametre => {
            parametersDict[nomParametre] = this.getParameterValue(nomParametre, preset);
        })
        this.setParametersInAudioGraph(parametersDict, preset) 
    }

    updateAudioGraphParameter(nomParametre, preset) {
        // Called when a parameter of an station's audio graph is updated
        this.setParametersInAudioGraph({[nomParametre]: this.getParameterValue(nomParametre, preset)}, preset)
    }

    onTransportStart() {
        // Called when audio graph is started
    }

    onTransportStop() {
        // Called when audio graph is stopped
    }

    onSequencerSteo(currentMainSequencerStep, time) {
        // Called at each step (16th note) of the main sequencer so the station can trigger notes, etc.
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, extras) {
        // Called everytime a note message is received from a live stream of notes (could be MIDI input or virtual input
        // noteOff = boolean which will be true if the message is a noteOff
    }

    unfinishedNotesOnsets = new Map();
    handlePianoRollRecording(midiNoteNumber, noteOff) {
        if (!this.getParameterValue('isRecording')) return;
        const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
        const currentStep = currentMainSequencerStep % this.getNumSteps();
    
        if (!noteOff) return this.unfinishedNotesOnsets.set(midiNoteNumber, currentStep);
        
        const noteOnset = this.unfinishedNotesOnsets.get(midiNoteNumber)
        this.unfinishedNotesOnsets.delete(midiNoteNumber)
        if (noteOnset === undefined) return; // if we don't have a time for the last note on, don't do anything
        if (noteOnset >= currentStep) return; // likewise, don't save the note if the noteoff insn't bigger than the noteon
        
        // now yes, create a note object
        const notes = this.getParameterValue('notes');
        const jsPianoRollEl = document.getElementById(this.nom + "_" + "notes_id");
        notes.push({'n': midiNoteNumber, 'b': noteOnset, 'd': currentStep - noteOnset, 'id': jsPianoRollEl.getNextAvailableID()});
        this.updateParametreEstacio('notes', notes); // and save change in server!
    }

}

export class Session {
    constructor(data, local=false) {
        this.useAudioEngine = true
        this.localMode = local
        this.continuousControlThrottleTime = 50
        
        // Copia totes les dades "raw" de la sessió per tenir-les guardades
        this.rawData = data

        // Crea objectes per cada estació i guardal's a la sessió
        this.estacions = {}
        Object.keys(this.rawData.estacions).forEach(nomEstacio => {
            const estacioRawData = this.rawData.estacions[nomEstacio]
            if (estacionsDisponibles.hasOwnProperty(estacioRawData.tipus)) {
                const estacioObj = new estacionsDisponibles[estacioRawData.tipus](nomEstacio)
                estacioObj.initialize(estacioRawData)
                this.estacions[nomEstacio] = estacioObj
            }
        })

        // Inicialitza un redux store amb les propietats de la sessió
        this.propertiesInStore = ['id', 'name', 'connected_users', 'recorded_files', 'live', 'arranjament'];
        const reducers = {};
        this.propertiesInStore.forEach(propertyName => {
            reducers[propertyName] = (state = this.rawData[propertyName], action) => {
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

    setAudioOff() {
        this.useAudioEngine = false;
    }

    usesAudioEngine() {
        return this.useAudioEngine;
    }

    setParametreInStore(nomParametre, valor) {
        this.store.dispatch({ type: `SET_${nomParametre}`, value: valor });
    }

    getID() {
        return this.store.getState().id
    }

    getNom() {
        return this.store.getState().name
    }

    getConnectedUsers() {
        return this.store.getState().connected_users
    }

    getRecordedFiles() {
        return this.store.getState().recorded_files.sort()
    }

    getNomsEstacions() {
        return Object.keys(this.estacions);
    }

    getEstacio(nomEstacio) {
        return this.estacions[nomEstacio];
    }

    getSessionDataObject() {
        // Collects all the data of the session and returns it as an object that should be suitable to be stored in a redis store
        // TODO: some parameters here are set manually (bpm, swing) and this is quite bad because if we add new parameters managed by
        // the audio engine which are not added here, this would not be included in the updated session data. We should find a way to
        // specify which parameters should be added here so we don't have to keep updating this function every time we add a new parameter.
        const data = {};
        this.propertiesInStore.forEach(propertyName => {
            data[propertyName] = this.store.getState()[propertyName];
        })
        data.estacions = {};
        this.getNomsEstacions().forEach(nomEstacio => {
            data.estacions[nomEstacio] = this.getEstacio(nomEstacio).getFullStateObject();
        })
        data.bpm = getAudioGraphInstance().getBpm();
        data.swing = getAudioGraphInstance().getSwing();
        data.compas = getAudioGraphInstance().getCompas();
        data.tonality = getAudioGraphInstance().getTonality();
        data.effectParameters = getAudioGraphInstance().getEffectParameters();
        return data
    }

    saveDataInServer() {
        sendMessageToServer('save_session_data', {full_session_data: this.getSessionDataObject()});
    }

    saveDataInServerUsingPostRequest(callback) {
        // In local mode we don't have an active web sockets connection, therefore to save the session we can use a post request
        const url = appPrefix + '/save_session_data';
        fetch(url, {
            method: "POST",
            body: JSON.stringify({
                session_id: this.getID(), 
                full_session_data: this.getSessionDataObject()
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }).then(response => {
            return response.json()
        }).then(data => {
            callback(data)
        })
        .catch(error => {
            console.error(error);
        });
    }
    
    updateParametreSessio(nomParametre, valor) {
        this.receiveUpdateParametreSessioFromServer(nomParametre, valor, null);
        if (this.localMode) return;
        // In remote mode, we send parameter update to the server and the server will send it to the rest of users
        // However, we set it locally before sending it to the server, that way the UX is better as parameter changes are more responsive
        sendMessageToServer('update_parametre_sessio', {nom_parametre: nomParametre, valor: valor});
    }

    receiveUpdateParametreSessioFromServer(nomParametre, valor, originSocketID) {
        if (originSocketID === getSocketID()) return;
        // Guardem valors a l'store
        this.setParametreInStore(nomParametre, valor);
    }

    // LIVE mode stuff

    getLive() {
        return this.store.getState().live
    }

    getLiveParametersEstacions(parameterName) {
        switch (parameterName) {
            case 'preset':
                return this.store.getState().live.presetsEstacions;
            case 'gain':
                return this.store.getState().live.gainsEstacions;
            case 'pan':
                return this.store.getState().live.pansEstacions ?? {}  // per compatibilitat amb sessions que no tenien pans
            case 'mute':
                return this.store.getState().live.mutesEstacions;
            case 'solo':
                return this.store.getState().live.solosEstacions;
            default:
                throw new Error(`Unknown parameter: ${parameterName}`);
        }
    }

    getLiveParameterEstacio(nomEstacio, parameterName) {
        return this.getLiveParametersEstacions(parameterName)[nomEstacio] ?? 0.0;  // per compatibilitat amb sessions que no tenien pans
    }

    getLivePresetsEstacions() {
        return this.getLiveParametersEstacions('preset');
    }

    getLiveGainsEstacions() {
        return this.getLiveParametersEstacions('gain');
    }

    getLivePansEstacions() {
        return this.getLiveParametersEstacions('pan');
    }

    getLivePanEstacio(nomEstacio) {
        return this.getLiveParameterEstacio(nomEstacio, 'pan');
    }

    getLiveMutesEstacions() {
        return this.getLiveParametersEstacions('mute');
    }

    getLiveSolosEstacions() {
        return this.getLiveParametersEstacions('solo');
    }

    setLiveParameterEstacio(nomEstacio, parameterName, parameterValue) {
        const parametersEstacions = {[nomEstacio]: parameterValue}
        this.updateParametreLive({
            accio: `set_${parameterName}s`,
            [`${parameterName}s_estacions`]: parametersEstacions,
        });
        
    }

    setLivePresetForEstacio(nomEstacio, preset) {
        const presets_estacions = {}
        presets_estacions[nomEstacio] = preset
        this.setLivePresetsEstacions(presets_estacions);
    }

    setLivePresetsEstacions(presetsEstacions) {
        this.updateParametreLive({
            accio: 'set_presets',
            presets_estacions: presetsEstacions,
        })
    }

    setLiveGainsEstacions(gainsEstacions) {
        this.updateParametreLive({
            accio: 'set_gains',
            gains_estacions: gainsEstacions,
        })
    }

    setLivePansEstacions(pansEstacions) {
        this.updateParametreLive({
            accio: 'set_pans',
            pans_estacions: pansEstacions || {},  // per compatibilitat amb sessins que no tenien pans
        })
    }

    setLiveMutesEstacions(mutesEstacions) {
        this.updateParametreLive({
            accio: 'set_mutes',
            mutes_estacions: mutesEstacions,
        })
    }

    setLiveSolosEstacions(solosEstacions) {
        this.updateParametreLive({
            accio: 'set_solos',
            solos_estacions: solosEstacions,
        })
    }

    updateParametreLive(updateData) {
        this.receiveUpdateLiveFromServer(updateData, null);
        if (this.localMode) return;
        // In remote mode, we send parameter update to the server and the server will send it to the rest of users
        // However, we set it locally before sending it to the server, that way the UX is better as parameter changes are more responsive
        sendMessageToServer('update_live_sessio', {update_data: updateData});
    }

    setEstacionsMutesAndSolosInChannelNodes(mutes, solos) {
        if (!getAudioGraphInstance().isGraphBuilt()){ return; };
        const someAreSoloed = Object.values(solos).some(solo => solo === true);
        Object.keys(mutes).forEach(nomEstacio => {
            const channelNode = getAudioGraphInstance().getMasterChannelNodeForEstacio(nomEstacio);
            const channelIsSoloed = solos[nomEstacio];
            const channelIsDirectMuted = mutes[nomEstacio];
            const channelIsIndirectMuted = someAreSoloed && !channelIsSoloed;
            channelNode.mute = channelIsDirectMuted || channelIsIndirectMuted;
        });
    }

    receiveUpdateLiveFromServer(updateData, originSocketID) {
        if (originSocketID === getSocketID()) return;

        const liveActualitzat = Object.assign({}, this.getLive());
        if (updateData.accio === 'set_gains') {
            Object.keys(updateData.gains_estacions).forEach(nomEstacio => {
                liveActualitzat.gainsEstacions[nomEstacio] = updateData.gains_estacions[nomEstacio];
                // Update audio graph gain nodes
                const channelNode = getAudioGraphInstance().getMasterChannelNodeForEstacio(nomEstacio);
                if (channelNode !== undefined){
                    const volume = Tone.gainToDb(updateData.gains_estacions[nomEstacio]);
                    channelNode.volume.linearRampTo(volume, 0.01);
                }
                this.setEstacionsMutesAndSolosInChannelNodes(liveActualitzat.mutesEstacions, liveActualitzat.solosEstacions);
            })
        } else if (updateData.accio === 'set_pans'){
            if (liveActualitzat.pansEstacions === undefined){
                liveActualitzat.pansEstacions = {}  // Per compatibilitat amb sessions que no tenien pans, creem l'objecte si no existeix
            }
            Object.keys(updateData.pans_estacions).forEach(nomEstacio => {
                liveActualitzat.pansEstacions[nomEstacio] = updateData.pans_estacions[nomEstacio];
                // Update audio graph pans nodes
                const channelNode = getAudioGraphInstance().getMasterChannelNodeForEstacio(nomEstacio);
                if (channelNode !== undefined){
                    const pan = updateData.pans_estacions[nomEstacio];
                    channelNode.pan.linearRampTo(pan, 0.01);
                }
            })
        } else if (updateData.accio === 'set_mutes') {
            Object.keys(updateData.mutes_estacions).forEach(nomEstacio => {
                liveActualitzat.mutesEstacions[nomEstacio] = updateData.mutes_estacions[nomEstacio];
            })
            this.setEstacionsMutesAndSolosInChannelNodes(liveActualitzat.mutesEstacions, liveActualitzat.solosEstacions);
        } else if (updateData.accio === 'set_solos') {
            Object.keys(updateData.solos_estacions).forEach(nomEstacio => {
                liveActualitzat.solosEstacions[nomEstacio] = updateData.solos_estacions[nomEstacio];
            })
            this.setEstacionsMutesAndSolosInChannelNodes(liveActualitzat.mutesEstacions, liveActualitzat.solosEstacions);
        } else if (updateData.accio === 'set_presets') {
            Object.keys(updateData.presets_estacions).forEach(nomEstacio => {
                liveActualitzat.presetsEstacions[nomEstacio] = updateData.presets_estacions[nomEstacio];
                // Set presets in estacions
                const estacio = this.getEstacio(nomEstacio)
                if (estacio.currentPreset != updateData.presets_estacions[nomEstacio]){
                    estacio.setCurrentPreset(updateData.presets_estacions[nomEstacio])
                }
            })
        }
        // Update parametre in store
        this.setParametreInStore('live', liveActualitzat); 
    }

    // ARRANJAMENT mode stuff

    getArranjament() {
        return this.store.getState().arranjament
    }

    getArranjamentClips() {
        return this.store.getState().arranjament.clips
    }

    arranjamentAfegirClips(clipsData) {
        this.updateParametreArranjament({
            accio: 'add_clips',
            clips_data: clipsData
        })
    }

    arranjamentEliminarClips(clipIDs) {
        this.updateParametreArranjament({
            accio: 'remove_clips',
            clip_ids: clipIDs
        })
    }

    updateParametreArranjament(updateData) {
        this.receiveUpdateArranjamentFromServer(updateData, null);
        if (this.localMode) return;
        // In remote mode, we send parameter update to the server and the server will send it to the rest of users
        // However, we set it locally before sending it to the server, that way the UX is better as parameter changes are more responsive
        sendMessageToServer('update_arranjament_sessio', {update_data: updateData});
    }

    receiveUpdateArranjamentFromServer(updateData, originSocketID) {
        if (originSocketID === getSocketID()) return;
        
        const arranjamentActualitat = Object.assign({}, this.getArranjament());
        if (updateData.accio === 'add_clips') {
            const clipIDs = updateData.clips_data.map(clip => clip.id);
            arranjamentActualitat.clips = arranjamentActualitat.clips.filter(clip => clipIDs.includes(clip.id) === false);
            arranjamentActualitat.clips = arranjamentActualitat.clips.concat(updateData.clips_data);
        } else if (updateData.accio === 'remove_clips') {
            arranjamentActualitat.clips = arranjamentActualitat.clips.filter(clip => updateData.clip_ids.includes(clip.id) === false);
        }
        arranjamentActualitat.clips.sort((a, b) => a.beatInici - b.beatInici)  // Ordenem els clips per ordre d'aparició en la linia temporal
        this.setParametreInStore('arranjament', arranjamentActualitat);
    }
}
