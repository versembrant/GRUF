import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";

export const SessionConnectedUsers = () => {
    subscribeToStoreChanges(getCurrentSession());
    return (
        <div>
            Connected users: {getCurrentSession().getConnectedUsers().join(', ')}
        </div>
    )
};