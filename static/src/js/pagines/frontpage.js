import { renderReactComponentInElement } from "../utils";
import { Frontpage } from "../components/frontpage";

let reactRoot = undefined;
reactRoot = renderReactComponentInElement(Frontpage, 'root', {}, reactRoot)