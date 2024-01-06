import { EstacioHelperBase, registerEstacioHelperInstance } from "./estacionsUtils";


class EstacioOsciladorHelper extends EstacioHelperBase {
    
    constructor() {
        super();
        this.tipus = 'oscilador'
        this.versio = '0.1'
    }    
    
    getParametersData() {
        return {
            freq: {type: 'float', min: '20.0', max: '4000.0', initial: 440},
            amplitud: {type: 'float', min: '0.0', max: '1.0', initial: 1.0},
            tipus: {type: 'enum', options: ['sinusoidal', 'quadrada', 'serra'], initial: 'sinusoidal'},
        }
    }
}

const estacioOsciladorHelper = new EstacioOsciladorHelper();
registerEstacioHelperInstance(estacioOsciladorHelper);
