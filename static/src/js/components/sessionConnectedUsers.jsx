import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getSocketID } from "../serverComs";

export const SessionConnectedUsers = () => {
    subscribeToStoreChanges(getCurrentSession());
    return (
        <div className="ellipsis" style={{"max-width": "700px"}}>
            Usuaris connectats ({getCurrentSession().getConnectedUsers().length}): {getCurrentSession().getConnectedUsers().map(sessionID => <span key={sessionID} style={sessionID == getSocketID() ? {color:'green', marginRight:'8px'}:{marginRight:'8px'}}>{sessionID}</span>)}
        </div>
    )
};