import { Session } from "./sessionManager";
import React from "react";
import ReactDOM from "react-dom";

const { createElement: e } = React; // Util used in other react components: e = React.createElement

var currentSession = undefined; 

const sessionElement = document.getElementsByTagName('session')[0];
if (sessionElement !== undefined) {
    const localMode = sessionElement.dataset.localMode === 'true';
    const sessionUUID = sessionElement.dataset.uuid;
    

    if (localMode){
        // In local mode, session data is passed directly and server is not involved once the session is newSessionDataLoaded
        const sessionData = JSON.parse(sessionElement.dataset.data) //JSON.parse('{{ session.get_full_data() | tojson | safe }}');
        currentSession = new Session(sessionData, localMode); 
        setTimeout(() => {
            // Use a timeout to make sure all JS stuff has been loaded before the event is fired
            document.dispatchEvent(new Event("newSessionDataLoaded"));
        }, 500)
    } else {

    
        // In remote mode, all session updates go through the server and come from the server
        socket.on('connect', function() {
            const username = (Math.random() + 1).toString(36).substring(7);
            socket.emit('join_session', {session_uuid: sessionUUID, username: username})
        });
        socket.on('set_session_data', function (data) {
            currentSession = new Session(data, localMode); 
            document.dispatchEvent(new Event("newSessionDataLoaded"));
        });
        socket.on('update_session_parameter', function (data) {
            if ((currentSession !== undefined) && (data.session_uuid === currentSession.uuid)) {
                currentSession.updateParametreEstacio(data.nom_estacio, data.nom_parametre, data.valor);
            }
        });
    }
}


document.addEventListener("newSessionDataLoaded", (evt) => {
    console.log('Set currentSession', currentSession);
    const id = 'root';
    const domRoot = document.getElementById(id);
    const reactRoot = ReactDOM.createRoot(domRoot);
    
    // Crea un react element per a cada estació
    // TODO: en un futur, només crea l'element per a l'estació sel·leccionada'
    const estacionsReactElements = [];
    for (var estacio in currentSession.estacions) {
        if (Object.prototype.hasOwnProperty.call(currentSession.estacions, estacio)) {
            const estacioObj = currentSession.estacions[estacio];
            estacionsReactElements.push(e(window[estacioObj.uiWidget], {'nomEstacio': estacio}));
        }   
        reactRoot.render(e(React.StrictMode, null, ...estacionsReactElements));
    }
},
false,
);
