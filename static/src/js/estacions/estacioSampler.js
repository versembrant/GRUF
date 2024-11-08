import * as Tone from 'tone'
import { EstacioBase, getCurrentSession } from "../sessionManager";
import { indexOfArrayMatchingObject, units } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';
import { EstacioSamplerUI } from "../components/estacioSampler";
import { sampleLibrary} from "../sampleLibrary";


const getSoundURL = (soundName) => {
    // Try find sound name in sample library
    let soundFound = undefined;
    sampleLibrary.sampler.forEach((sound) => {
        if (sound.name.toLowerCase() === soundName.toLowerCase()) {
            soundFound = sound.url;
        }
    });
    if (soundFound !== undefined) {
        return soundFound;
    }
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
    const totalSlices = 16;
    const sliceNum = numSound % totalSlices;
    return sliceNum * 1/totalSlices;
}

const getInitialEndValue = (numSound) => {
    const totalSlices = 16;
    const sliceNum = numSound % totalSlices;
    return (sliceNum + 1) * 1/totalSlices;
}


export class EstacioSampler extends EstacioBase {
    
    tipus = 'sampler'
    versio = '0.1'
    parametersDescription = {
        ...EstacioBase.parametersDescription,
        cutoff: {type: 'float', label: 'Cutoff', unit: units.hertz, min: 200, max: 20000, initial: 20000, logarithmic: true},


        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], 
            followsPreset: true, 
            notaMesBaixaPermesa: 0,
            rangDeNotesPermeses: 16, 
            permetScrollVertical: false
        },
        ...Array.from({ length: 16 }).reduce((acc, _, i) => ({
            ...acc,
            // [`sound${i + 1}`]: {type: 'text', label: `Sample${i + 1}`, initial: 'adagio strings'},
            [`start${i + 1}`]: {type: 'float', label: `Start${i + 1}`, min: 0, max: 1, initial: getInitialStartValue(i)},
            [`end${i + 1}`]: {type: 'float', label: `End${i + 1}`, min: 0, max: 1, initial: getInitialEndValue(i)},
            [`attack${i + 1}`]: {type: 'float', label: `Attack${i + 1}`, unit: units.second, min: 0, max: 2, initial: 0.01},
            [`decay${i + 1}`]: {type: 'float', label: `Decay${i + 1}`, unit: units.second, min: 0, max: 1, initial: 0.1},
            [`sustain${i + 1}`]: {type: 'float', label: `Sustain${i + 1}`, min: 0, max: 1, initial: 1.0},
            [`release${i + 1}`]: {type: 'float', label: `Release${i + 1}`, unit: units.second, min: 0, max: 4, initial: 0.01},
            [`volume${i + 1}`]: {type: 'float', label: `Volume${i + 1}`, unit: units.decibel, min: -60, max: 6, initial: 0},
            [`pan${i + 1}`]: {type: 'float', label: `Pan${i + 1}`, min: -1, max: 1, initial: 0},
            [`pitch${i + 1}`]: {type: 'float', label: `Pitch${i + 1}`, min: -12, max: 12, step: 1, initial: 0},
            [`loopMode${i + 1}`]: {type: 'enum', options: ['forward', 'noLoop',], initial: 'forward'}
        }), {}),

        lpf: {type: 'float', label: 'LPF', unit: units.hertz, min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', unit: units.hertz, min: 20, max: 3000, initial: 20, logarithmic: true},

        sound: {type: 'text', initial: 'adagio strings'}
    }

    getTempsBeat = () => {
        return 60.0 / getAudioGraphInstance().getBpm() / 4.0;
    };

    getUserInterfaceComponent() {
        return EstacioSamplerUI
    }

    carregaSoDeLaLlibreria(soundName) {
        // si l'àudio no està construit, deixem el so en una cua perquè es carregui quan es construeix
        if (!this.isGraphBuilt) {
            if (!this.soundsPendingLoading) this.soundsPendingLoading = [];
            if (this.soundsPendingLoading.includes(soundName)) return;
            console.log(`Posant el so ${soundName} a la cua.`);
            this.soundsPendingLoading.push(soundName);
            return;
        }

        if (this.loadedSounds.hasOwnProperty(soundName)) {
            console.log(`El so ${soundName} ja estava carregat.`);
            return this.loadedSounds[soundName];
        }
        const url = getSoundURL(soundName);
        console.log("Carregant so de la llibreria: ", soundName, ", amb url:", url);
        const buffer = new Tone.Buffer(url);
        this.loadedSounds[soundName] = buffer;
        return buffer;
    }


    

    buildEstacioAudioGraph(estacioMasterChannel) {

        const hpf = new Tone.Filter(6000, "highpass", -24);
        const lpf = new Tone.Filter(500, "lowpass", -24).connect(hpf);

        this.loadedSounds = {}
        if (this.soundsPendingLoading) this.soundsPendingLoading.forEach(sound => this.carregaSoDeLaLlibreria(sound));
        this.soundsPendingLoading = []

        // Creem els nodes del graph
        this.audioNodes = {lpf: lpf, hpf: hpf};

        this.samplePlayers = Array(16).fill(null).map(el=> new SamplePlayer());
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

            const player = new Tone.Player({
                fadeIn: 0.01,
                fadeOut: 0.01
            }).connect(channel);
            
            this.samplePlayers[i].tonePlayer = player;
            this.samplePlayers[i].envelope = envelope;
            this.samplePlayers[i].channel = channel;
            this.samplePlayers[i].pitchShift = pitchShift;

        }
        
        this.addEffectChainNodes(hpf, estacioMasterChannel);
        this.isGraphBuilt = true;
        this.bufferLoadMap = new Map();
    }

    setParameterInAudioGraph(name, value, preset) {
        const parametersMatch = name.match(/^(start|end|loopMode|attack|decay|sustain|release|volume|pan|pitch)(\d+)$/);
        if (parametersMatch) {
            const [_, type, indexStr] = parametersMatch;
            const index = parseInt(indexStr, 10) - 1;
            this[`${type}${index + 1}`] = value;

            // Actualitza els paràmetres de ADSR i Channel
            if (type === 'attack' || type === 'decay' || type === 'sustain' || type === 'release') {
                const envelope = this.samplePlayers[index].envelope;
                envelope[type] = value;
                if (type !== 'sustain') this.samplePlayers[index][type] = value;
            } else if (type === 'volume'|| type === 'pan') {
                const channel = this.samplePlayers[index].channel;
                if (type === 'volume'){
                    channel.volume.value = value;
                }
                else {
                    channel.pan.value = value;
                }
            } else if (type === 'pitch') {
                const pitchShift = this.samplePlayers[index].pitchShift;
                pitchShift.pitch = parseInt(value);
            } else if (type === 'start' || type === 'end' || type === 'loopMode') {
                this.samplePlayers[index][type] = value;
            }
        }

        if(name == 'lpf'){
            this.audioNodes.lpf.frequency.rampTo(value, 0.01);
        } else if (name == "hpf") {
            this.audioNodes.hpf.frequency.rampTo(value, 0.01);
        }

        if (name.match(/^sound\d*$/)) {
            const buffer = this.carregaSoDeLaLlibreria(value);
            for (let i = 0; i < 16; i++) {
                this.setBufferOnLoad(buffer, this.samplePlayers[i]);
            }
            
        }
    }

    setBufferOnLoad(buffer, target) {
        if (buffer.loaded) target.buffer = buffer;

        // treiem el valor si ja existia
        for (const [buffer, targetArray] of this.bufferLoadMap.entries()) {
            const index = targetArray.indexOf(target);
            if (index !== -1) targetArray.splice(index, 1);
        }

        if (this.bufferLoadMap.has(buffer)) this.bufferLoadMap.get(buffer).push(target);
        else this.bufferLoadMap.set(buffer, [target]);
        buffer.onload = (loadedBuffer) => this.bufferLoadMap.get(buffer).forEach(mapTarget => mapTarget.buffer = loadedBuffer);
    }

    onSequencerTick(currentMainSequencerStep, time) {
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
                const playerIndex = note.n
                this.samplePlayers[playerIndex].trigger(time, note.d * Tone.Time("16n").toSeconds());
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.samplePlayers.forEach(player => player.stop());
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, skipRecording=false) {
        if (!getAudioGraphInstance().isGraphBuilt()){return;}

        const playerIndex = midiNoteNumber % 16;
        const reducedMidiNoteNumber = playerIndex;
        const recEnabled = this.recEnabled('notes') && !skipRecording;
        if (!noteOff){
            this.samplePlayers[playerIndex].trigger(Tone.now());
            if (recEnabled){
                // If rec enabled, we can't create a note because we need to wait until the note off, but we should save
                // the note on time to save it
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % this.getNumSteps();
                if (!this.lastNoteOnBeats) {
                    this.lastNoteOnBeats = new Array(16).fill(undefined);
                }
                this.lastNoteOnBeats[reducedMidiNoteNumber] = currentStep;
            }
        } else {
            this.samplePlayers[playerIndex].stop();
            if (recEnabled){
                // If rec enabled and we have a time for the last note on, then create a new note object, otherwise do nothing
                const lastNoteOnTimeForNote = this.lastNoteOnBeats[reducedMidiNoteNumber]
                if (lastNoteOnTimeForNote !== undefined){
                    const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                    const currentStep = currentMainSequencerStep % this.getNumSteps();
                    if (lastNoteOnTimeForNote < currentStep){
                        // Only save the note if note off time is bigger than note on time
                        const notes = this.getParameterValue('notes');
                        notes.push({'n': reducedMidiNoteNumber, 'b': lastNoteOnTimeForNote, 'd': currentStep - lastNoteOnTimeForNote})
                        this.updateParametreEstacio('notes', notes); // save change in server!
                    }
                    this.lastNoteOnBeats[reducedMidiNoteNumber] = undefined;
                }
            }
        }
    }
}

class SamplePlayer {

    constructor() {
        this.normStart = 0;
        this.normEnd = 1;
    }

    /**
     * @param {number} newStart
     * Normalized start (0-1)
     */
    set start(newNormStart) {
        if (newNormStart === this.normStart) return;
        this.normStart = newNormStart;
        this._makeSlicedBuffer();
    }

    /**
     * @param {number} newEnd
     * Normalized end (0-1)
     */
    set end(newNormEnd) {
        if (newNormEnd === this.normEnd) return;
        this.normEnd = newNormEnd;
        this._makeSlicedBuffer();
    }


    set buffer(newBuffer) {
        this.sourceBuffer = newBuffer;
        this._makeSlicedBuffer();
    }


    set loopMode(newLoopMode) {
        this.tonePlayer.loop = newLoopMode !== 'noLoop';
    }

    trigger(time, duration=undefined) {
        if (!this.tonePlayer.buffer.loaded) return;

        if (!duration) {
            this.envelope.triggerAttack(time);
            this.tonePlayer.start(time);
            return;
        }
        if (!this.tonePlayer.loop) duration = Math.min(duration, this.tonePlayer.buffer.duration) // capping it on one-shot
        const sampleDuration = this.tonePlayer.loop ? duration + this.release : duration; // when it's not one-shot, so that the note-off occurs alongside the end of the sustain phase
        const sustainDuration = sampleDuration - this.attack - this.decay - this.release;
        this.envelope.triggerAttackRelease(sustainDuration, time);
        this.tonePlayer.start(time, undefined, sampleDuration);
    }

    stop(time) {
        if (!this.tonePlayer.buffer.loaded) return;
        this.tonePlayer.stop(time + this.release);
        this.envelope.triggerRelease(time);
    }

    _makeSlicedBuffer() {
        if (!this.sourceBuffer) return;
        const startTime = this.normStart*this.sourceBuffer.duration;
        const endTime = this.normEnd*this.sourceBuffer.duration;
        if (!(endTime > startTime)) {
            console.warn(`startTime (current: ${startTime}) must be less than endTime (current: ${endTime})`);
            return;
        }
        this.tonePlayer.buffer = this._applyFadeInOut(this.sourceBuffer.slice(startTime, endTime), 0.01, 0.01);
    }

    _applyFadeInOut(buffer, fadeInDuration, fadeOutDuration) {
        // Get the buffer's raw audio data for each channel
        const fadeInSamples = Math.floor(buffer.sampleRate * fadeInDuration);
        const fadeOutSamples = Math.floor(buffer.sampleRate * fadeOutDuration);
        const totalSamples = buffer.length;
        const fadeOutStartSample = totalSamples - fadeOutSamples;
    
        const bufferArray = [];
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) bufferArray.push(buffer.getChannelData(channel));

        // Apply fade-in
        for (let i = 0; i < fadeInSamples; i++) {
            const fadeFactor = i / fadeInSamples;
            bufferArray.forEach((channel, channelIndex) => {
                bufferArray[channelIndex][i] = channel[i] *= fadeFactor;
            })
        }
    
        // Apply fade-out
        for (let i = fadeOutStartSample; i < totalSamples; i++) {
            const fadeFactor = (totalSamples - i) / fadeOutSamples;
            bufferArray.forEach((channel, channelIndex) => {
                bufferArray[channelIndex][i] = channel[i] *= fadeFactor;
            })
        }
        buffer.fromArray(bufferArray);
        return buffer;
    }
}