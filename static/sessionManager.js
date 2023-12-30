class Session {
    constructor(data) {
        // Copy passed data to this object
        Object.assign(this, data);

        // TODO: Create Redux store for the common session data (transport, users connected, etc...)
        
        // Create Redux stores for each estacio so this can be binded to corresponding react components
        // These stores are created automatically for each parmetre in estacio.parametres.
        for (var estacio in this.estacions) {
            if (Object.prototype.hasOwnProperty.call(this.estacions, estacio)) {
                const estacioObj = this.estacions[estacio];
                const reducers = {};
                Object.keys(estacioObj['parametres']).forEach(nom_parametre => {
                    reducers[nom_parametre] = (state = this.estacions[estacio].parametres[nom_parametre], action) => {
                        switch (action.type) {
                            case 'SET_' + nom_parametre:
                            return action.value;
                            default:
                            return state;
                        }
                    }
                });
                this.estacions[estacio].store = Redux.createStore(Redux.combineReducers(reducers));
            }
        }
    }
    
    updateParametreEstacio(nomEstacio, nomParametre, valor) {
        const estacio = this.estacions[nomEstacio];
        estacio.store.dispatch({ type: 'SET_' + nomParametre, value: valor });

        // També actualitzem el valor fora de l'store, tot i que això no seria necessari si ja està guardat a l'store (tindrem informació duplicada)
        estacio.parametres[nomParametre] = valor;
    }
    
    updateParametreEstacioInServer(nomEstacio, nomParametre, valor) {
        socket.emit('update_session_parameter', {session_uuid: this.uuid, nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor});
    }
}

