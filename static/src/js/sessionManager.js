import { createStore, combineReducers } from "redux";
import { getEstacioHelperInstance } from "./estacionsUtils";
import { socket } from "./socket";
import { ensureValidValue } from "./utils";


var currentSession = undefined; 

export const getCurrentSession = () => {
    return currentSession;
}

export const setCurrentSession = (session) => {
    currentSession = session;
}

export class Session {
    constructor(data, local=false) {
        console.log("Initializing session manager")

        this.localMode = local

        // Copy passed data to this object
        Object.assign(this, data);

        // TODO: Create Redux store for the common session data (transport, users connected, etc...)
        
        // Create Redux stores for each estacio so this can be binded to corresponding react components
        // These stores are created automatically for each parmetre of estacio
        for (var estacio in this.estacions) {
            if (Object.prototype.hasOwnProperty.call(this.estacions, estacio)) {
                const estacioObj = this.estacions[estacio];
                const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
                const reducers = {};
                estacioHelper.getParameterNames().forEach(nom_parametre => {
                    const parameterData = estacioHelper.getParametersData()[nom_parametre];
                    reducers[nom_parametre] = (state = ensureValidValue(this.estacions[estacio].parametres[nom_parametre], parameterData), action) => {
                        switch (action.type) {
                            case 'SET_' + nom_parametre:
                            return ensureValidValue(action.value, parameterData);  // Do some checks to make sure the parameter value is valid
                            default:
                            return state;
                        }
                    }
                });
                this.estacions[estacio].store = createStore(combineReducers(reducers));
            }
        }
    }

    getNomsEstacions() {
        return Object.keys(this.estacions);
    }

    getEstacio(nomEstacio) {
        return this.estacions[nomEstacio];
    }
    
    updateParametreEstacio(nomEstacio, nomParametre, valor) {
        const estacio = this.estacions[nomEstacio];
        estacio.store.dispatch({ type: 'SET_' + nomParametre, value: valor });

        // També actualitzem el valor fora de l'store, tot i que això no seria necessari si ja està guardat a l'store (tindrem informació duplicada)
        estacio.parametres[nomParametre] = valor;
    }
    
    updateParametreEstacioInServer(nomEstacio, nomParametre, valor) {
        if (!this.localMode) {
            // In remote mode, we send parameter update to the server and the server will send it back
            socket.emit('update_session_parameter', {session_uuid: this.uuid, nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor});
        } else {
            // In local mode, we update parameter in the same object as it is not synced with the server
            this.updateParametreEstacio(nomEstacio, nomParametre, valor)
        }
    }
}
