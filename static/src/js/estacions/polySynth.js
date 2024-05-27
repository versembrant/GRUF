import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';
import { theWindow } from 'tone/build/esm/core/context/AudioContext';

export class PolySynth extends EstacioBase {

    tipus = 'poly_synth'
    versio = '0.1'
    parametersDescription = {
        // Notes
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[]},
        // Synth params
        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'sine'},
        lpf: {type: 'float', label: 'LPF', min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 3000, initial: 20, logarithmic: true},
        harmonicity: {type: 'float', label: 'Harmonicity', min: 0.95, max: 1.05, initial: 1.0},
        // FX
        reverbWet: {type: 'float', label:'Reverb Wet', min: 0.0, max: 1.0, initial: 1.0},
        reverbDecay: {type: 'float', label:'Reverb Decay', min: 0.1, max: 15, initial: 1.0},
        delayWet: {type: 'float', label:'Delay Wet', min: 0.0, max: 1.0, initial: 1.0},
        delayFeedback:{type: 'float', label:'Delay Feedback', min: 0.0, max: 1.0, initial: 0.5},
        delayTime:{type: 'enum', label:'Delay Time', options: ['1/4', '1/8', '1/16','1/8T', '1/16T'], initial: '1/8'},
        drive:{type: 'float', label:'Drive', min: 0.0, max: 1.0, initial: 1.0},
        low:{type: 'float', label:'Low', min: -12, max: 12, initial: 0.0},
        mid:{type: 'float', label:'Mid', min: -12, max: 12, initial: 0.0},
        high:{type: 'float', label:'High', min: -12, max: 12, initial: 0.0},
    }

    getDelayTimeValue(delayTime){
        if      (delayTime === '1/4') 
            return 60/ (1*(getAudioGraphInstance().getBpm()));
        else if (delayTime === '1/8') 
            return 60/ (2*(getAudioGraphInstance().getBpm()));
        else if (delayTime === '1/16') 
            return 60/ (4*(getAudioGraphInstance().getBpm()));
        else if (delayTime === '1/8T') 
            return 60/ (3*(getAudioGraphInstance().getBpm()));
        else if (delayTime === '1/16T') 
            return 60/ (6*(getAudioGraphInstance().getBpm()));
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph i els guardem
        const hpf = new Tone.Filter(6000, "highpass", -24);
        const lpf = new Tone.Filter(500, "lowpass", -24);
        const effects = {
            reverb: new Tone.Reverb({
                decay: 0.5,
                wet: 0,
            }),
            delay: new Tone.FeedbackDelay({
                wet: 1,
                feedback: 0.5,
                delayTime: this.getDelayTimeValue('1/4'),
            }),
            drive: new Tone.Distortion({
                distortion: 0,
            }),
            driveMakeupGain: new Tone.Gain({
                gain: 1.0,
            }),
            eq3: new Tone.EQ3({
                low: 0,
                mid: 0,
                high: 0,
            }),
        }
        const chainEffects = () => {
            return [effects.drive, effects.driveMakeupGain, effects.delay, effects.reverb, effects.eq3];
        };
        const synth = new Tone.PolySynth(Tone.DuoSynth).chain(lpf, hpf, ...chainEffects(), estacioMasterChannel);
        synth.set({maxPolyphony: 8, volume: -12});  // Avoid clipping, specially when using sine
        
        this.audioNodes = {
            synth: synth,
            lpf: lpf,
            hpf: hpf,
            effects: effects,
        };
    }

    updateEffectParameter(effectName, effectKey, paramValue){
        if (this.audioNodes.effects[effectName]){
            this.audioNodes.effects[effectName].set({[effectKey]: paramValue});
        }
    }

    setParameters(parametersDict) {
        for (const [name, value] of Object.entries(parametersDict)) {
            if (name == "lpf") {
                this.audioNodes.lpf.frequency.rampTo(value, 0.01);
            } else if (name == "hpf") {
                this.audioNodes.hpf.frequency.rampTo(value, 0.01);
            } else if (name == "harmonicity") {
                this.audioNodes.synth.set({
                    'harmonicity': value,
                });
            } else if ((name == "attack")
                    || (name == "decay")
                    || (name == "sustain")
                    || (name == "release")
            ){
                this.audioNodes.synth.set({
                    voice0: {'envelope': {[name]: value}},
                    voice1: {'envelope': {[name]: value}},
                })
            } else if (name == "waveform"){
                this.audioNodes.synth.set({
                    voice0: {'oscillator': { type: value }},
                    voice1: {'oscillator': { type: value }},
                })
            } else if (name == "reverbWet"){
                this.updateEffectParameter('reverb','wet', value);
            } else if (name == "reverbDecay"){
                this.updateEffectParameter('reverb','decay', value);
            } else if (name == "delayWet"){
                this.updateEffectParameter('delay','wet', value);
            } else if (name == "delayTime"){
                this.updateEffectParameter('delay','delayTime', this.getDelayTimeValue(value));
            } else if (name == "delayFeedback"){
                this.updateEffectParameter('delay','feedback', value);
            } else if (name == "drive"){
                this.updateEffectParameter('drive','wet', 1.0);
                this.updateEffectParameter('drive','distortion', value);
                const makeupGain = Tone.dbToGain(-1 * Math.pow(value, 0.25) * 8);  // He ajustat aquests valors manualment perquè el crossfade em sonés bé
                this.updateEffectParameter('driveMakeupGain','gain', makeupGain);
            } else if (name == "low"){
                this.updateEffectParameter('eq3','low', value);
            } else if (name == "mid"){
                this.updateEffectParameter('eq3','mid', value);
            } else if (name == "high"){
                this.updateEffectParameter('eq3','high', value);
            }
        }
    }

    updateAudioGraphFromState(preset) {
        const parametersDict = {}
        Object.keys(this.parametersDescription).forEach(nomParametre => {
            parametersDict[nomParametre] = this.getParameterValue(nomParametre, preset);
        })
        this.setParameters(parametersDict) 
    }

    updateAudioGraphParameter(nomParametre, preset) {
        this.setParameters({[nomParametre]: this.getParameterValue(nomParametre, preset)})
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Iterate over all the notes in the sequence and trigger those that start in the current beat (step)
        const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
        const notes = this.getParameterValue('notes', this.currentPreset);
        for (let i = 0; i < notes.length; i++) {
            const minBeat = currentStep;
            const maxBeat = currentStep + 1;
            const note = notes[i];
            // note will be an object with properties
            // b = beat (or step in which the note has to be played)
            // n = midi note number
            // d = duration of the note in beats (or steps)
            if ((note.b >= minBeat) && (note.b < maxBeat)) {
                this.audioNodes.synth.triggerAttackRelease([Tone.Frequency(note.n, "midi").toNote()], note.d * Tone.Time("16n").toSeconds(), time);
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.synth.releaseAll()
    }

    lastNoteOnBeats = {}

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };

        const recEnabled = document.getElementById(this.nom + '_notes_REC').checked;
        if (!noteOff){
            this.audioNodes.synth.triggerAttack([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
            if (recEnabled){
                // If rec enabled, we can't create a note because we need to wait until the note off, but we should save
                // the note on time to save it
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
                this.lastNoteOnBeats[midiNoteNumber] = currentStep;
            }
        } else {
            this.audioNodes.synth.triggerRelease([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
            if (recEnabled){
                // If rec enabled and we have a time for the last note on, then create a new note object, otherwise do nothing
                const lastNoteOnTimeForNote = this.lastNoteOnBeats[midiNoteNumber]
                if (lastNoteOnTimeForNote !== undefined){
                    const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                    const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
                    if (lastNoteOnTimeForNote < currentStep){
                        // Only save the note if note off time is bigger than note on time
                        const notes = this.getParameterValue('notes', this.currentPreset);
                        notes.push({'n': midiNoteNumber, 'b': lastNoteOnTimeForNote, 'd': currentStep - lastNoteOnTimeForNote})
                        this.updateParametreEstacio('notes', notes); // save change in server!
                    }
                    this.lastNoteOnBeats[midiNoteNumber] = undefined;
                }
            }
        }
    }
}
