import * as Tone from 'tone'
import { EstacioBase, registerEstacioDisponible } from "../sessionManager";

class EstacioOscilador extends EstacioBase {
    
    constructor(nom) {
        super(nom);
        this.tipus = 'oscilador'
        this.versio = '0.1'
        this.parametersDescription = {
            freq: {type: 'float', label:'Freqüència', min: '20.0', max: '4000.0', initial: 440},
            amplitud: {type: 'float', label:'Gain', min: '0.0', max: '1.0', initial: 1.0}
        }
    }

    buildEstacioAudioGraph(estacioMasterGainNode) {
        // Creem els nodes del graph i els guardem
        const oscilator = new Tone.Oscillator().connect(estacioMasterGainNode);
        this.audioNodes = {
            oscilator: oscilator,
        };
    }

    updateAudioGraphFromState() {
        this.audioNodes.oscilator.frequency.rampTo(this.getParameterValue('freq'));
        this.audioNodes.oscilator.volume.rampTo(Tone.gainToDb(this.getParameterValue('amplitud')));
    }

    updateAudioGraphParameter(nomParametre) {
        // Com que hi ha molt poc a actualizar, sempre actualitzem tots els parametres sense comprovar quin ha canviat (sense optimitzar)
        this.updateAudioGraphFromState();
    }

    onTransportStart() {
        this.audioNodes.oscilator.start()
    }

    onTransportStop() {
        this.audioNodes.oscilator.stop()
    }
}

registerEstacioDisponible('oscilador', EstacioOscilador);
