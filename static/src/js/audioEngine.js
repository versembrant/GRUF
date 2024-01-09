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

    // Crea el node "loop" principal per marcar passos a les estacions que segueixen el sequenciador
    this.masterSequencer = new Tone.Loop(time => {
      // Update store de la sessió amb el current step del main sequencer local
      getCurrentSession().store.dispatch({ type: 'SET_mainSequencerCurrentStepLocal', value: this.masterSequencerCurrentStep });

      // Call sequencer tick functions on all stations
      getCurrentSession().getNomsEstacions().forEach(nomEstacio => {
          const estacio = getCurrentSession().getEstacio(nomEstacio);
          estacio.onSequencerTick(this.masterSequencerCurrentStep, time);
      });
      // Advance current step and update volatile state
      this.masterSequencerCurrentStep += 1;
  }, "16n").start(0);

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
        this.masterSequencerCurrentStep = 0  // TODO: si hi ha alguna altra instància del navegador que ja està tocant, aquest valor s'hauria de llegir del servidor per anar el més sincronitzats possible
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
        this.masterSequencerCurrentStep = -1
        getCurrentSession().store.dispatch({ type: 'SET_mainSequencerCurrentStepLocal', value: this.masterSequencerCurrentStep });
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
