import { createElement, useState, useEffect} from "react";
import { createStore, combineReducers } from "redux";
import { socket, ensureValidValue, creaUIWidgetPerParametre } from "./utils";
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
        this.updatesUiWithMainSequencer = false;
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
        return () => {
            const [_, setState] = useState(this.store.getState());
            useEffect(() => {
                const unsubscribe = this.store.subscribe(() => {
                    setState(this.store.getState());
                });
                return () => unsubscribe();
            }, [setState]);

            if (this.updatesUiWithMainSequencer === true) {
                // If UI needs to be updated with the main sequencer (e.g., to show sequencer current step), we register to main session store changes as well
                const [_, setStateSession] = useState(getCurrentSession().store.getState());
                useEffect(() => {
                    const unsubscribe = getCurrentSession().store.subscribe(() => {
                        setStateSession(getCurrentSession().store.getState());
                    });
                    return () => unsubscribe();
                }, [setStateSession]);
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

        // Inicialitza un redux store per informació volàtil de la sessió
        const reducers = {
            mainSequencerCurrentStepLocal: (state = -1, action) => {
                switch (action.type) {
                    case 'SET_mainSequencerCurrentStep':
                    return action.value;
                    default:
                    return state;
                }
            }
        };
        this.store = createStore(combineReducers(reducers));

        console.log("Session initialized!")
    }

    getID() {
        return this.rawData.id
    }

    getNomsEstacions() {
        return Object.keys(this.estacions);
    }

    getEstacio(nomEstacio) {
        return this.estacions[nomEstacio];
    }

    getMainSequencerCurrentStep() {
        // NOTA: aquesta funció retornarà el current step del main sequencer local si n'hi ha (és a dir, si hi 
        // ha un audio graph construït en aquesta instància del navegador), sino retornarà el current step del main
        // sequencer que vingui del servidor (és a dir, el current step d'un main sequencer que està corrent en alguna
        // altra instància de la sessió en algun altre lloc del món). De moment només retornem el local.
        return this.store.getState()['mainSequencerCurrentStepLocal']
    }
    
    updateParametreEstacio(nomEstacio, nomParametre, valor) {
        const estacio = this.getEstacio(nomEstacio);

        // Triguejem canvi a l'store (que generarà canvi a la UI)
        estacio.store.dispatch({ type: 'SET_' + nomParametre, value: valor });

        // Triguejem canvi a l'audio graph
        if (getAudioGraphInstance().graphIsBuilt){
            estacio.updateAudioGraphParameter(nomParametre)
        }
    }
    
    updateParametreEstacioInServer(nomEstacio, nomParametre, valor) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            socket.emit('update_session_parameter', {session_id: this.getID(), nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor});
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
