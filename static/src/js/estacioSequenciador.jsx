import { EstacioHelperBase, registerEstacioHelperInstance } from "./estacionsUtils";

class EstacioSequenciadorHelper extends EstacioHelperBase {
    
    constructor() {
        super();
        this.tipus = 'sequenciador'
        this.versio = '0.1'
        this.parametersData = {
            sound1URL: {type: 'text', initial: 'https://cdn.freesound.org/previews/0/808_797-hq.mp3'},
            sound1Steps: {type: 'steps', initial: new Array(8).fill(0.0)},
            sound2URL: {type: 'text', initial: 'https://cdn.freesound.org/previews/561/561514_12517458-hq.mp3'},
            sound2Steps: {type: 'steps', initial: new Array(8).fill(0.0)},
        }
    }
}

registerEstacioHelperInstance(new EstacioSequenciadorHelper());
