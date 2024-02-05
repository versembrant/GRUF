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
    //console.log('Registering estacio disponible:', tipusEstacio)
    estacionsDisponibles[tipusEstacio] = estacioClass;
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
                initialValues = initialState.parametres[parameterName];
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
        return getCurrentSession().liveGetPresetForEstacio(this.nom)
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

    buildEstacioAudioGraph(estacioMasterGainNode) {
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

    onSequencerTick(currentMainSequencerStep, time, preset) {
        // Called at each tick (16th note) of the main sequencer so the station can trigger notes, etc.
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
        this.propertiesInStore = ['id', 'name', 'connected_users', 'live', 'arranjament'];
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

    getNomsEstacions() {
        return Object.keys(this.estacions);
    }

    getEstacio(nomEstacio) {
        return this.estacions[nomEstacio];
    }
    
    liveGetPresetForEstacio(nomEstacio) {
        return this.store.getState().live.presetsEstacions[nomEstacio]
    }

    liveSetPresetForEstacio(nomEstacio, preset) {
        const newLiveParameter = Object.assign({}, this.store.getState()['live'])
        newLiveParameter.presetsEstacions[nomEstacio] = preset
        this.updateParametreSessio('live', newLiveParameter)
    }

    liveSetPresetsEstacions(presetsEstacions) {
        const newLiveParameter = Object.assign({}, this.store.getState()['live'])
        newLiveParameter.presetsEstacions = presetsEstacions
        this.setParametreInStore('live', newLiveParameter)
    }

    liveGetGainsEstacions() {
        return this.store.getState().live.gainsEstacions;
    }
    
    liveSetGainsEstacions(gainsEstacions) {
        const newLiveParameter = Object.assign({}, this.store.getState()['live'])
        newLiveParameter.gainsEstacions = gainsEstacions
        this.updateParametreSessio('live', newLiveParameter)
    }

    getArranjament() {
        return this.store.getState()['arranjament']
    }

    updateParametreEstacio(nomEstacio, nomParametre, valor) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
            // locally before sending it to the sever and in this way the user experience is better as
            // parameter changes are more responsive
            if (this.performLocalUpdatesBeforeServerUpdates) {
                this.receiveUpdateParametreEstacioFromServer(nomEstacio, nomParametre, valor, this.liveGetPresetForEstacio(nomEstacio))
            }
            sendMessageToServer('update_parametre_estacio', {session_id: this.getID(), nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor, preset: this.liveGetPresetForEstacio(nomEstacio)});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            this.receiveUpdateParametreEstacioFromServer(nomEstacio, nomParametre, valor, this.liveGetPresetForEstacio(nomEstacio))
        }
    }
    
    receiveUpdateParametreEstacioFromServer(nomEstacio, nomParametre, valor, preset) {
        const estacio = this.getEstacio(nomEstacio);

        // Triguejem canvi a l'store (que generarà canvi a la UI)
        estacio.setParametreInStore(nomParametre, valor, preset);

        // Triguejem canvi a l'audio graph
        if (getAudioGraphInstance().graphIsBuilt()){
            estacio.updateAudioGraphParameter(nomParametre, preset)
        }
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
        if (nomParametre === 'live') {
            // Aquest paràmetre requereix un tracte especial perquè s'han de fer canvis a l'àudio graph i a la UI
            
            // Update presets
            this.getNomsEstacions().forEach(nomEstacio => {
                const estacio = this.getEstacio(nomEstacio)
                if (estacio.currentPreset != valor.presetsEstacions[nomEstacio]){
                    estacio.setCurrentPreset(valor.presetsEstacions[nomEstacio])
                    estacio.forceUpdateUIComponents()
                }
            })
            
            // Update gains
            if (getAudioGraphInstance().graphIsBuilt()){
                getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
                    const gainNode = getAudioGraphInstance().getMasterGainNodeForEstacio(nomEstacio);
                    gainNode.gain.value = valor.gainsEstacions[nomEstacio];
                })
            }
        }
        
        // Guardem valors a l'store
        this.setParametreInStore(nomParametre, valor);
    }

    arranjamentAfegirClip(clipData) {
        clipData.id = Date.now()
        this.updateParametreArranjament({
            accio: 'add_clip',
            clip_data: clipData
        })
    }

    arranjamentEliminarClip(clipID) {
        this.updateParametreArranjament({
            accio: 'remove_clip',
            clip_id: clipID
        })
    }

    arranjamentEditarClip(clipID, clipData) {
        this.updateParametreArranjament({
            accio: 'update_clip',
            clip_id: clipID,
            clip_data: clipData
        })
    }

    updateParametreArranjament(updateData) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // For the arranjament we can't perform local updates before server updates as this could result in
            // duplicated data as we're not setting a parameter but updating it's contents based on what is already
            // stored locally. Therefore we don't check performLocalUpdatesBeforeServerUpdates as we do for other
            // similar parameter updates
            sendMessageToServer('update_arranjament_sessio', {session_id: this.getID(), update_data: updateData});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            this.receiveUpdateArranjamentSessioFromServer(updateData)
        }
    }

    receiveUpdateArranjamentSessioFromServer(updateData) {
        const arranjamentActualitat = Object.assign({}, this.getArranjament());
        if (updateData.accio === 'add_clip') {
            arranjamentActualitat.clips.push(updateData.clip_data);
        } else if (updateData.accio === 'remove_clip') {
            arranjamentActualitat.clips = arranjamentActualitat.clips.filter(clip => clip.id != updateData.clip_id);
        } else if (updateData.accio === 'update_clip') {
            arranjamentActualitat.clips = arranjamentActualitat.clips.map(clip => {
                if (clip.id === updateData.clip_id) {
                    return updateData.clip_data;
                } else {
                    return clip;
                }
            });
        }
        arranjamentActualitat.clips.sort((a, b) => b.beatInici - a.beatInici)  // Ordenem els clips per ordre d'aparició
        this.setParametreInStore('arranjament', arranjamentActualitat);
    }
}
