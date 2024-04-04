import * as Tone from 'tone'
import { EstacioBase } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing } from '../utils';
import { getAudioGraphInstance } from '../audioEngine';

export class EstacioGrooveBox extends EstacioBase {
    
    tipus = 'groove box'
    versio = '0.1'
    parametersDescription = {
        sound1URL: {type: 'text', label: 'Clap', initial: 'https://cdn.freesound.org/previews/125/125591_4948-hq.mp3'}, // Clap
        swing1: {type: 'float', label: 'Swing1', min: 0, max: 1, initial: 0},
        tone1: {type: 'enum', label: 'Tone1', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','1','2','3','4','5','6','7','8','9','10','11','12'], initial: '1'},
        volume1: {type: 'float', label: 'ClapVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        sound2URL: {type: 'text', label: 'HiHat', initial: 'https://cdn.freesound.org/previews/75/75840_260058-hq.mp3'}, // Hat
        swing2: {type: 'float', label: 'Swing2', min: 0, max: 1, initial: 0},
        tone2: {type: 'enum', label: 'Tone1', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','1','2','3','4','5','6','7','8','9','10','11','12'], initial: '1'},
        volume2: {type: 'float', label: 'HihatVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        sound3URL: {type: 'text', label: 'Snare', initial: 'https://cdn.freesound.org/previews/693/693151_14904072-hq.mp3'}, // Snare
        swing3: {type: 'float', label: 'Swing3', min: 0, max: 1, initial: 0},
        tone3: {type: 'enum', label: 'Tone1', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','1','2','3','4','5','6','7','8','9','10','11','12'], initial: '1'},
        volume3: {type: 'float', label: 'SnareVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        sound4URL: {type: 'text', label: 'Kick', initial: 'https://cdn.freesound.org/previews/274/274775_4965320-hq.mp3'}, // Kick
        swing4: {type: 'float', label: 'Swing4', min: 0, max: 1, initial: 0},
        tone4: {type: 'enum', label: 'Tone1', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','1','2','3','4','5','6','7','8','9','10','11','12'], initial: '1'},
        volume4: {type: 'float', label: 'KickVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        cutoff: {type: 'float', label: 'Filtre', min: 500, max: 15000, initial: 15000, logarithmic: true},
        pattern: {type: 'grid', label:'Pattern', numRows: 4, numCols: 16, initial:[]},
        chorusSend:{type: 'float', label: 'Chorus Send', min: -60, max: 6, initial: -60},
        reverbSend:{type: 'float', label: 'Reverb Send', min: -60, max: 6, initial: -60},
        delaySend:{type: 'float', label: 'Delay Send', min: -60, max: 6, initial: -60},

    }

    loadSoundinPlayer (playerName, url){
        if (["kick", "snare", "hihat", "clap"].includes(playerName)) {
            const player = this.audioNodes[playerName];
            if (player.buffer && player.buffer.url === url){
                console.log(`El Player ${playerName} ja té la URL ${url} carregada.`);
                return;
            }
            player.load(url);
        }
    }

    
    buildEstacioAudioGraph(estacioMasterChannel) {
        // Creem els nodes del graph
        const filtre = new Tone.Filter(500, "lowpass").connect(estacioMasterChannel);
        this.audioNodes = {
            kick: new Tone.Player({playbackRate:0.25}).connect(filtre),
            snare: new Tone.Player({playbackRate:1}).connect(filtre),
            hihat: new Tone.Player({playbackRate:1}).connect(filtre),
            clap: new Tone.Player({playbackRate:1}).connect(filtre),

            //sampler: new Tone.Sampler().connect(filtre),
            filtre: filtre,
            sendReverbGainNode: estacioMasterChannel.send("reverb", -100),
            sendChorusGainNode: estacioMasterChannel.send("chorus", -100),
            sendDelayGainNode: estacioMasterChannel.send("delay", -100),
        }
    }

    applyPlayerSettings(playerName, playbackRate, volume){
        if (["kick", "snare", "hihat", "clap"].includes(playerName)) {
            let player = this.audioNodes[playerName];
            player.playbackRate = playbackRate;
            player.volume.value = volume;
        }
    }
     

    updateAudioGraphFromState(preset) {
        // Carreguem tots els sons de tots els presets (si n'hi ha de repetits es carregaran només un cop)
        // Ignorem l'argument "preset" perquè volem carregar tots els sons de tots els presets
        for (let i=0; i<this.numPresets; i++) {
            this.loadSoundinPlayer('kick', this.getParameterValue('sound1URL', i));
            this.loadSoundinPlayer('snare',this.getParameterValue('sound2URL', i));
            this.loadSoundinPlayer('hihat',this.getParameterValue('sound3URL', i));
            this.loadSoundinPlayer('clap',this.getParameterValue('sound4URL', i));
        }
        this.audioNodes.filtre.frequency.rampTo(this.getParameterValue('cutoff', preset), 0.01);

        // Setejem el guany de la quantitat d'enviament amb el valor en dB del slider corresponent
        this.audioNodes.sendReverbGainNode.gain.value = this.getParameterValue('reverbSend',preset);
        this.audioNodes.sendChorusGainNode.gain.value = this.getParameterValue('chorusSend',preset);
        this.audioNodes.sendDelayGainNode.gain.value = this.getParameterValue('delaySend',preset);
        
        // Setejem les propietats dels players funció de l'estat del paràmetre corresponent
         
        this.applyPlayerSettings('kick', Math.pow(2, (this.getParameterValue('tone1',preset)/12)), this.getParameterValue('volume1',preset));
        this.applyPlayerSettings('snare',Math.pow(2, (this.getParameterValue('tone2',preset)/12)), this.getParameterValue('volume2',preset));
        this.applyPlayerSettings('hihat',Math.pow(2, (this.getParameterValue('tone3',preset)/12)), this.getParameterValue('volume3',preset));
        this.applyPlayerSettings('clap',Math.pow(2, (this.getParameterValue('tone4',preset)/12)), this.getParameterValue('volume4',preset));

    }

    updateAudioGraphParameter(nomParametre, preset) {
        // Si el paràmetre que ha canviat és la URL d'un so, el carreguem al sampler
        // Si el paràmetre que ha canviat són els sends, actualitzem el seu valor 
        if (nomParametre === 'sound1URL' || nomParametre === 'sound2URL' || nomParametre === 'sound3URL' || nomParametre === 'sound4URL') {
            this.loadSoundinPlayer(this.getParameterValue(nomParametre, preset))
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
        //Si el paràmetre que ha canviat són les propietats dels players
        else if(nomParametre === 'tone1' || nomParametre === 'volume1'){
            this.applyPlayerSettings('kick', Math.pow(2, (this.getParameterValue('tone1',preset)/12)), this.getParameterValue('volume1',preset));
        }
        else if(nomParametre === 'tone2' || nomParametre === 'volume2'){
            this.applyPlayerSettings('snare',Math.pow(2, (this.getParameterValue('tone2',preset)/12)), this.getParameterValue('volume2',preset));
        }
        else if(nomParametre === 'tone3' || nomParametre === 'volume3'){
            this.applyPlayerSettings('hihat',Math.pow(2, (this.getParameterValue('tone3',preset)/12)), this.getParameterValue('volume3',preset));
        }
        else if(nomParametre === 'tone4' || nomParametre === 'volume4'){
            this.applyPlayerSettings('clap',Math.pow(2, (this.getParameterValue('tone4',preset)/12)), this.getParameterValue('volume4',preset));
        }
    }

    playSoundFromPlayer (playerName, time){
        if (["kick", "snare", "hihat", "clap"].includes(playerName) && this.audioNodes[playerName].loaded ===true) {
            this.audioNodes[playerName].start(time);
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
            this.playSoundFromPlayer('kick', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing1, 0, 1))
        }
        if (shouldPlaySound2) {
            this.playSoundFromPlayer('snare', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing2, 0, 1))
        }
        if (shouldPlaySound3) {
            this.playSoundFromPlayer('hihat', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing3, 0, 1))
        }
        if (shouldPlaySound4) {
            this.playSoundFromPlayer('clap', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing4, 0, 1))
        }
    }

    onMidiNote(midiNoteNumber, midiVelocity, noteOff) {
        if (!getAudioGraphInstance().graphIsBuilt()){ return };
        if (!noteOff){
            const urls = Object.keys(this.noteURLsNumbers)
            this.playSoundFromPlayer(urls[midiNoteNumber % urls.length], Tone.now());
        }
    }

}