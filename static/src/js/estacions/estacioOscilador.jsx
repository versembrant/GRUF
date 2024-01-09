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

    getAudioGraph(estacioObj) {
        // This one requires no volatile state
        const estacioObjState = estacioObj.store.getState();        
        const oscilator = new Tone.Oscillator(estacioObjState.freq, "sine").toDestination();
        oscilator.volume.value = Tone.gainToDb(estacioObjState.amplitud);
        return {
            oscilator: oscilator,
        };
    }

    updateAudioGraph(audioGraphEstacio, estacioObj, nomParametre, valor) {
        // Com que hi ha molt poc a actualizar, sempre actualitzem tots els parametres sense comprovar quin ha canviat
        const estacioObjState = estacioObj.store.getState();        
        audioGraphEstacio.oscilator.frequency.value = estacioObjState.freq;
        audioGraphEstacio.oscilator.volume.value = Tone.gainToDb(estacioObjState.amplitud);
    }

    onStartAudioGraph(audioGraphEstacio, estacioObj) {
        audioGraphEstacio.oscilator.start()
    }

    onStopAudioGraph(audioGraphEstacio, estacioObj) {
        audioGraphEstacio.oscilator.stop()
    }
}

registerEstacioHelperInstance(new EstacioOsciladorHelper());
