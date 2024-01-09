import * as Tone from 'tone'
import { getCurrentSession } from './sessionManager'
import { getEstacioHelperInstance } from './estacions'

var audioContextIsReady = false;


export class AudioGraph {
  constructor() {
    this.graphIsBuilt = false;
    this.graph = undefined;
  }

  buildAudioGraph() {
    console.log("Building audio graph")
    this.graph = {};
    this.graphIsBuilt = false;

    // Crea node master gain (per tenir un volum general)
    this.masterGainNode = new Tone.Gain(1.0).toDestination();

    // Crea els nodes de cada estació i crea un gain individual per cada node
    // Guarda referències als nodes a this.graph perquè hi puguem accedir després per actualitzar els paràmetres
    getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
        const estacioObj = getCurrentSession().getEstacio(nomEstacio);
        const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
        const estacioMasterGainNode = new Tone.Gain(1.0).connect(this.masterGainNode);
        const estacioAudioGraph = estacioHelper.buildEstacioAudioGraph(estacioObj, estacioMasterGainNode);
        estacioHelper.updateAudioGraphFromState(estacioAudioGraph, estacioObj);
        estacioAudioGraph['_masterGain'] = estacioMasterGainNode;
        this.graph[nomEstacio] = estacioAudioGraph;
    })

    // Marca el graph com a construït
    this.graphIsBuilt = true;
  }

  updatePrametreEstacio(nomEstacio, estacioObj, nomParametre) {
    if (this.graphIsBuilt){
        const audioGraphEstacio = this.graph[nomEstacio];
        getEstacioHelperInstance(estacioObj.tipus).updateAudioGraphParameter(audioGraphEstacio, estacioObj, nomParametre);
    }
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
            const estacioObj = getCurrentSession().getEstacio(nomEstacio);
            const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
            estacioHelper.onTransportStart(this.graph[nomEstacio], estacioObj);
        });
        Tone.Transport.start()
    }
  }

  transportStop() {
    if (this.graphIsBuilt === true) {
        console.log("Transport stop")
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacioObj = getCurrentSession().getEstacio(nomEstacio);
            const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
            estacioHelper.onTransportStop(this.graph[nomEstacio], estacioObj);
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
