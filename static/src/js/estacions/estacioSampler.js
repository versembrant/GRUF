import * as Tone from 'tone'
import { EstacioBase, getCurrentSession } from "../sessionManager";
import { indexOfArrayMatchingObject, units } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';
import { EstacioSamplerUI } from "../components/estacioSampler";
import { sampleLibrary} from "../sampleLibrary";


const getSoundURL = (soundName) => {
    // Try find sound name in sample library
    const soundOfSampleLibrary = sampleLibrary.sampler
        .find((sound) => sound.name.toLowerCase() === soundName.toLowerCase());
    if (soundOfSampleLibrary) return window.location.origin + soundOfSampleLibrary.url;

    // Try find sound name in library of uploaded sounds
    const uploadsSoundIndex = getCurrentSession().getRecordedFiles().indexOf(soundName);
    if (uploadsSoundIndex > -1) {
        const baseUrl = appPrefix + '/static/uploads/';
        return baseUrl + getCurrentSession().getID() +  '/' + getCurrentSession().getRecordedFiles()[uploadsSoundIndex];
    }
    // Otherwise, return default sound
    return 'https://cdn.freesound.org/previews/262/262495_2331961-hq.mp3' // Dark pad 
}


const getInitialStartValue = (numSound) => {
    const totalSlices = 20;
    const sliceNum = numSound % totalSlices;
    return sliceNum / totalSlices;
}

const getInitialEndValue = (numSound) => {
    const totalSlices = 20;
    const sliceSpan = 5;
    const sliceNum = numSound % totalSlices;
    return (sliceNum + sliceSpan) / totalSlices;
}


export class EstacioSampler extends EstacioBase {
    
    tipus = 'sampler'
    versio = '0.1'
    parametersDescription = {
        ...EstacioBase.parametersDescription,
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], 
            followsPreset: true, 
            notaMesBaixaPermesa: 0,
            notaMesAltaPermesa: 15,
        },
        sound: {type: 'text', initial: 'adagio strings'},
        ...Array.from({ length: 16 }).reduce((acc, _, i) => ({
            ...acc,
            [`start${i + 1}`]: {type: 'float', label: `Start${i + 1}`, min: 0, max: 1, initial: getInitialStartValue(i)},
            [`end${i + 1}`]: {type: 'float', label: `End${i + 1}`, min: 0, max: 1, initial: getInitialEndValue(i)},
            [`attack${i + 1}`]: {type: 'float', label: `Attack${i + 1}`, unit: units.second, min: 0, max: 2, initial: 0.01},
            [`decay${i + 1}`]: {type: 'float', label: `Decay${i + 1}`, unit: units.second, min: 0, max: 1, initial: 0.1},
            [`sustain${i + 1}`]: {type: 'float', label: `Sustain${i + 1}`, min: 0, max: 1, initial: 1.0},
            [`release${i + 1}`]: {type: 'float', label: `Release${i + 1}`, unit: units.second, min: 0, max: 4, initial: 0.01},
            [`volume${i + 1}`]: {type: 'float', label: `Volume${i + 1}`, unit: units.decibel, min: -60, max: 6, initial: 0},
            [`pan${i + 1}`]: {type: 'float', label: `Pan${i + 1}`, min: -1, max: 1, initial: 0},
            [`pitch${i + 1}`]: {type: 'float', label: `Pitch${i + 1}`, min: -12, max: 12, step: 1, initial: 0},
            [`playerMode${i + 1}`]: {type: 'enum', options: ['oneshot', 'loop'], initial: 'oneshot'}
        }), {}),
        cutoff: {type: 'float', label: 'Cutoff', unit: units.hertz, min: 200, max: 20000, initial: 20000, logarithmic: true},
    }

    getUserInterfaceComponent() {
        return EstacioSamplerUI
    }

    numVoices = 4;
    soundBuffers = {};

    getFreesoundPlayer() {
        const freeSoundPlayer = this.audioNodes.soundPlayers.find(soundPlayer => soundPlayer.player.state === "stopped");
        if (!freeSoundPlayer) {
            // Return randomly one of the players
            const randomSoundPlayer = this.audioNodes.soundPlayers[Math.floor(Math.random() * this.numVoices)];
            randomSoundPlayer.player.stop();
            return randomSoundPlayer;
        }
        return freeSoundPlayer;
    }

    getsoundPlayersWithPadPlaying(padIndex) {
        return this.audioNodes.soundPlayers.filter(soundPlayer => soundPlayer.playingPadIndex === padIndex);
    }

    obteBufferPerSo(soundName) {
        if (this.soundBuffers.hasOwnProperty(soundName)) return this.soundBuffers[soundName];
        return undefined;
    }

    carregaSoABuffer(soundName, onLoadCallback) {
        if (!this.soundBuffers.hasOwnProperty(soundName)) {
            const url = getSoundURL(soundName);
            console.log("Carregant so de la llibreria: ", soundName, ", amb url:", url);
            const buffer = new Tone.Buffer(url, onLoadCallback);
            this.soundBuffers[soundName] = buffer;
        }
    }

    setBufferAPlayers(soundName) {
        if (!this.audioNodes.hasOwnProperty('soundPlayers')) return;
        this.audioNodes.soundPlayers.forEach(soundPlayer => {
            soundPlayer.player.buffer = this.obteBufferPerSo(soundName);
            console.log("So ", soundName, "carregat a buffer de player ");
        });
    }

    stopAllPlayers() {
        if (!this.audioNodes.hasOwnProperty('soundPlayers')) return;
        this.audioNodes.soundPlayers.forEach(soundPlayer => soundPlayer.player.stop());
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        const lpf = new Tone.Filter(500, "lowpass", -24, {channelCount: 2});  // Make channel count explicit although it might not be needed (?)

        const soundPlayers = [];
        for (let i = 0; i < this.numVoices; i++) {
            
            const channel = new Tone.Channel({
                volume: -6,
                pan: 0,
            }).connect(lpf);
            
            const envelope = new Tone.AmplitudeEnvelope().connect(channel);        

            const player = new Tone.Player({
                fadeIn: 0.01,
                fadeOut: 0.01
            }).connect(envelope);
            
            soundPlayers.push({
                player: player,
                envelope: envelope,
                channel: channel,
                playingPadIndex: -1
            })
        }
        
        this.audioNodes = {
            lpf: lpf,
            soundPlayers: soundPlayers,
        };
        
        this.addEffectChainNodes(lpf, estacioMasterChannel);
        this.isGraphBuilt = true;
    }

    setParameterInAudioGraph(name, value, preset) {
        const parametersMatch = name.match(/^(start|end|playerMode|attack|decay|sustain|release|volume|pan|pitch)(\d+)$/);
        if (parametersMatch) {
            const [_, type, indexStr] = parametersMatch;
            const padIndex = parseInt(indexStr, 10) - 1;

            const affectedsoundPlayers = this.getsoundPlayersWithPadPlaying(padIndex);
            affectedsoundPlayers.forEach(soundPlayer => {
                if (type === 'attack' || type === 'decay' || type === 'sustain' || type === 'release') {
                    soundPlayer.envelope[type] = value;
                } else if (type === 'volume'|| type === 'pan') {
                    const channel = soundPlayer.channel;
                    if (type === 'volume'){
                        channel.volume.value = value;
                    }
                    else {
                        channel.pan.value = value;
                    }
                } else if (type === 'pitch') {
                    const integerPitch = parseInt(value);
                    // TODO: set playbackRate accordingly (?)
                    soundPlayer.player.playbackRate = Math.pow(2, integerPitch / 12);
                }else if (type === 'start') {
                    // Also next time we do play, we'll start from this point
                    soundPlayer.player.loopStart = value * soundPlayer.player.buffer.duration;
                } else if (type === 'end') {
                    // Also next time we do play, we'll trigger release at this point
                    soundPlayer.player.loopEnd = value * soundPlayer.player.buffer.duration;
                } else if (type === 'playerMode') {
                    soundPlayer.player.loopStart = value;
                }
            });
        } else if (name == 'cutoff'){
            this.audioNodes.lpf.frequency.rampTo(value, 0.01);
        } else if (name == 'sound') {
            this.stopAllPlayers();
            this.carregaSoABuffer(value, () => {
                this.setBufferAPlayers(value);
            });
        }
    }

    triggerPad(padIndex, time, duration) {
        const soundPlayer = this.getFreesoundPlayer();
        soundPlayer.playingPadIndex = padIndex;
        soundPlayer.envelope.triggerAttack(time);
        // TODO: compute proper duration:
        // think about how to do that...
        const soundDuration = soundPlayer.player.buffer.duration;
        
        soundPlayer.player.loopStart = this.getParameterValue(`start${padIndex + 1}`) * soundDuration;
        soundPlayer.player.loopEnd = this.getParameterValue(`end${padIndex + 1}`) * soundDuration;
        soundPlayer.player.loop = this.getParameterValue(`playerMode${padIndex + 1}`) === 'loop';
        soundPlayer.envelope.attack = this.getParameterValue(`attack${padIndex + 1}`);
        soundPlayer.envelope.decay = this.getParameterValue(`decay${padIndex + 1}`);
        soundPlayer.envelope.sustain = this.getParameterValue(`sustain${padIndex + 1}`);
        soundPlayer.envelope.release = this.getParameterValue(`release${padIndex + 1}`);
        soundPlayer.channel.volume.value = this.getParameterValue(`volume${padIndex + 1}`);
        soundPlayer.channel.pan.value = this.getParameterValue(`pan${padIndex + 1}`);
        const integerPitch = parseInt(this.getParameterValue(`pitch${padIndex + 1}`));
        soundPlayer.player.playbackRate = Math.pow(2, integerPitch / 12);
        
        soundPlayer.player.start(time, soundPlayer.player.loopStart);
    }

    stopPad(padIndex, time) {
        const soundPlayers = this.getsoundPlayersWithPadPlaying(padIndex);
        soundPlayers.forEach(soundPlayer => {
            soundPlayer.playingPadIndex = -1;
            soundPlayer.envelope.triggerRelease(time);
            soundPlayer.player.stop(time + soundPlayer.envelope.release);  // Trigger full player stop after release
        });
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
                const padIndex = note.n;
                this.triggerPad(padIndex, time, note.d * Tone.Time("16n").toSeconds());
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.stopAllPlayers()
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, extras) {
        if (!getAudioGraphInstance().isGraphBuilt()) return;

        const padIndex = midiNoteNumber % 16;
        if (!noteOff) this.triggerPad(padIndex, Tone.now());
        else this.stopPad(padIndex, Tone.now());

        if (!extras.skipRecording) this.handlePianoRollRecording(midiNoteNumber, noteOff);
    }
}