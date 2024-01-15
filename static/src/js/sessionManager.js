import { createElement } from "react";
import { createStore, combineReducers } from "redux";
import { socket, ensureValidValue, creaUIWidgetPerParametre, subscribeToStoreChanges } from "./utils";
import { getAudioGraphInstance } from "./audioEngine";


var currentSession = undefined; 

export const getCurrentSession = () => {
    return currentSession;
}

export const setCurrentSession = (session) => {
    currentSession = session;
}

export const estacionsDisponibles = {};

export const registerEstacioDisponible = (nom, estacioClass) => {
    console.log('Registering estacio disponible:', nom, estacioClass)
    estacionsDisponibles[nom] = estacioClass;
}


export class EstacioBase {

    constructor(nom) {
        this.nom = nom
        this.tipus = 'base'
        this.versio = '0.0'
        this.parametersDescription = {}
        this.store = undefined
        this.audioNodes = {}
        this.volatileState = {}
        this.followsMainSequencer = false;
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
            let initialValue = parameterDescription.initial;
            if (initialState !== undefined) {
                initialValue = initialState.parametres[parameterName];
            }
            reducers[parameterName] = (state = ensureValidValue(initialValue, parameterDescription), action) => {
                switch (action.type) {
                    case 'SET_' + parameterName:
                    return ensureValidValue(action.value, parameterDescription);  // Do some checks to make sure the parameter value is valid
                    default:
                    return state;
                }
            }
        });
        this.store = createStore(combineReducers(reducers));
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

    getParameterValue(parameterName) {
        return this.store.getState()[parameterName];
    }

    // UI stuff

    getDefaultUserInterface() {    
        // Subscribe to store changes of the station itself
        subscribeToStoreChanges(this);
        if (this.followsMainSequencer === true) {
            // If UI needs to be updated with the main sequencer (e.g., to show sequencer current step), also subscribe to stroe changes of the audio engine store
            subscribeToStoreChanges(getAudioGraphInstance());
        }
        
        const parametresElements = [];
        this.getParameterNames().forEach(nomParametre => {
            parametresElements.push(creaUIWidgetPerParametre(this, nomParametre));
        });
        
        return createElement(
            'div',
            null,
            createElement('h2', null, this.nom),
            createElement('p', null, 'Tipus:', this.tipus),
            [...parametresElements]
        );
    }

    getUserInterface() {
        return this.getDefaultUserInterface()
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
        
        // Copia totes les dades "raw" de la sessió per tenir-les guardades
        this.rawData = data

        // Crea objectes per cada estació i guardal's a la sessió
        this.estacions = {}
        Object.keys(this.rawData.estacions).forEach(nomEstacio => {
            const estacioRawData = this.rawData.estacions[nomEstacio]
            const estacioObj = new estacionsDisponibles[estacioRawData.tipus](nomEstacio)
            estacioObj.initialize(estacioRawData)
            this.estacions[nomEstacio] = estacioObj
        })

        // Inicialitza un redux store amb les propietats de la sessió
        const propertiesInStore = ['id', 'name', 'connected_users'];
        const reducers = {};
        propertiesInStore.forEach(propertyName => {
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

    getConnectedUsers() {
        return this.store.getState().connected_users
    }

    getNomsEstacions() {
        return Object.keys(this.estacions);
    }

    getEstacio(nomEstacio) {
        return this.estacions[nomEstacio];
    }
    
    updateParametreEstacio(nomEstacio, nomParametre, valor) {
        const estacio = this.getEstacio(nomEstacio);

        // Triguejem canvi a l'store (que generarà canvi a la UI)
        estacio.store.dispatch({ type: 'SET_' + nomParametre, value: valor });

        // Triguejem canvi a l'audio graph
        if (getAudioGraphInstance().graphIsBuilt()){
            estacio.updateAudioGraphParameter(nomParametre)
        }
    }
    
    updateParametreEstacioInServer(nomEstacio, nomParametre, valor) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            socket.emit('update_parametre_estacio', {session_id: this.getID(), nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor});
        } else {
            // In local mode, we update parameter in the same object as it is not synced with the server
            this.updateParametreEstacio(nomEstacio, nomParametre, valor)
        }
    }

    updateMasterSequencerCurrentStepInServer(current_step) {
        if (!this.localMode) {
            socket.emit('update_master_sequencer_current_step', {session_id: this.getID(), current_step: current_step});
        }
    }
}

socket.on('update_parametre_sessio', function (data) {
    getCurrentSession().setParametreInStore(data.nom_parametre, data.valor);
});

socket.on('update_parametre_estacio', function (data) {
    getCurrentSession().updateParametreEstacio(data.nom_estacio, data.nom_parametre, data.valor);
});