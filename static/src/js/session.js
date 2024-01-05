import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Session } from "./sessionManager";
import { getCurrentSession, setCurrentSession } from "./sessionManager";
import { getEstacioHelperInstance } from "./estacionsUtils";
import { socket } from "./socket";


const sessionElement = document.getElementsByTagName('session')[0];
if (sessionElement !== undefined) {
    const localMode = sessionElement.dataset.localMode === 'true';
    const sessionUUID = sessionElement.dataset.uuid;
    
    if (localMode){
        // In local mode, session data is passed directly and server is not involved once the session is newSessionDataLoaded
        const sessionData = JSON.parse(sessionElement.dataset.data) //JSON.parse('{{ session.get_full_data() | tojson | safe }}');
        setCurrentSession(new Session(sessionData, localMode)); 
        document.dispatchEvent(new Event("newSessionDataLoaded"));
    } else {
        // In remote mode, all session updates go through the server and come from the server
        socket.on('connect', function() {
            const username = (Math.random() + 1).toString(36).substring(7);
            socket.emit('join_session', {session_uuid: sessionUUID, username: username})
        });
        socket.on('set_session_data', function (data) {
            setCurrentSession(new Session(data, localMode)); 
            document.dispatchEvent(new Event("newSessionDataLoaded"));
        });
        socket.on('update_session_parameter', function (data) {
            if ((getCurrentSession() !== undefined) && (data.session_uuid === getCurrentSession().uuid)) {
                getCurrentSession().updateParametreEstacio(data.nom_estacio, data.nom_parametre, data.valor);
            }
        });
    }
}

document.addEventListener("newSessionDataLoaded", (evt) => {
    console.log('Set currentSession', getCurrentSession());
    const id = 'root';
    const domRoot = document.getElementById(id);
    const reactRoot = createRoot(domRoot);
    
    // Crea un react element per a cada estació
    // TODO: en un futur, només crea l'element per a l'estació sel·leccionada'
    const estacionsReactElements = [];
    for (var nomEstacio in getCurrentSession().estacions) {
        if (Object.prototype.hasOwnProperty.call(getCurrentSession().estacions, nomEstacio)) {
            const estacioObj = getCurrentSession().estacions[nomEstacio];
            const estacioHelper = getEstacioHelperInstance(estacioObj.tipus)
            estacionsReactElements.push(createElement(estacioHelper.getDefaultUI(), {nomEstacio: nomEstacio, estacioObj: estacioObj}));
        }   
        reactRoot.render(createElement(StrictMode, null, ...estacionsReactElements));
    }
},
false,
);
