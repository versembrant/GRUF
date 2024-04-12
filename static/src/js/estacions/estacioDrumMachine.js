import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';

export class EstacioDrumMachine extends EstacioBase {
    
    tipus = 'drum machine'
    versio = '0.1'
    parametersDescription = {
        sound1URL: {type: 'text', label: 'Clap', initial: 'https://cdn.freesound.org/previews/125/125591_4948-hq.mp3'}, // Clap
        swing1: {type: 'float', label: 'Swing1', min: 0, max: 1, initial: 0},
        sound2URL: {type: 'text', label: 'HiHat', initial: 'https://cdn.freesound.org/previews/75/75840_260058-hq.mp3'}, // Hat
        swing2: {type: 'float', label: 'Swing2', min: 0, max: 1, initial: 0},
        sound3URL: {type: 'text', label: 'Snare', initial: 'https://cdn.freesound.org/previews/693/693151_14904072-hq.mp3'}, // Snare
        swing3: {type: 'float', label: 'Swing3', min: 0, max: 1, initial: 0},
        sound4URL: {type: 'text', label: 'Kick', initial: 'https://cdn.freesound.org/previews/274/274775_4965320-hq.mp3'}, // Kick
        swing4: {type: 'float', label: 'Swing4', min: 0, max: 1, initial: 0},
        cutoff: {type: 'float', label: 'Filtre', min: 500, max: 15000, initial: 15000, logarithmic: true},
        pattern: {type: 'grid', label:'Pattern', numRows: 4, numCols: 16, initial:[], patronsPredefinits: [
            {'nom': 'Hip Hop Classic 1', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":0,"j":14},{"i":3,"j":15}]}, 
            {'nom': 'Hip Hop classic 2' , 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":9},{"i":1,"j":14},{"i":2,"j":15}]},
            {'nom': 'Reggae Roots', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":2,"j":15},{"i":2,"j":2},{"i":3,"j":4},{"i":0,"j":11},{"i":3,"j":11},{"i":1,"j":13},{"i":3,"j":13}]},
            {'nom': 'Dub Reggae', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":3,"j":4},{"i":1,"j":2},{"i":3,"j":2},{"i":2,"j":4},{"i":3,"j":6},{"i":0,"j":8},{"i":3,"j":8},{"i":3,"j":10},{"i":2,"j":12},{"i":3,"j":12},{"i":3,"j":14}]},
            {'nom': 'Soul Pop (Billie Jean)', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":2,"j":4},{"i":3,"j":8},{"i":2,"j":12}]},
            {'nom': 'Funky Soul', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":2},{"i":3,"j":8},{"i":1,"j":14},{"i":2,"j":15}]},
            {'nom': 'Acid House', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":8},{"i":0,"j":0},{"i":3,"j":4},{"i":3,"j":12},{"i":0,"j":14}]},
            {'nom': 'Trap 1', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":1},{"i":1,"j":5},{"i":1,"j":7},{"i":2,"j":8},{"i":1,"j":11},{"i":1,"j":13},{"i":1,"j":14},{"i":1,"j":15}]},
            {'nom': 'Trap 2', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":1},{"i":1,"j":5},{"i":2,"j":8},{"i":1,"j":11},{"i":1,"j":13},{"i":1,"j":15},{"i":1,"j":4},{"i":3,"j":4},{"i":1,"j":9},{"i":3,"j":15}]},
            {'nom': 'Urban Reggaeton', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":10},{"i":1,"j":4},{"i":3,"j":4},{"i":2,"j":3},{"i":1,"j":6},{"i":2,"j":6},{"i":1,"j":8},{"i":3,"j":8},{"i":2,"j":11},{"i":1,"j":12},{"i":3,"j":12},{"i":2,"j":14},{"i":0,"j":14}]}
        ]},
        chorusSend:{type: 'float', label: 'Chorus Send', min: -60, max: 6, initial: -60},
        reverbSend:{type: 'float', label: 'Reverb Send', min: -60, max: 6, initial: -60},
        delaySend:{type: 'float', label: 'Delay Send', min: -60, max: 6, initial: -60},

    }
    noteURLsNumbers = {}

    getNoteNumber(url) {
        if (this.noteURLsNumbers.hasOwnProperty(url)){
            return this.noteURLsNumbers[url]
        }
    }

    loadSoundInSampler(url) {
        if (!this.noteURLsNumbers.hasOwnProperty(url)){
            // Només carreguem el so si no estava carregat ja
            const note = Tone.Frequency(Object.keys(this.noteURLsNumbers).length, "midi").toNote();
            this.noteURLsNumbers[url] = note
            const buffer = new Tone.ToneAudioBuffer(url, () => {
                this.audioNodes.sampler.add(note, buffer);
            });
        }
    }

    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph
        const filtre = new Tone.Filter(500, "lowpass").connect(estacioMasterChannel);
        this.audioNodes = {
            sampler: new Tone.Sampler().connect(filtre),
            filtre: filtre,
            sendReverbGainNode: estacioMasterChannel.send("reverb", -100),
            sendChorusGainNode: estacioMasterChannel.send("chorus", -100),
            sendDelayGainNode: estacioMasterChannel.send("delay", -100),
        }
    }

    updateAudioGraphFromState(preset) {
        // Carreguem tots els sons de tots els presets (si n'hi ha de repetits es carregaran només un cop)
        // Ignorem l'argument "preset" perquè volem carregar tots els sons de tots els presets
        for (let i=0; i<this.numPresets; i++) {
            this.loadSoundInSampler(this.getParameterValue('sound1URL', i));
            this.loadSoundInSampler(this.getParameterValue('sound2URL', i));
            this.loadSoundInSampler(this.getParameterValue('sound3URL', i));
            this.loadSoundInSampler(this.getParameterValue('sound4URL', i));
        }
        this.audioNodes.filtre.frequency.rampTo(this.getParameterValue('cutoff', preset), 0.01);

        // Setejem el guany de la quantitat d'enviament amb el valor en dB del slider corresponent
        this.audioNodes.sendReverbGainNode.gain.value = this.getParameterValue('reverbSend',preset);
        this.audioNodes.sendChorusGainNode.gain.value = this.getParameterValue('chorusSend',preset);
        this.audioNodes.sendDelayGainNode.gain.value = this.getParameterValue('delaySend',preset);
    }

    updateAudioGraphParameter(nomParametre, preset) {
        // Si el paràmetre que ha canviat és la URL d'un so, el carreguem al sampler
        // Si el paràmetre que ha canviat són els sends, actualitzem el seu valor 
        if (nomParametre === 'sound1URL' || nomParametre === 'sound2URL' || nomParametre === 'sound3URL' || nomParametre === 'sound4URL') {
            this.loadSoundInSampler(this.getParameterValue(nomParametre, preset))
        }
        if (nomParametre === 'cutoff'){
            this.audioNodes.filtre.frequency.rampTo(this.getParameterValue('cutoff', preset), 0.01);
        }
        else if(nomParametre === 'chorusSend'){
            this.audioNodes.sendChorusGainNode.gain.value = this.getParameterValue('chorusSend',preset);
        }
        else if(nomParametre === 'reverbSend'){
            this.audioNodes.sendReverbGainNode.gain.value = this.getParameterValue('reverbSend',preset);
        }
        else if(nomParametre === 'delaySend'){
            this.audioNodes.sendDelayGainNode.gain.value = this.getParameterValue('delaySend',preset);
        }
    }

    playSoundFromUrl(url, time) {
        const note = this.getNoteNumber(url)
        if (note !== undefined){
            this.audioNodes.sampler.triggerAttack(note, time);
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % this.getParameterDescription('pattern').numCols;
        const pattern = this.getParameterValue('pattern', this.currentPreset);
        const shouldPlaySound1 = indexOfArrayMatchingObject(pattern, {'i': 0, 'j': currentStep}) > -1;
        const shouldPlaySound2 = indexOfArrayMatchingObject(pattern, {'i': 1, 'j': currentStep}) > -1;
        const shouldPlaySound3 = indexOfArrayMatchingObject(pattern, {'i': 2, 'j': currentStep}) > -1;
        const shouldPlaySound4 = indexOfArrayMatchingObject(pattern, {'i': 3, 'j': currentStep}) > -1;
        let modificadorTempsSwingGeneral = 0.0;
        let modificatorTempsSwing1 = 0.0;
        let modificatorTempsSwing2 = 0.0;
        let modificatorTempsSwing3 = 0.0;
        let modificatorTempsSwing4 = 0.0;
        const tempsBeat = 60.0 / getAudioGraphInstance().getBpm() / 4.0;
        if (necessitaSwing(currentStep)) {
            modificadorTempsSwingGeneral = tempsBeat * getAudioGraphInstance().getSwing();
            modificatorTempsSwing1 = tempsBeat * this.getParameterValue('swing1', this.currentPreset);
            modificatorTempsSwing2 = tempsBeat * this.getParameterValue('swing2', this.currentPreset);
            modificatorTempsSwing3 = tempsBeat * this.getParameterValue('swing3', this.currentPreset);
            modificatorTempsSwing4 = tempsBeat * this.getParameterValue('swing4', this.currentPreset);
        }
        if (shouldPlaySound1) {
            this.playSoundFromUrl(this.getParameterValue('sound1URL', this.currentPreset), time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing1, 0, 1))
        }
        if (shouldPlaySound2) {
            this.playSoundFromUrl(this.getParameterValue('sound2URL', this.currentPreset), time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing2, 0, 1))
        }
        if (shouldPlaySound3) {
            this.playSoundFromUrl(this.getParameterValue('sound3URL', this.currentPreset), time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing3, 0, 1))
        }
        if (shouldPlaySound4) {
            this.playSoundFromUrl(this.getParameterValue('sound4URL', this.currentPreset), time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing4, 0, 1))
        }
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };
        if (!noteOff){
            const urls = Object.keys(this.noteURLsNumbers)
            this.playSoundFromUrl(urls[midiNoteNumber % urls.length], Tone.now());
        }
    }
}
