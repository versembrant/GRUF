import * as Tone from 'tone'
import { EstacioHelperBase, registerEstacioHelperInstance } from "../estacions";

class EstacioOsciladorHelper extends EstacioHelperBase {
    
    constructor() {
        super();
        this.tipus = 'oscilador'
        this.versio = '0.1'
        this.parametersData = {
            freq: {type: 'float', min: '20.0', max: '4000.0', initial: 440},
            amplitud: {type: 'float', min: '0.0', max: '1.0', initial: 1.0}
        }
    }

    buildEstacioAudioGraph(estacioObj, estacioMasterGainNode) {
        // Aquesta estació no ha de guardar cap estat volàtil, igualment l'inicialitzem amb un objecte buit per consistència
        estacioObj.volatileState = {};

        // Creem els nodes del graph
        const oscilator = new Tone.Oscillator().connect(estacioMasterGainNode);
        
        // Retornem l'objecte amb tots els nodes del graph
        return {
            oscilator: oscilator,
        };
    }

    updateAudioGraphFromState(audioGraphEstacio, estacioObj) {
        const estacioObjState = estacioObj.store.getState();        
        audioGraphEstacio.oscilator.frequency.rampTo(estacioObjState.freq);
        audioGraphEstacio.oscilator.volume.rampTo(Tone.gainToDb(estacioObjState.amplitud));
    }

    updateAudioGraphParameter(audioGraphEstacio, estacioObj, nomParametre) {
        // Com que hi ha molt poc a actualizar, sempre actualitzem tots els parametres sense comprovar quin ha canviat (sense optimitzar)
        this.updateAudioGraphFromState(audioGraphEstacio, estacioObj);
    }

    onTransportStart(audioGraphEstacio, estacioObj) {
        audioGraphEstacio.oscilator.start()
    }

    onTransportStop(audioGraphEstacio, estacioObj) {
        audioGraphEstacio.oscilator.stop()
    }
}

registerEstacioHelperInstance(new EstacioOsciladorHelper());
