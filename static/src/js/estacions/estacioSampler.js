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
        return '/gruf/static/uploads/' + getCurrentSession().getID() +  '/' + getCurrentSession().getRecordedFiles()[uploadsSoundIndex];
    }
    // Otherwise, return default sound
    return 'https://cdn.freesound.org/previews/262/262495_2331961-hq.mp3' // Dark pad 
}


const getInitialSoundUrl = () => {
    return getSoundURL(getInitialSoundName());
}

const getInitialSoundName = () => {
    return 'adagio strings';
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
        notes: {type: 'piano_roll', label:'Notes', showRecButton: true, initial:[], 
            followsPreset: true, 
            notaMesBaixaPermesa: 0,
            rangDeNotesPermeses: 16, 
            permetScrollVertical: false
        },
        ...Array.from({ length: 16 }).reduce((acc, _, i) => ({
            ...acc,
            [`sound${i + 1}URL`]: {type: 'text', label: `Sample${i + 1}`, initial: getInitialSoundUrl()},
            [`start${i + 1}`]: {type: 'float', label: `Start${i + 1}`, min: 0, max: 1, initial: getInitialStartValue(i)},
            [`end${i + 1}`]: {type: 'float', label: `End${i + 1}`, min: 0, max: 1, initial: getInitialEndValue(i)},
            [`attack${i + 1}`]: {type: 'float', label: `Attack${i + 1}`, unit: units.second, min: 0, max: 2, initial: 0.01},
            [`decay${i + 1}`]: {type: 'float', label: `Decay${i + 1}`, unit: units.second, min: 0, max: 1, initial: 0.1},
            [`sustain${i + 1}`]: {type: 'float', label: `Sustain${i + 1}`, min: 0, max: 1, initial: 1.0},
            [`release${i + 1}`]: {type: 'float', label: `Release${i + 1}`, unit: units.second, min: 0, max: 4, initial: 0.01},
            [`volume${i + 1}`]: {type: 'float', label: `Volume${i + 1}`, unit: units.decibel, min: -60, max: 6, initial: 0},
            [`pan${i + 1}`]: {type: 'float', label: `Pan${i + 1}`, min: -1, max: 1, initial: 0},
            [`pitch${i + 1}`]: {type: 'float', label: `Pitch${i + 1}`, min: -12, max: 12, step: 1, initial: 0},
            [`doesLoop${i + 1}`]: {type: 'bool', initial: true}
        }), {}),
        selectedSoundName: {type: 'text', label: 'Selected Sound name', initial: getInitialSoundName()},

        lpf: {type: 'float', label: 'LPF', unit: units.hertz, min: 100, max: 15000, initial: 15000, logarithmic: true},
        hpf: {type: 'float', label: 'HPF', unit: units.hertz, min: 20, max: 3000, initial: 20, logarithmic: true},
    }

    getTempsBeat = () => {
        return 60.0 / getAudioGraphInstance().getBpm() / 4.0;
    };

    getUserInterfaceComponent() {
        return EstacioSamplerUI
    }

    carregaSoDeLaLlibreria(soundName) {
        const url = getSoundURL(soundName);
        console.log("Carregant so de la llibreria: ", url);
        for (let i = 0; i < 16; i++) {
            this.updateParametreEstacio(`sound${i + 1}URL`, url);
        }
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

    triggerBufferSlice(player, buffer, startPoint, endPoint, time, duration=undefined) {
        if (!buffer?.loaded) return;
        const { start, end } = this.calculateSlicePoints(buffer, startPoint, endPoint);
        player.buffer = buffer;
        player.loop = true;
        player.loopStart = start;
        player.loopEnd = end;
        player.start(time, undefined, duration);

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
            if (!getAudioGraphInstance().isGraphBuilt()) { return; }
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

        if (name === 'selectedSoundName') {
            setTimeout( () => {
                // Aquests updates s'han de fer amb un delay per evitar crides recursives (?)
                this.carregaSoDeLaLlibreria(value);
            }, 50)
        }
    }


    triggerSoundFromPlayer(playerIndex, time, duration=undefined) {
        const buffer = this.audioBuffers[playerIndex];
        const start = this.getParameterValue(`start${playerIndex + 1}`);
        const end = this.getParameterValue(`end${playerIndex + 1}`);
        const doesLoop = this.getParameterValue(`doesLoop${playerIndex + 1}`);
        const release = this.getParameterValue(`release${playerIndex + 1}`);
        const player = this.audioNodes.players[playerIndex];
        const envelope = this.audioNodes.envelopes[playerIndex];
        if (!player || !buffer || !envelope) return;
        if (duration) envelope.triggerAttackRelease(duration, time)
        else envelope.triggerAttack(time);
        if (doesLoop && duration) duration += release;  // when it's not one-shot, so that the note-off occurs alongside the end of the sustain phase
        this.triggerBufferSlice(player, buffer, start, end, time, duration);
    }

    stopSoundFromPlayer(playerIndex, time) {
        const player = this.audioNodes.players[playerIndex];
        const envelope = this.audioNodes.envelopes[playerIndex];
        if (!player || !envelope) return;
        player.stop(time + this.getParameterValue(`release${playerIndex + 1}`));
        envelope.triggerRelease(time);
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
                this.triggerSoundFromPlayer(playerIndex, time, note.d * Tone.Time("16n").toSeconds());
            }
        }
    }

    onTransportStop() {
        // Stop all notes that are still playing
        this.audioNodes.players.forEach(player => player.stop());
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff, skipRecording=false) {
        if (!getAudioGraphInstance().isGraphBuilt()){return;}

        const playerIndex = midiNoteNumber % 16;
        const reducedMidiNoteNumber = playerIndex;
        const recEnabled = this.recEnabled('notes') && !skipRecording;
        if (!noteOff){
            this.triggerSoundFromPlayer(playerIndex, Tone.now());
            if (recEnabled){
                // If rec enabled, we can't create a note because we need to wait until the note off, but we should save
                // the note on time to save it
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % this.getNumSteps();
                this.lastNoteOnBeats[reducedMidiNoteNumber] = currentStep;
            }
        } else {
            this.stopSoundFromPlayer(playerIndex);
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