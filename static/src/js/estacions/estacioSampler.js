import * as Tone from 'tone'
import { EstacioBase, getCurrentSession, updateParametreEstacio } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing} from '../utils';
import { AudioGraph, getAudioGraphInstance } from '../audioEngine';
import { EstacioSamplerUI } from "../components/estacioSampler";

export class EstacioSampler extends EstacioBase {
    
    tipus = 'sampler'
    versio = '0.1'
    parametersDescription = {
        pattern: {type: 'grid', label:'Pattern', numRows: 16, initial:[], showRecButton: true, followsPreset: true},
        ...Array.from({ length: 16 }).reduce((acc, _, i) => ({
            ...acc,
            [`sound${i + 1}URL`]: {type: 'text', label: `Sample${i + 1}`, initial: ''},
            [`start${i + 1}`]: {type: 'float', label: `Start${i + 1}`, min: 0, max: 1, initial: 0},
            [`end${i + 1}`]: {type: 'float', label: `End${i + 1}`, min: 0, max: 1, initial: 1},
            [`attack${i + 1}`]: {type: 'float', label: `Attack${i + 1}`, min: 0, max: 10, initial: 0.01},
            [`decay${i + 1}`]: {type: 'float', label: `Decay${i + 1}`, min: 0, max: 10, initial: 0.1},
            [`sustain${i + 1}`]: {type: 'float', label: `Sustain${i + 1}`, min: 0, max: 1, initial: 0.5},
            [`release${i + 1}`]: {type: 'float', label: `Release${i + 1}`, min: 0, max: 10, initial: 1},
            [`volume${i + 1}`]: {type: 'float', label: `Volume${i + 1}`, min: -60, max: 0, initial: 0},
            [`pan${i + 1}`]: {type: 'float', label: `Pan${i + 1}`, min: -1, max: 1, initial: 0},
            [`pitch${i + 1}`]: {
                type: 'enum', 
                label: `Pitch${i + 1}`, 
                options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0','1','2','3','4','5','6','7','8','9','10','11','12'], 
                initial: '0'
            }
        }), {}),
        
        lpf: {type: 'float', label: 'LPF', min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 3000, initial: 20, logarithmic: true},

        // FX
        fxReverbWet: {type: 'float', label:'Reverb Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxReverbDecay: {type: 'float', label:'Reverb Decay', min: 0.1, max: 15, initial: 1.0},
        fxDelayWet: {type: 'float', label:'Delay Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxDelayFeedback:{type: 'float', label:'Delay Feedback', min: 0.0, max: 1.0, initial: 0.5},
        fxDelayTime:{type: 'enum', label:'Delay Time', options: ['1/4', '1/4T', '1/8', '1/8T', '1/16', '1/16T'], initial: '1/8'},
        fxDrive:{type: 'float', label:'Drive', min: 0.0, max: 1.0, initial: 0.0},
        fxEqOnOff: {type : 'bool', label: 'EQ On/Off', initial: false},
        fxLow:{type: 'float', label:'Low', min: -12, max: 12, initial: 0.0},
        fxMid:{type: 'float', label:'Mid', min: -12, max: 12, initial: 0.0},
        fxHigh:{type: 'float', label:'High', min: -12, max: 12, initial: 0.0},
    }

    getTempsBeat = () => {
        return 60.0 / getAudioGraphInstance().getBpm() / 4.0;
    };

    getUserInterfaceComponent() {
        return EstacioSamplerUI
    }

    loadSoundInBuffer(bufferIndex, url) {
        const buffer = this.audioBuffers[bufferIndex];
        if (buffer && buffer.url === url) {
            console.log(`El Buffer ${bufferIndex + 1} ja té la URL ${url} carregada.`);
            return;
        }
        const newBuffer = new Tone.Buffer(url);
        this.audioBuffers[bufferIndex] = newBuffer;
    }

    calculateSlicePoints(buffer, startPoint, endPoint) {
        const duration = buffer.duration;
        const start = startPoint * duration;
        const end = endPoint * duration;
        return { start, end };
    }

    playBufferSlice(player, buffer, startPoint, endPoint, time) {
        if (buffer && buffer.loaded) {
            const { start, end } = this.calculateSlicePoints(buffer, startPoint, endPoint);
            player.buffer = buffer;
            player.start(time, start, end - start);
        }
    }

    buildEstacioAudioGraph(estacioMasterChannel) {

        const hpf = new Tone.Filter(6000, "highpass", -24);
        const lpf = new Tone.Filter(500, "lowpass", -24).connect(hpf);

        this.audioBuffers = Array(16).fill(null);

        // Creem els nodes del graph
        this.audioNodes = {
            players: Array(16).fill(null),
            envelopes: Array(16).fill(null),
            channels: Array(16).fill(null),
            pitchShifts: Array(16).fill(null),
            lpf: lpf,
            hpf: hpf,
        };

        for (let i = 0; i < 16; i++) {
            const envelope = new Tone.AmplitudeEnvelope({
                attack: this[`attack${i + 1}`] || 0.01,
                decay: this[`decay${i + 1}`] || 0.1,
                sustain: this[`sustain${i + 1}`] || 0.5,
                release: this[`release${i + 1}`] || 1
            }).connect(lpf);

            const pitchShift = new Tone.PitchShift({
                pitch: parseInt(this[`pitch${i + 1}`]) || 0
            }).connect(envelope);

            const channel = new Tone.Channel({
                volume: this[`volume${i + 1}`] || -6,
                pan: this[`pan${i + 1}`] || 0,
            }).connect(pitchShift);

            const player = new Tone.Player().connect(channel);
            
            this.audioNodes.players[i] = player;
            this.audioNodes.envelopes[i] = envelope;
            this.audioNodes.channels[i] = channel;
            this.audioNodes.pitchShifts[i] = pitchShift;

        }
        
        this.addEffectChainNodes(hpf, estacioMasterChannel);
    }

    setParameterInAudioGraph(name, value, preset) {
        const match = name.match(/^sound(\d+)URL$/);
        if (match) {
            const index = parseInt(match[1], 10) - 1;
            this.loadSoundInBuffer(index, value);
        }

        const parametersMatch = name.match(/^(start|end|attack|decay|sustain|release|volume|pan|pitch)(\d+)$/);
        if (parametersMatch) {
            const [_, type, indexStr] = parametersMatch;
            const index = parseInt(indexStr, 10) - 1;
            this[`${type}${index + 1}`] = value;

            // Actualitza els paràmetres de ADSR i Channel
            if (type === 'attack' || type === 'decay' || type === 'sustain' || type === 'release') {
                const envelope = this.audioNodes.envelopes[index];
                envelope[type] = value;
            } else if (type === 'volume'|| type === 'pan') {
                const channel = this.audioNodes.channels[index];
                if (type === 'volume'){
                    channel.volume.value = value;
                }
                else {
                    channel.pan.value = value;
                }
            } else if (type === 'pitch') {
                const pitchShift = this.audioNodes.pitchShifts[index];
                pitchShift.pitch = parseInt(value);
            }
        }

        if(name == 'lpf'){
            this.audioNodes.lpf.frequency.rampTo(value, 0.01);
        } else if (name == "hpf") {
            this.audioNodes.hpf.frequency.rampTo(value, 0.01);
        }
    }

    playSoundFromPlayer(playerIndex, time) {
        const buffer = this.audioBuffers[playerIndex];
        const start = this[`start${playerIndex + 1}`];
        const end = this[`end${playerIndex + 1}`];
        const player = this.audioNodes.players[playerIndex];
        const envelope = this.audioNodes.envelopes[playerIndex];
        
        if (buffer && envelope) {
            envelope.triggerAttackRelease(end - start, time);
            this.playBufferSlice(player, buffer, start, end, time);
        }
    }

    stopSoundFromPlayer(playerIndex, time) {
        const player = this.audioNodes.players[playerIndex];
        if (player) {
            player.stop(time);
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        const currentStep = currentMainSequencerStep % (getAudioGraphInstance().getNumSteps());
        const pattern = this.getParameterValue('pattern', this.currentPreset);

        for (let i = 0; i < 16; i++) {
            const shouldPlaySound = indexOfArrayMatchingObject(pattern, {'i': i, 'j': currentStep}) > -1;
            if (shouldPlaySound) {
                this.playSoundFromPlayer(i, time);
            }
        }
    }
    onMidiNote (midiNoteNumber, midiVelocity, noteOff) {
        const playerIndex = midiNoteNumber % 16;

        if (!noteOff) {
            const recEnabled = this.recEnabled('pattern');
            if (recEnabled) {   
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
                const pattern = this.getParameterValue('pattern', this.currentPreset);
                const index = indexOfArrayMatchingObject(pattern, {'i': playerIndex, 'j': currentStep});
                if (index === -1) {
                    pattern.push({'i': playerIndex, 'j': currentStep});
                    this.updateParametreEstacio('pattern', pattern);
                }
            } else {
                this.playSoundFromPlayer(playerIndex, Tone.now());
            }
        } else {
            this.stopSoundFromPlayer(playerIndex);
        }
    }
}