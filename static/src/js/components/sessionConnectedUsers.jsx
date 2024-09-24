import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getSocketID } from "../serverComs";

export const SessionConnectedUsers = ({showIDs=false}) => {
    subscribeToStoreChanges(getCurrentSession());
    return (
        <div className="ellipsis" style={{"maxWidth": "700px"}}>
            {getCurrentSession().getConnectedUsers().length} usuari{getCurrentSession().getConnectedUsers().length === 1 ? "": "s"} connectat{getCurrentSession().getConnectedUsers().length === 1 ? "": "s"}{showIDs == true ? ": ": ""}{showIDs == true ? getCurrentSession().getConnectedUsers().map(sessionID => <span key={sessionID} style={sessionID == getSocketID() ? {color:'green', marginRight:'8px'}:{marginRight:'8px'}}>{sessionID}</span>): ""}
        </div>
    )
};