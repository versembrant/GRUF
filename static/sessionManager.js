var currentSession = undefined;

class Session {
    constructor(data) {
        // Copy passed data to this object
        Object.assign(this, data);
        
        // Create Redux stores for each estacio so this can be binded to corresponding react components
        for (var estacio in this.data.estacions) {
            if (Object.prototype.hasOwnProperty.call(this.data.estacions, estacio)) {
                if (this.data.estacions[estacio].tipus === 'oscilador'){
                    this.data.estacions[estacio].store = Redux.createStore(
                        Redux.combineReducers({
                            freq: (state = this.data.estacions[estacio].parametres.freq, action) => {
                                switch (action.type) {
                                    case 'SET_freq':
                                    return action.value;
                                    default:
                                    return state;
                                }
                            },
                            amplitud: (state = this.data.estacions[estacio].parametres.amplitud, action) => {
                                switch (action.type) {
                                    case 'SET_amplitud':
                                    return action.value;
                                    default:
                                    return state;
                                }
                            },
                            tipus: (state = this.data.estacions[estacio].parametres.tipus, action) => {
                                switch (action.type) {
                                    case 'SET_tipus':
                                    return action.value;
                                    default:
                                    return state;
                                }
                            },
                        })
                        );
                    }
                }
            }
        }
        
        updateParameter(nomEstacio, nomParametre, valor) {
            const estacio = this.data.estacions[nomEstacio];
            estacio.store.dispatch({ type: 'SET_' + nomParametre, value: valor });

            // També actualitzem el valor fora de l'store, tot i que això no seria necessari si ja està guardat a l'store (informació duplicada)
            estacio.parametres[nomParametre] = valor;
        }
        
        updateParameterInServer(nomEstacio, nomParametre, valor) {
            socket.emit('update_session_parameter', {session_uuid: this.uuid, nom_estacio: nomEstacio, nom_parametre: nomParametre, valor: valor});
        }
    }
    
    socket.on('connect', function() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString); 
        const joinSessionUUID = urlParams.get('join') || undefined;
        const newSessionName = urlParams.get('new') || undefined;
        const username = (Math.random() + 1).toString(36).substring(7);
        
        if (newSessionName !== undefined) {
            const sessionData = {
                estacions: {
                    oscilador1: {
                        tipus: 'oscilador',
                        nivell: 0,
                        parametres: {
                            freq: 440 + Math.random() * 100,
                            amplitud: 0.3 + Math.random() * 0.7,
                            tipus: 'sinusoidal'
                        }
                    }, 
                    oscilador2: {
                        tipus: 'oscilador',
                        nivell: 0,
                        parametres: {
                            freq: 880 + Math.random() * 100,
                            amplitud: 0.3 + Math.random() * 0.7,
                            tipus: 'sinusoidal'
                        }
                    }
                },
            }
            socket.emit('new_session', {name: newSessionName, session_data: sessionData, username: username})
        }
        
        if (joinSessionUUID !== undefined) {
            socket.emit('join_session', {session_uuid: joinSessionUUID, username: username})
        }
        
    });
    
    socket.on('set_session_data', function (data) {
        console.log('JOIN THIS SESSION AT: ' + window.location.origin + window.location.pathname + '?join=' + data.uuid)
        currentSession = new Session(data); 
        document.dispatchEvent(new Event("newSessionDataLoaded"));
    });
    
    socket.on('update_session_parameter', function (data) {
        if ((currentSession !== undefined) && (data.session_uuid === currentSession.uuid)) {
            currentSession.updateParameter(data.nom_estacio, data.nom_parametre, data.valor);
        }
    });
    
    