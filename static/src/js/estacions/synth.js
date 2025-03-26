import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { EstacioSynthUI } from "../components/estacioSynth";
import { units } from "../utils";

export class BaseSynth extends EstacioBase {
    poly = false;
    showPanicButton = true;
    static parametersDescription = {
        ...EstacioBase.parametersDescription,
        // Notes
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], followsPreset: true},
        // Synth params
        attack: {type: 'float', label:'Attack', unit: units.second, min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', unit: units.second, min: 0.0, max: 5.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', unit: units.second, min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sawtooth', 'triangle', 'square', 'sine'], initial: 'sawtooth'},
        lpf: {type: 'float', label: 'LPF', unit: units.hertz, min: 100, max: 15000, initial: 15000, logarithmic: true},
        ressonance: {type: 'float', label: 'Ressonance', min: 0.0, max: 100.0, initial: 0.0},
        hpf: {type: 'float', label: 'HPF', unit: units.hertz, min: 10, max: 3000, initial: 10, logarithmic: true},
        harmonicity: {type: 'float', label: 'Detune', min: 0.95, max: 1.05, initial: 1.0},
        lfo_rate: {type: 'float', label: 'LFO Rate', unit: units.hertz, min: 0.1, max: 50.0, initial: 0.5, logarithmic: true},
        lfo_depth: {type: 'float', label: 'LFO Depth', min: 0.0, max: 1.0, initial: 0.0},
    }

    buildEstacioAudioGraph(estacioMasterChannel, {poly}) {
        this.poly = poly;

        // Creem els nodes del graph i els connectem entre ells
        const hpf = new Tone.Filter(6000, "highpass", -24);
        const lpf = new Tone.Filter(15000, "lowpass", -24);
        const synth = poly ? new Tone.PolySynth(Tone.MonoSynth) : new Tone.DuoSynth();
        const lfo = new Tone.LFO({amplitude: 1.0, max: 15000, min: 0});
        lpf.connect(hpf);
        synth.connect(lpf);
        
        // Settejem alguns paràmetres inicials que no canviaran
        if (poly) {
            synth.maxPolyphony = 6;  // Maximum 6 voice polyphony per synth
            synth.set({
                attackCurve: "exponential",
                decayCurve: "exponential",
                releaseCurve: "exponential",
                volume: -20 // Avoid clipping, specially when using sine
            });
        } else {
            synth.set({
                vibratoAmount: 0.0,
                voice0: {
                    attackCurve: "exponential",
                    decayCurve: "exponential",
                    releaseCurve: "exponential"
                },
                voice1: {
                    attackCurve: "exponential",
                    decayCurve: "exponential",
                    releaseCurve: "exponential"
                },
                volume: -20 
            });
        }
        // LFO can't be connected to an underlying voice of a poly synth, so we connect it to the main lpf filter
        lfo.connect(lpf.frequency);
        lfo.start();

        // Afegeix els nodes al diccionari de nodes de l'estació
        this.audioNodes = {
            synth: synth,
            hpf: hpf,
            lpf: lpf,
            lfo: lfo
        };

        // Crea els nodes d'efectes (això també els afegirà al diccionari de nodes de l'estació)
        this.addEffectChainNodes(hpf, estacioMasterChannel);
    }

    setParameterInAudioGraph(name, value, preset) {
        switch (name) {
            case "lpf":
                if (this.poly) {
                    this.audioNodes.synth.set({
                        'filterEnvelope': {'baseFrequency': value},
                    })
                    this.audioNodes.lpf.set({
                        'frequency': value,
                    })
                } else {
                    this.audioNodes.synth.set({
                        voice0: {'filterEnvelope': {'baseFrequency': value}},
                        voice1: {'filterEnvelope': {'baseFrequency': value}},
                    })
                }
                break;
            case "hpf":
                this.audioNodes.hpf.frequency.rampTo(value, 0.01);
                break;
            case "ressonance":
                if (this.poly) {
                    this.audioNodes.synth.set({
                        'filter': {'Q': value},
                    })
                } else {
                    this.audioNodes.synth.set({
                        voice0: {'filter': {'Q': value}},
                        voice1: {'filter': {'Q': value}},
                    })
                }
                break;
            case "lfo_rate":
                this.audioNodes.lfo.set({
                    'frequency': value,
                })
                break;
            case "lfo_depth":
                this.audioNodes.lfo.set({
                    'amplitude': value,
                })
                break;
            case "harmonicity":
                if (!this.poly) {
                    // This is only available when using DuoSynth
                    this.audioNodes.synth.set({'harmonicity': value});
                }
                break;
            case "attack":
            case "decay":
            case "sustain":
            case "release":
                if (this.poly) {
                    this.audioNodes.synth.set({
                        'envelope': {[name]: value}, 'filterEnvelope': {[name]: value},
                    })
                } else {
                    this.audioNodes.synth.set({
                        voice0: {'envelope': {[name]: value}, 'filterEnvelope': {[name]: value}},
                        voice1: {'envelope': {[name]: value}, 'filterEnvelope': {[name]: value}},
                    })
                }
                break;
            case "waveform":
                if (this.poly) {
                    this.audioNodes.synth.set({
                        'oscillator': { type: value },
                    })
                } else {
                    this.audioNodes.synth.set({
                        voice0: {'oscillator': { type: value }},
                        voice1: {'oscillator': { type: value }},
                    })
                }
                break;
        }
    }

    onSequencerStep(currentMainSequencerStep, time) {
        // Iterate over all the notes in the sequence and trigger those that start in the current beat (step)
        const currentStep = currentMainSequencerStep % this.getNumSteps();
        const notes = this.getParameterValue('notes');
        for (let i = 0; i < notes.length; i++) {
            const minBeat = currentStep;
            const maxBeat = currentStep + 1;
            const note = notes[i];
            // note will be an object with properties
            // b = beat (or step in which the note has to be played)
            // n = midi note number
            // d = duration of the note in beats (or steps)
            if ((note.b >= minBeat) && (note.b < maxBeat)) {
                let midiNote = note.n;
                if (this.parametersDescription.notes.isMono) midiNote = this.adjustNoteForWaveform(midiNote)
                this.audioNodes.synth.triggerAttackRelease(Tone.Frequency(midiNote, "midi").toNote(), note.d * getAudioGraphInstance().get16BeatTime(), time);
            }
        }
    }

    adjustNoteForWaveform(note) {
        const waveform = this.getParameterValue('waveform');
        if (waveform === 'sine' || waveform === 'triangle') {
            return note + 12;
        }
        return note;
    }

    adjustMidiNoteToEstacioRange(noteNumber) {
        const minNote = this.parametersDescription.notes.notaMesBaixaPermesa || 0;
        const maxNote =  this.parametersDescription.notes.notaMesAltaPermesa || 127;

        // If note is outside range, make it be inside the range by wraping octaves
        if (noteNumber < minNote) {
            const semitonesBelow = (noteNumber - minNote) % 12;
            noteNumber = minNote + semitonesBelow + 12;
        }
        if (noteNumber > maxNote) {
            const semitonesAbove = (noteNumber - maxNote) % 12;
            noteNumber = maxNote + semitonesAbove - 12;
        } 
        return noteNumber;
    }
}

export class Synth extends BaseSynth {

    tipus = 'synth'
    versio = '0.1'
    parametersDescription = {
        ...BaseSynth.parametersDescription,
        notes: {...BaseSynth.parametersDescription.notes, notaMesBaixaTipica: 60, notaMesAltaTipica: 83},
        attack: {...BaseSynth.parametersDescription.attack, initial: 1.2},
        decay: {...BaseSynth.parametersDescription.decay, initial: 2.0},
        sustain: {...BaseSynth.parametersDescription.sustain, initial: 0.8},
        release: {...BaseSynth.parametersDescription.release, initial: 2.0},
        lpf: {...BaseSynth.parametersDescription.lpf, initial: 1400}
    }

    getUserInterfaceComponent() {
        return EstacioSynthUI
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        super.buildEstacioAudioGraph(estacioMasterChannel, {poly: true})
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.synth.releaseAll()
    }

    onStopAllSounds() {
        // Stop all notes, and set release time to 0
        this.setParameterInAudioGraph('release', 0.0);
        this.audioNodes.synth.releaseAll();
        this.setParameterInAudioGraph('release', this.getParameterValue('release'));
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, extras) {
        if (!getAudioGraphInstance().isGraphBuilt()) return;

        midiNoteNumber = this.adjustMidiNoteToEstacioRange(midiNoteNumber);
        if (!noteOff) this.audioNodes.synth.triggerAttack([Tone.Frequency(midiNoteNumber, "midi").toNote()]);
        else this.audioNodes.synth.triggerRelease([Tone.Frequency(midiNoteNumber, "midi").toNote()]);

        if (!extras.skipRecording) this.handlePianoRollRecording(midiNoteNumber, midiVelocity, noteOff);
    }
}
