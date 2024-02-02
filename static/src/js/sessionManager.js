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

    getParameterValue(parameterName, preset=undefined) {
        const presetToUse = preset || getCurrentSession().getSelectedPresetForEstacio(this.nom)
        return this.store.getState()[parameterName][presetToUse];
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

    buildEstacioAudioGraph(estacioMasterGainNode) {
        return {}
    }

    updateAudioGraphFromState() {
        // Called when we want to update the whole audio graph from the state (for example, to force syncing with the state)
    }
    
    updateAudioGraphParameter(nomParametre) {
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
        this.propertiesInStore = ['id', 'name', 'connected_users', 'presetsEstacions'];
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

    getSelectedPresetForEstacio(nomEstacio) {
        return this.store.getState()['presetsEstacions'][nomEstacio]
    }

    setSelectedPresetForEstacio(nomEstacio, preset) {
        const newPresetsEstacions = Object.assign({}, this.store.getState()['presetsEstacions'])
        newPresetsEstacions[nomEstacio] = preset
        this.updateParametreSessio('presetsEstacions', newPresetsEstacions)
    }

    setPresetsEstacions(presetsEstacions) {
        const oldPresetsEstacions = Object.assign({}, this.store.getState()['presetsEstacions'])
        this.setParametreInStore('presetsEstacions', presetsEstacions)
        this.getNomsEstacions().forEach(nomEstacio => {
            if (oldPresetsEstacions[nomEstacio] != presetsEstacions[nomEstacio]){
                // Si el preset d'aquesta estació ha canviat
                const estacio = this.getEstacio(nomEstacio)
                if (getAudioGraphInstance().graphIsBuilt()){
                    // Si l'audio graph existeix, recarrega l'estació
                    estacio.updateAudioGraphFromState()
                }
                estacio.forceUpdateUIComponents()
            }
        })
    }

    updateParametreEstacio(nomEstacio, nomParametre, valor) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            // However, if performLocalUpdatesBeforeServerUpdates is enabled, we can also set the parameter
            // locally before sending it to the sever and in this way the user experience is better as
            // parameter changes are more responsive
            if (this.performLocalUpdatesBeforeServerUpdates) {
                this.receiveUpdateParametreEstacioFromServer(nomEstacio, nomParametre, valor, this.getSelectedPresetForEstacio(nomEstacio))
            }
            sendMessageToServer('update_parametre_estacio', {session_id: this.getID(), nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor, preset: this.getSelectedPresetForEstacio(nomEstacio)});
        } else {
            // In local mode, simulate the message coming from the server and perform the actual action
            this.receiveUpdateParametreEstacioFromServer(nomEstacio, nomParametre, valor, this.getSelectedPresetForEstacio(nomEstacio))
        }
    }
    
    receiveUpdateParametreEstacioFromServer(nomEstacio, nomParametre, valor, preset) {
        const estacio = this.getEstacio(nomEstacio);

        // Triguejem canvi a l'store (que generarà canvi a la UI)
        estacio.setParametreInStore(nomParametre, valor, preset);

        // Triguejem canvi a l'audio graph
        if (getAudioGraphInstance().graphIsBuilt()){
            estacio.updateAudioGraphParameter(nomParametre)
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
        if (nomParametre === 'presetsEstacions') {
            // Aquest paràmetre requereix un tracte especial perquè s'ha de fer un update de l'àudio graph i de la UI
            this.setPresetsEstacions(valor);
        } else {
            this.setParametreInStore(nomParametre, valor);
        }
    }
    
}
