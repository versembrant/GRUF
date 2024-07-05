import * as Tone from 'tone'
import { EstacioBase, getCurrentSession, updateParametreEstacio } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing} from '../utils';
import { AudioGraph, getAudioGraphInstance } from '../audioEngine';

export class EstacioSampler extends EstacioBase {
    
    tipus = 'sampler'
    versio = '0.1'
    parametersDescription = {
        pattern: {type: 'grid', label:'Pattern', numRows: 4, initial:[], showRecButton: true, followsPreset: true},
        //General Controls
        volume: {type: 'float', label: 'Volume', min: -30, max: 6, initial: 0},
        pan: {type: 'float', label: 'Pan', min: -1, max: 1, initial:0},
        //URLs
        sound1URL: {type: 'text', label: 'Sample1', initial: 'https://cdn.freesound.org/previews/559/559850_12295155-lq.mp3'}, 
        sound2URL: {type: 'text', label: 'Sample2', initial: 'https://cdn.freesound.org/previews/75/75840_260058-hq.mp3'}, 
        sound3URL: {type: 'text', label: 'Sample3', initial: 'https://cdn.freesound.org/previews/693/693151_14904072-hq.mp3'}, 
        sound4URL: {type: 'text', label: 'Sample4', initial: 'https://cdn.freesound.org/previews/274/274775_4965320-hq.mp3'}, 
        
        //Samples Controls
        start1: {type: 'float', label: 'Start1', min: 0, max: 1, initial: 0},
        end1: {type: 'float', label: 'End1', min: 0, max: 1, initial: 1},
        start2: {type: 'float', label: 'Start2', min: 0, max: 1, initial: 0},
        end2: {type: 'float', label: 'End2', min: 0, max: 1, initial: 1},
        start3: {type: 'float', label: 'Start3', min: 0, max: 1, initial: 0},
        end3: {type: 'float', label: 'End3', min: 0, max: 1, initial: 1},
        start4: {type: 'float', label: 'Start4', min: 0, max: 1, initial: 0},
        end4: {type: 'float', label: 'End4', min: 0, max: 1, initial: 1},

        //Filters

        lpf: {type: 'float', label: 'LPF', min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', min: 20, max: 3000, initial: 20, logarithmic: true}, 

        attack: {type: 'float', label:'Attack', min: 0.0, max: 2.0, initial: 0.01},
        decay: {type: 'float', label:'Decay', min: 0.0, max: 2.0, initial: 0.01},
        sustain: {type: 'float', label:'Sustain', min: 0.0, max: 1.0, initial: 1.0},
        release: {type: 'float', label:'Release', min: 0.0, max: 5.0, initial: 0.01},

        // FX
        fxReverbWet: {type: 'float', label:'Reverb Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxReverbDecay: {type: 'float', label:'Reverb Decay', min: 0.1, max: 15, initial: 1.0},
        fxDelayWet: {type: 'float', label:'Delay Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxDelayFeedback:{type: 'float', label:'Delay Feedback', min: 0.0, max: 1.0, initial: 0.5},
        fxDelayTime:{type: 'enum', label:'Delay Time', options: ['1/4', '1/8', '1/16','1/8T', '1/16T'], initial: '1/8'},
        fxDrive:{type: 'float', label:'Drive', min: 0.0, max: 1.0, initial: 0.0},
        fxEqOnOff: {type : 'bool', label: 'EQ On/Off', initial: false},
        fxLow:{type: 'float', label:'Low', min: -12, max: 12, initial: 0.0},
        fxMid:{type: 'float', label:'Mid', min: -12, max: 12, initial: 0.0},
        fxHigh:{type: 'float', label:'High', min: -12, max: 12, initial: 0.0},

        
    }

    getTempsBeat = () => {
        return 60.0 / getAudioGraphInstance().getBpm() / 4.0;
    };

    loadSoundInBuffer(bufferName, url){
        if (["sample1", "sample2", "sample3", "sample4"].includes(bufferName)){
            const buffer = this.audioBuffers[bufferName];
            if (buffer && buffer.url === url){
                console.log(`El Buffer ${bufferName} ja té la URL ${url} carregada.`);
                return;
            }
            const newBuffer = new Tone.Buffer(url);
            this.audioBuffers[bufferName] = newBuffer;
        }
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

        const ampEnv = new Tone.AmplitudeEnvelope({
            attack: 0.1,
            decay: 0.2,
            sustain: 0.5,
            release: 0.8,
        });

        const samplerChannel = new Tone.Channel({
            volume:0,
            pan: 0,
        }).connect(ampEnv);

        const hpf = new Tone.Filter(6000, "highpass", -24).connect(samplerChannel);
        const lpf = new Tone.Filter(500, "lowpass", -24).connect(hpf);

        const player1 = new Tone.Player().connect(lpf);
        const player2 = new Tone.Player().connect(lpf);
        const player3 = new Tone.Player().connect(lpf);
        const player4 = new Tone.Player().connect(lpf);

        this.audioBuffers = {
            sample1: null,
            sample2: null,
            sample3: null,
            sample4: null,
        }
        
        // Creem els nodes del graph
        this.audioNodes = {
            player1: player1,
            player2: player2,
            player3: player3,
            player4: player4,
            lpf: lpf,
            hpf: hpf,
            ampEnv: ampEnv, 
            gain: samplerChannel,
        }
        this.addEffectChainNodes(ampEnv, estacioMasterChannel);
    }

    setParameterInAudioGraph(name, value, preset) {
        if (name === 'sound1URL'){
            this.loadSoundInBuffer('sample1', value);
        } else if (name === 'sound2URL'){
            this.loadSoundInBuffer('sample2', value);
        } else if (name === 'sound3URL'){
            this.loadSoundInBuffer('sample3', value);
        } else if (name === 'sound4URL'){
            this.loadSoundInBuffer('sample4', value);
        } else if ((name == "attack")
            || (name == "decay")
            || (name == "sustain")
            || (name == "release")){
            this.audioNodes.ampEnv.set({
                name:value}
            );
        } else if (name=== 'volume'){
            this.audioNodes.gain.volume.value = value;
        } else if (name=== 'pan'){
            this.audioNodes.gain.pan.value = value;
        } else if (name == "hpf") {
            this.audioNodes.hpf.frequency.rampTo(value, 0.01);
        } else if (name == "lpf") {
            this.audioNodes.lpf.frequency.rampTo(value, 0.01);
        }
        if (name.startsWith('start') || name.startsWith('end')) {
            this[name] = value;
        }    
    }

    playSoundFromPlayer(playerName, time) {
        const validPlayers = ["player1", "player2", "player3", "player4"];
        if (validPlayers.includes(playerName)) {
            const bufferName = `sample${playerName.slice(-1)}`;
            const buffer = this.audioBuffers[bufferName];
            const start = this[`start${bufferName.slice(-1)}`];
            const end = this[`end${bufferName.slice(-1)}`];
            const player = this.audioNodes[playerName];
            const ampEnv = this.audioNodes.ampEnv;
            ampEnv.triggerAttackRelease(0.5);
            this.playBufferSlice(player, buffer, start, end, time);
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % (getAudioGraphInstance().getNumSteps());
        const pattern = this.getParameterValue('pattern', this.currentPreset);
        const shouldPlaySound1 = indexOfArrayMatchingObject(pattern, {'i': 0, 'j': currentStep}) > -1;
        const shouldPlaySound2 = indexOfArrayMatchingObject(pattern, {'i': 1, 'j': currentStep}) > -1;
        const shouldPlaySound3 = indexOfArrayMatchingObject(pattern, {'i': 2, 'j': currentStep}) > -1;
        const shouldPlaySound4 = indexOfArrayMatchingObject(pattern, {'i': 3, 'j': currentStep}) > -1;
        const tempsBeat = this.getTempsBeat();
        
        if (shouldPlaySound1) {
            this.playSoundFromPlayer('player1', time)

        }
        if (shouldPlaySound2) {
            this.playSoundFromPlayer('player2', time)
        }
        if (shouldPlaySound3) {
            this.playSoundFromPlayer('player3', time)
        }
        if (shouldPlaySound4) {
            this.playSoundFromPlayer('player4', time)
        }
    }
    onMidiNote (midiNoteNumber, midiVelocity, noteOff){
        const playerName = ["player1", "player2", "player3", "player4"][midiNoteNumber % 4];

        if (!noteOff){
            const recEnabled = this.recEnabled('pattern');
            // Si Rec està ON
            if (recEnabled) {   
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % getAudioGraphInstance().getNumSteps();
                const pattern = this.getParameterValue('pattern', this.currentPreset);
                const index = indexOfArrayMatchingObject(pattern, {'i': (midiNoteNumber % 4), 'j': currentStep});
                if (index === -1) {
                    // Si la nota no està en el patró, l'afegeix
                    pattern.push({'i': (midiNoteNumber % 4), 'j': currentStep});
                    this.updateParametreEstacio('pattern', pattern); // save change in server!
                };
            }
            // Play
            else  this.playSoundFromPlayer(playerName, Tone.now());
        } 
        else {
            // Stop
            /* this.stopSoundFromPlayer(playerName); */
        }
        
    }
}