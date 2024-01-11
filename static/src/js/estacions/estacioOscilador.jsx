import * as Tone from 'tone'
import { EstacioBase, registerEstacioDisponible } from "../sessionManager";

const tipus = 'oscilador'

class EstacioOscilador extends EstacioBase {
    
    constructor(nom) {
        super(nom);
        this.tipus = tipus
        this.versio = '0.1'
        this.parametersDescription = {
            freq: {type: 'float', label:'Freqüència', min: '20.0', max: '4000.0', initial: 440},
            amplitud: {type: 'float', label:'Gain', min: '0.0', max: '1.0', initial: 0.15},
            waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'sine'},
            notes: {type: 'grid', label:'Notes', numRows: 8, numCols: 16, initial:[]}
        }
        this.updatesUiWithMainSequencer = true;
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
        this.audioNodes.oscilator.type = this.getParameterValue('waveform');
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

registerEstacioDisponible(tipus, EstacioOscilador);
