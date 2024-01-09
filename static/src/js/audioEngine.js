import * as Tone from 'tone'
import { getCurrentSession } from './sessionManager'

var audioContextIsReady = false;


export class AudioGraph {
  constructor() {
    this.graphIsBuilt = false;
  }

  buildAudioGraph() {
    console.log("Building audio graph")
    this.estacionsMasterGainNodes = {};
    this.graphIsBuilt = false;

    // Crea node master gain (per tenir un volum general)
    this.masterGainNode = new Tone.Gain(1.0).toDestination();

    // Crea els nodes de cada estació i crea un gain individual per cada node (i guarda una referència a cada gain node)
    getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
        const estacio = getCurrentSession().getEstacio(nomEstacio);
        const estacioMasterGainNode = new Tone.Gain(1.0).connect(this.masterGainNode);
        estacio.buildEstacioAudioGraph(estacioMasterGainNode);
        estacio.updateAudioGraphFromState();
        this.estacionsMasterGainNodes[nomEstacio] = estacioMasterGainNode;
    })

    // Marca el graph com a construït
    this.graphIsBuilt = true;
  }

  async startAudioContext() {
    if (audioContextIsReady === false){
        await Tone.start()
        console.log("Audio context started")
        audioContextIsReady = true;
    }
  }

  transportStart() {
    if (this.graphIsBuilt === true) {
        console.log("Transport start")
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            estacio.onTransportStart();
        });
        Tone.Transport.start()
    }
  }

  transportStop() {
    if (this.graphIsBuilt === true) {
        console.log("Transport stop")
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            estacio.onTransportStop();
        });
        Tone.Transport.stop()
    }
  }

  getMasterGain() {
    return this.masterGainNode.gain.value;
  }

  setMasterGain(gain) {
    this.masterGainNode.gain.rampTo(gain);
  }

  getBpm() {
    return Tone.Transport.bpm.value;
  }

  setBpm(bpm) {
    Tone.Transport.bpm.rampTo(bpm);
  }
}

const audioGraph = new AudioGraph();

export const getAudioGraphInstance = () => {
    return audioGraph;
}
