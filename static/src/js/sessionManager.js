import * as Tone from 'tone';
import { createStore, combineReducers } from "redux";
import { sendMessageToServer } from "./serverComs";
import { ensureValidValue } from "./utils";
import { getAudioGraphInstance } from "./audioEngine";
import { EstacioDefaultUI } from "./components/estacioDefaultUI";

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
    parametersDescription = {}
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
        this.store = createStore(combineReducers(reducers));
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

    getParameterValue(parameterName, preset) {
        return this.store.getState()[parameterName][preset];
    }

    getCurrentLivePreset() {
        return getCurrentSession().getLivePresetsEstacions()[this.nom]
    }

    updateParametreEstacio(nomParametre, valor) {
        if (!getCurrentSession().localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
            // locally before sending it to the sever and in this way the user experience is better as
            // parameter changes are more responsive
            if (getCurrentSession().performLocalUpdatesBeforeServerUpdates) {
                this.receiveUpdateParametreEstacioFromServer(nomParametre, valor, this.getCurrentLivePreset())
            }
            sendMessageToServer('update_parametre_estacio', {session_id: getCurrentSession().getID(), nom_estacio: this.nom, nom_parametre: nomParametre, valor: valor, preset: this.getCurrentLivePreset()});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            this.receiveUpdateParametreEstacioFromServer(nomParametre, valor, this.getCurrentLivePreset())
        }
    }
    
    receiveUpdateParametreEstacioFromServer(nomParametre, valor, preset) {
        // Triguejem canvi a l'store (que generarà canvi a la UI)
        this.setParametreInStore(nomParametre, valor, preset);

        // Triguejem canvi a l'audio graph
        if (getAudioGraphInstance().graphIsBuilt()){
            this.updateAudioGraphParameter(nomParametre, preset)
        }
    }

    // UI stuff

    getUserInterfaceComponent() {
        return EstacioDefaultUI  // If not overriden, use the default UI
    }

    forceUpdateUIComponents() {
        // Re-setejem el primer paràmetre per provocar un "redraw" dels components UI vinculats a aquesta estacio
        // TODO: hi ha una manera millor de fer-ho?
        const nomPrimerParametre = this.getParameterNames()[0]
        this.setParametreInStore(nomPrimerParametre, this.getParameterValue(nomPrimerParametre, 0), 0)
    }

    // AUDIO stuff

    setCurrentPreset(preset) {
        this.currentPreset = preset
        if (getAudioGraphInstance().graphIsBuilt()){
            this.updateAudioGraphFromState(preset)
        }
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        return {}
    }

    updateAudioGraphFromState(preset) {
        // Called when we want to update the whole audio graph from the state (for example, to force syncing with the state)
    }
    
    updateAudioGraphParameter(nomParametre, preset) {
        // Called when a parameter of an station's audio graph is updated
    }

    onTransportStart() {
        // Called when audio graph is started
    }

    onTransportStop() {
        // Called when audio graph is stopped
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Called at each tick (16th note) of the main sequencer so the station can trigger notes, etc.
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        // Called everytime a note message is received from a live stream of notes (could be MIDI input or virtual input
        // noteOff = boolean which will be true if the message is a noteOff
    }

}

export class Session {
    constructor(data, local=false) {
        this.localMode = local
        this.performLocalUpdatesBeforeServerUpdates = true
        
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
        this.store = createStore(combineReducers(reducers));
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
        return this.store.getState().recorded_files
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
        return data
    }

    saveDataInServer() {
        sendMessageToServer('save_session_data', {session_id: this.getID(), full_session_data: this.getSessionDataObject()});
    }
    
    updateParametreSessio(nomParametre, valor) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
            // locally before sending it to the sever and in this way the user experience is better as
            // parameter changes are more responsive
            if (this.performLocalUpdatesBeforeServerUpdates) {
                this.receiveUpdateParametreSessioFromServer(nomParametre, valor)
            }
            sendMessageToServer('update_parametre_sessio', {session_id: this.getID(), nom_parametre: nomParametre, valor: valor});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            this.receiveUpdateParametreSessioFromServer(nomParametre, valor)
        }
    }

    receiveUpdateParametreSessioFromServer(nomParametre, valor) {
        // Guardem valors a l'store
        this.setParametreInStore(nomParametre, valor);
    }

    // LIVE mode stuff

    getLive() {
        return this.store.getState().live
    }

    getLivePresetsEstacions() {
        return this.store.getState().live.presetsEstacions
    }

    getLiveGainsEstacions() {
        return this.store.getState().live.gainsEstacions
    }

    liveSetPresetForEstacio(nomEstacio, preset) {
        const presets_estacions = {}
        presets_estacions[nomEstacio] = preset
        this.updateParametreLive({
            accio: 'set_presets',
            presets_estacions: presets_estacions,
        })
    }

    liveSetPresetsEstacions(presetsEstacions) {
        this.updateParametreLive({
            accio: 'set_presets',
            presets_estacions: presetsEstacions,
        })
    }

    liveSetGainsEstacions(gainsEstacions) {
        this.updateParametreLive({
            accio: 'set_gains',
            gains_estacions: gainsEstacions,
        })
    }

    updateParametreLive(updateData) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
            // locally before sending it to the sever and in this way the user experience is better as
            // parameter changes are more responsive
            if (this.performLocalUpdatesBeforeServerUpdates) {
                this.receiveUpdateLiveFromServer(updateData)
            }
            sendMessageToServer('update_live_sessio', {session_id: this.getID(), update_data: updateData});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            this.receiveUpdateLiveFromServer(updateData)
        }
    }

    receiveUpdateLiveFromServer(updateData) {
        const liveActualitzat = Object.assign({}, this.getLive());
        if (updateData.accio === 'set_gains') {
            Object.keys(updateData.gains_estacions).forEach(nomEstacio => {
                liveActualitzat.gainsEstacions[nomEstacio] = updateData.gains_estacions[nomEstacio];
                // Update audio graph gain nodes
                const channelNode = getAudioGraphInstance().getMasterChannelNodeForEstacio(nomEstacio);
                if (channelNode !== undefined){
                    const volume = Tone.gainToDb(updateData.gains_estacions[nomEstacio]);
                    channelNode.volume.value = volume;
                }
                
            })
        } else if (updateData.accio === 'set_presets') {
            Object.keys(updateData.presets_estacions).forEach(nomEstacio => {
                liveActualitzat.presetsEstacions[nomEstacio] = updateData.presets_estacions[nomEstacio];
                // Set presets in estacions
                const estacio = this.getEstacio(nomEstacio)
                if (estacio.currentPreset != updateData.presets_estacions[nomEstacio]){
                    estacio.setCurrentPreset(updateData.presets_estacions[nomEstacio])
                    estacio.forceUpdateUIComponents()
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
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
            // locally before sending it to the sever and in this way the user experience is better as
            // parameter changes are more responsive
            if (this.performLocalUpdatesBeforeServerUpdates) {
                this.receiveUpdateArranjamentFromServer(updateData)
            }
            sendMessageToServer('update_arranjament_sessio', {session_id: this.getID(), update_data: updateData});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            this.receiveUpdateArranjamentFromServer(updateData)
        }
    }

    receiveUpdateArranjamentFromServer(updateData) {
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
