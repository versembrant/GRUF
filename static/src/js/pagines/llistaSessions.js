import { subscribeToAvailableSessions } from "../serverComs"
import { renderReactComponentInElement } from "../utils";
import { LlistaSessions } from '../components/llistaSessions'

let checkLoadedCorrectlyInterval = undefined;

checkLoadedCorrectlyInterval = setInterval(() => {
    location.reload();
}, 2000)

let reactRoot = undefined;

subscribeToAvailableSessions((infoSessions) => {
    clearInterval(checkLoadedCorrectlyInterval);
    reactRoot = renderReactComponentInElement(LlistaSessions, 'root', {infoSessions}, reactRoot)
});