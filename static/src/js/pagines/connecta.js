import { subscribeToAvailableSessions } from "../serverComs"
import { renderReactComponentInElement } from "../utils";
import { Connecta } from '../components/connecta'

let checkLoadedCorrectlyInterval = undefined;

checkLoadedCorrectlyInterval = setInterval(() => {
    location.reload();
}, 2000)

let reactRoot = undefined;

subscribeToAvailableSessions((infoSessions) => {
    clearInterval(checkLoadedCorrectlyInterval);
    reactRoot = renderReactComponentInElement(Connecta, 'root', {infoSessions}, reactRoot)
});