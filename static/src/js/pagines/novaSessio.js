import { renderReactComponentInElement } from "../utils";
import { NovaSessio } from "../components/novaSessio";

let reactRoot = undefined;
reactRoot = renderReactComponentInElement(NovaSessio, 'root', {}, reactRoot)