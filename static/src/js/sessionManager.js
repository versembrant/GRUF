import { createElement, useState, useEffect} from "react";
import { createStore, combineReducers } from "redux";
import { socket, ensureValidValue, creaUIWidgetPerParametre } from "./utils";


var currentSession = undefined; 

export const getCurrentSession = () => {
    return currentSession;
}

export const setCurrentSession = (session) => {
    currentSession = session;
}

export const estacionsDisponibles = {};

export const registerEstacioDisponible = (nom, estacioClass) => {
    console.log('Registering estacio helper', nom, estacioClass)
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
    }

    initialize(initialState = undefined) {
        this.initializeStore(initialState)
    }

    initializeStore(initialState = undefined) {
        // Crea un store Redux per a cada paràmetre de l'estació
        const reducers = {};
        this.getParameterNames().forEach(parameterName => {
            const parameterDescription = this.getParameterDescription(parameterName);
            let initialValue = parameterDescription.initial;
            if (initialValue !== undefined) {
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

    getStateForServer() {
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
        return () => {
            const [state, setState] = useState(this.store.getState());
            useEffect(() => {
                const unsubscribe = this.store.subscribe(() => {
                    setState(this.store.getState());
                });
                return () => unsubscribe();
            }, [setState]);
        
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
}


export class Session {
    constructor(data, local=false) {
        console.log("Initializing session manager")

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
    }

    getUUID() {
        return this.rawData.uuid
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
        estacio.updateAudioGraphParameter(nomParametre)
    }
    
    updateParametreEstacioInServer(nomEstacio, nomParametre, valor) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            socket.emit('update_session_parameter', {session_uuid: this.getUUID(), nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor});
        } else {
            // In local mode, we update parameter in the same object as it is not synced with the server
            this.updateParametreEstacio(nomEstacio, nomParametre, valor)
        }
    }
}
