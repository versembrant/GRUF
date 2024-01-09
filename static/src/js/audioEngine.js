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
    // TODO: check if setting graph to {} will "garbage collect" the previous graph properly
    this.graph = {};
    this.graphIsBuilt = false;
    getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
        const estacioObj = getCurrentSession().getEstacio(nomEstacio);
        const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
        this.graph[nomEstacio] = estacioHelper.getAudioGraph(estacioObj);
    })
    this.graphIsBuilt = true;
  }

  async startAudioContext() {
    if (audioContextIsReady === false){
        await Tone.start()
        console.log("Audio context started")
        audioContextIsReady = true;
    }
  }

  runAudioGraph() {
    if (this.graphIsBuilt === true) {
        console.log("Running audio graph")
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacioObj = getCurrentSession().getEstacio(nomEstacio);
            const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
            estacioHelper.onStartAudioGraph(this.graph[nomEstacio], estacioObj);
        });
        Tone.Transport.start()
    }
  }

  stopAudioGraph() {
    if (this.graphIsBuilt === true) {
        console.log("Stopping audio graph")
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
            const estacioObj = getCurrentSession().getEstacio(nomEstacio);
            const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
            estacioHelper.onStopAudioGraph(this.graph[nomEstacio], estacioObj);
        });
        Tone.Transport.stop()
    }
  }

  updatePrametreEstacio(nomEstacio, estacioObj, nomParametre, valor) {
    if (this.graphIsBuilt){
        const audioGraphEstacio = this.graph[nomEstacio];
        getEstacioHelperInstance(estacioObj.tipus).updateAudioGraph(audioGraphEstacio, estacioObj, nomParametre, valor);
    }
  }
}

const audioGraph = new AudioGraph();

export const getAudioGraphInstance = () => {
    return audioGraph;
}
