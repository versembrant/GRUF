import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';

export class EstacioSynth extends EstacioBase {

    tipus = 'synth'
    versio = '0.1'
    parametersDescription = {
        noteBase: {type: 'float', label:'Nota base', min: 0, max: 127, step: 1, initial: 64},
        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},
        waveform: {type: 'enum', label:'Waveform', options: ['sine', 'square', 'triangle', 'sawtooth'], initial: 'sine'},
        lpf: {type: 'float', label: 'LPF', min: 500, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 6000, initial: 20, logarithmic: true},
        notes: {type: 'grid', label:'Notes', numRows: 8, numCols: 16, initial:[]},
        reverbSend:{type: 'float', label: 'Reverb Send', min: -60, max: 6, initial: -60},
        delaySend:{type: 'float', label: 'Delay Send', min: -60, max: 6, initial: -60},
        driveSend:{type: 'float', label: 'Drive Send', min: -60, max: 6, initial: -60},
        eq3Send: {type: 'float', label: 'EQ3 Send', min: -60, max: 6, initial: -60},
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

    updateEffectParameter(effectName, effectKey, paramName, preset){
        if (paramName === 'delayTime'){
            const paramValue = this.getDelayTimeValue(this.getParameterValue(paramName, preset))
            if (this.audioNodes.effects[effectName]){
                this.audioNodes.effects[effectName].set({[effectKey]: paramValue});
            }
        }
        else {
            const paramValue = this.getParameterValue(paramName, preset);
            if (this.audioNodes.effects[effectName]){
                this.audioNodes.effects[effectName].set({[effectKey]: paramValue});
            }
        }
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
        const dryGainNode = new Tone.Channel().connect(estacioMasterChannel);
        const lpf = new Tone.Filter(500, "lowpass").connect(dryGainNode);
        const hpf = new Tone.Filter(6000, "highpass").connect(dryGainNode);
        const synth = new Tone.PolySynth(Tone.Synth).connect(lpf).connect(hpf);
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
            eq3: new Tone.EQ3(),
        }
        const effectsChannels = {
            reverbChannel: new Tone.Channel(),
            delayChannel: new Tone.Channel(),
            driveChannel: new Tone.Channel(),
            eq3Channel: new Tone.Channel(),
        }
        //Connectem els efectes a la sortida d'àudio
        Object.values(effects).forEach(effect => {
            effect.connect(estacioMasterChannel);
        }); 
        //Connectem els canals d'efectes al seu respectiu efecte
        Object.keys(effectsChannels).forEach((key, index) => {
            const effectKey = Object.keys(effects)[index];
            effectsChannels[key].connect(effects[effectKey]);
        });

        Object.keys(effectsChannels).forEach(key => {
            const busName = key.replace('Channel', 'Synth'); // exemple: reverbChannel -> reverbSynth
            effectsChannels[key].receive(busName);
        });


        synth.set({maxPolyphony: 16});
        this.audioNodes = {
            synth: synth,
            lpf: lpf,
            hpf: hpf,
            effects: effects,
            sendReverbGainNode: dryGainNode.send("reverbSynth", -100),
            sendDelayGainNode: dryGainNode.send("delaySynth", -100),
            sendDriveGainNode: dryGainNode.send("driveSynth", -100),
            sendEq3GainNode: dryGainNode.send('eq3Synth', -100),
        };
    }

    updateAudioGraphFromState(preset) {
        this.audioNodes.synth.set({
            'envelope': {
                attack:  this.getParameterValue('attack', preset),
                decay: this.getParameterValue('decay', preset),
                sustain: this.getParameterValue('sustain', preset),
                release: this.getParameterValue('release', preset),
            },
            'oscillator': {
                type: this.getParameterValue('waveform', preset),
            },
            'volume': -12,  // Avoid clipping, specially when using sine
        });
        this.audioNodes.lpf.frequency.rampTo(this.getParameterValue('lpf', preset),0.01);
        this.audioNodes.hpf.frequency.rampTo(this.getParameterValue('hpf', preset),0.01);
        this.audioNodes.sendReverbGainNode.gain.value = this.getParameterValue('reverbSend',preset);
        this.audioNodes.sendDelayGainNode.gain.value = this.getParameterValue('delaySend',preset);
        this.audioNodes.sendDriveGainNode.gain.value = this.getParameterValue('driveSend',preset);
        this.updateEffectParameter('reverb','wet','reverbWet', preset);
        this.updateEffectParameter('reverb','decay','reverbDecay', preset);
        this.updateEffectParameter('delay','wet','delayWet', preset);
        this.updateEffectParameter('delay','wet','delayTime', preset);
        this.updateEffectParameter('delay','feedback','delayFeedback', preset);
        this.updateEffectParameter('drive','distortion','drive', preset);
    }

    updateAudioGraphParameter(nomParametre, preset) {
        // Com que hi ha molt poc a actualizar, sempre actualitzem tots els parametres sense comprovar quin ha canviat (sense optimitzar)
        this.updateAudioGraphFromState(preset);
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('notes').numCols;
        const notes = this.getParameterValue('notes', this.currentPreset);
        const notesToPlay = [];
        for (let i = 0; i < this.getParameterDescription('notes').numRows; i++) {
            if (indexOfArrayMatchingObject(notes, {'i': i, 'j': currentStep}) > -1){
                const noteOffset = this.getParameterDescription('notes').numRows - 1 - i;  // 0 = nota més greu, numRows = nota més aguda
                const noteOffsetMap = [0, 2, 4, 5, 7, 9, 11, 12];  // Mapa de offsets de notes (per fer intervals musicals)
                const midiNoteNumber = this.getParameterValue('noteBase', this.currentPreset) + noteOffsetMap[noteOffset];  // Midi numbers
                notesToPlay.push(Tone.Frequency(midiNoteNumber, "midi").toNote());
            }
        }
        this.audioNodes.synth.triggerAttackRelease(notesToPlay, "16n", time);
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };
        if (!noteOff){
            this.audioNodes.synth.triggerAttack([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
        } else {
            this.audioNodes.synth.triggerRelease([Tone.Frequency(midiNoteNumber, "midi").toNote()], Tone.now());
        }
    }
}
