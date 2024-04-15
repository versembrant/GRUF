import * as Tone from 'tone'
import { EstacioBase, getCurrentSession, updateParametreEstacio } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing} from '../utils';
import { getAudioGraphInstance } from '../audioEngine';

export class EstacioGrooveBox extends EstacioBase {
    
    tipus = 'groove box'
    versio = '0.1'
    parametersDescription = {
        sound1URL: {type: 'text', label: 'OpHat', initial: 'https://cdn.freesound.org/previews/125/125591_4948-hq.mp3'}, // OpHat
        swing1: {type: 'float', label: 'Swing1', min: 0, max: 1, initial: 0},
        tone1: {type: 'enum', label: 'Tone1', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume1: {type: 'float', label: 'OpHatVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        atack1: {type: 'enum', label: 'Atack1', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1', '0'], initial: '0'},
        release1: {type: 'enum', label: 'Release1', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '1'},
        reverbSend1:{type: 'float', label: 'OpHatReverb ', min: -60, max: 6, initial: -60},
        sound2URL: {type: 'text', label: 'CHat', initial: 'https://cdn.freesound.org/previews/75/75840_260058-hq.mp3'}, // CHat
        swing2: {type: 'float', label: 'Swing2', min: 0, max: 1, initial: 0},
        tone2: {type: 'enum', label: 'Tone2', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume2: {type: 'float', label: 'CHatVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        atack2: {type: 'enum', label: 'Atack2', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1', '0'], initial: '0'},
        release2: {type: 'enum', label: 'Release2', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '1'},
        reverbSend2:{type: 'float', label: 'CHatReverb ', min: -60, max: 6, initial: -60},
        sound3URL: {type: 'text', label: 'Snare', initial: 'https://cdn.freesound.org/previews/693/693151_14904072-hq.mp3'}, // Snare
        swing3: {type: 'float', label: 'Swing3', min: 0, max: 1, initial: 0},
        tone3: {type: 'enum', label: 'Tone3', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume3: {type: 'float', label: 'SnareVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        atack3: {type: 'enum', label: 'Atack3', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1', '0'], initial: '0'},
        release3: {type: 'enum', label: 'Release3', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '1'},
        reverbSend3:{type: 'float', label: 'SnareReverb ', min: -60, max: 6, initial: -60},
        sound4URL: {type: 'text', label: 'Kick', initial: 'https://cdn.freesound.org/previews/274/274775_4965320-hq.mp3'}, // Kick
        swing4: {type: 'float', label: 'Swing4', min: 0, max: 1, initial: 0},
        tone4: {type: 'enum', label: 'Tone4', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume4: {type: 'float', label: 'KickVolume', min: -60, max: 6, initial: 0, logarithmic: true},
        atack4: {type: 'enum', label: 'Atack4', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1', '0'], initial: '0'},
        release4: {type: 'enum', label: 'Release4', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '1'},
        reverbSend4:{type: 'float', label: 'KickReverb ', min: -60, max: 6, initial: -60},
        pattern: {type: 'grid', label:'Pattern', numRows: 4, numCols: 4, initial:[], showRecButton: true},
    }

    getTempsBeat = () => {
        return 60.0 / getAudioGraphInstance().getBpm() / 4.0;
    };

    loadSoundinPlayer (playerName, url){
        if (["kick", "snare", "closed_hat", "open_hat"].includes(playerName)) {
            const player = this.audioNodes[playerName];
            if (player.buffer && player.buffer.url === url){
                console.log(`El Player ${playerName} ja té la URL ${url} carregada.`);
                return;
            }
            player.load(url);
        }
    }
    buildEstacioAudioGraph(estacioMasterChannel) {
        const opHatChannel = new Tone.Channel().connect(estacioMasterChannel);
        const cHatChannel = new Tone.Channel().connect(estacioMasterChannel);
        const snareChannel = new Tone.Channel().connect(estacioMasterChannel);
        const kickChannel = new Tone.Channel().connect(estacioMasterChannel);

        // Creem els nodes del graph
        this.audioNodes = {
            kick: new Tone.Player().connect(kickChannel),
            snare: new Tone.Player().connect(snareChannel),
            closed_hat: new Tone.Player().connect(cHatChannel),
            open_hat: new Tone.Player().connect(opHatChannel),

            sendReverbGainNode1: opHatChannel.send("reverb", -100),
            sendReverbGainNode2: cHatChannel.send("reverb", -100),
            sendReverbGainNode3: snareChannel.send("reverb", -100),
            sendReverbGainNode4: kickChannel.send("reverb", -100),

        }
    }

    applyPlayerSettings(playerName, playbackRate, volume, fadeIn, fadeOut){
        if (["open_hat", "closed_hat", "snare","kick"].includes(playerName)) {
            let player = this.audioNodes[playerName];
            player.playbackRate = playbackRate;
            player.volume.value = volume;
            player.fadeIn = fadeIn;
            player.fadeOut = fadeOut; 
        }
    }

    updateAudioGraphFromState(preset) {
        // Carreguem tots els sons de tots els presets (si n'hi ha de repetits es carregaran només un cop)
        // Ignorem l'argument "preset" perquè volem carregar tots els sons de tots els presets
        for (let i=0; i<this.numPresets; i++) {
            this.loadSoundinPlayer('open_hat', this.getParameterValue('sound1URL', i));
            this.loadSoundinPlayer('closed_hat',this.getParameterValue('sound2URL', i));
            this.loadSoundinPlayer('snare',this.getParameterValue('sound3URL', i));
            this.loadSoundinPlayer('kick',this.getParameterValue('sound4URL', i));
        }
        // Setejem el guany de la quantitat d'enviament amb el valor en dB del slider corresponent
        this.audioNodes.sendReverbGainNode1.gain.value = this.getParameterValue('reverbSend1',preset);
        this.audioNodes.sendReverbGainNode2.gain.value = this.getParameterValue('reverbSend2',preset);
        this.audioNodes.sendReverbGainNode3.gain.value = this.getParameterValue('reverbSend3',preset);
        this.audioNodes.sendReverbGainNode4.gain.value = this.getParameterValue('reverbSend4',preset);
        // Setejem les propietats dels players en funció de l'estat del paràmetre corresponent
        const tempsBeat = this.getTempsBeat();
        this.applyPlayerSettings('open_hat', 
            Math.pow(2, (this.getParameterValue('tone1',preset)/12)), 
            this.getParameterValue('volume1',preset),
            this.getParameterValue('atack1',preset)*tempsBeat,
            this.getParameterValue('release1',preset)*tempsBeat); 
        this.applyPlayerSettings('closed_hat', 
            Math.pow(2, (this.getParameterValue('tone2',preset)/12)), 
            this.getParameterValue('volume2',preset),
            this.getParameterValue('atack2',preset)*tempsBeat,
            this.getParameterValue('release2',preset)*tempsBeat); 
        this.applyPlayerSettings('snare', 
            Math.pow(2, (this.getParameterValue('tone3',preset)/12)), 
            this.getParameterValue('volume3',preset),
            this.getParameterValue('atack3',preset)*tempsBeat,
            this.getParameterValue('release3',preset)*tempsBeat);  
        this.applyPlayerSettings('kick', 
            Math.pow(2, (this.getParameterValue('tone4',preset)/12)), 
            this.getParameterValue('volume4',preset),
            this.getParameterValue('atack4',preset)*tempsBeat,
            this.getParameterValue('release4',preset)*tempsBeat);  
    }
    updateAudioGraphParameter(nomParametre, preset) {
        // Si el paràmetre que ha canviat és la URL d'un so, el carreguem al sampler
        if (nomParametre === 'sound1URL' || nomParametre === 'sound2URL' || nomParametre === 'sound3URL' || nomParametre === 'sound4URL') {
            this.loadSoundinPlayer(this.getParameterValue(nomParametre, preset))
        }
        // Si el paràmetre que ha canviat són els sends, actualitzem el seu valor 

        if(nomParametre === 'reverbSend1'){
            this.audioNodes.sendReverbGainNode1.gain.value = this.getParameterValue('reverbSend1',preset);
        }
        else if (nomParametre === 'reverbSend2'){
            this.audioNodes.sendReverbGainNode2.gain.value = this.getParameterValue('reverbSend2',preset);
        }
        else if (nomParametre === 'reverbSend3'){
            this.audioNodes.sendReverbGainNode3.gain.value = this.getParameterValue('reverbSend3',preset);
        }
        else if (nomParametre === 'reverbSend4'){
            this.audioNodes.sendReverbGainNode4.gain.value = this.getParameterValue('reverbSend4',preset);
        }
        //Si el paràmetre que ha canviat són les propietats dels players
        const tempsBeat = this.getTempsBeat();
        if(nomParametre === 'tone1' || nomParametre === 'volume1'||  nomParametre === 'atack1' || nomParametre === 'release1'){
            this.applyPlayerSettings('open_hat', 
                Math.pow(2, (this.getParameterValue('tone1',preset)/12)), 
                this.getParameterValue('volume1',preset),
                this.getParameterValue('atack1',preset)*tempsBeat,
                this.getParameterValue('release1',preset)*tempsBeat);
        }
        else if(nomParametre === 'tone2' || nomParametre === 'volume2' ||  nomParametre === 'atack2' || nomParametre === 'release2'){
            this.applyPlayerSettings('closed_hat', 
                Math.pow(2, (this.getParameterValue('tone2',preset)/12)), 
                this.getParameterValue('volume2',preset),
                this.getParameterValue('atack2',preset)*tempsBeat,
                this.getParameterValue('release2',preset)*tempsBeat);
        }
        else if(nomParametre === 'tone3' || nomParametre === 'volume3' ||  nomParametre === 'atack3' || nomParametre === 'release3'){
            this.applyPlayerSettings('snare', 
                Math.pow(2, (this.getParameterValue('tone4',preset)/12)), 
                this.getParameterValue('volume3',preset),
                this.getParameterValue('atack3',preset)*tempsBeat,
                this.getParameterValue('release3',preset)*tempsBeat);
        }
        else if(nomParametre === 'tone4' || nomParametre === 'volume4' || nomParametre === 'atack4' || nomParametre === 'release4'){
            this.applyPlayerSettings('kick', 
                Math.pow(2, (this.getParameterValue('tone4',preset)/12)), 
                this.getParameterValue('volume4',preset),
                this.getParameterValue('atack4',preset)*tempsBeat,
                this.getParameterValue('release4',preset)*tempsBeat);
        }
    }

    playSoundFromPlayer (playerName, time){
        if (["open_hat", "closed_hat", "snare", "kick"].includes(playerName) && this.audioNodes[playerName].loaded ===true) {
            this.audioNodes[playerName].start(time);
        }
    }
    stopSoundFromPlayer(playerName, time){
        if (["open_hat", "closed_hat", "snare", "kick"].includes(playerName) && this.audioNodes[playerName].loaded ===true && this.audioNodes[playerName].state === "started") {
            this.audioNodes[playerName].stop(time);
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % (getAudioGraphInstance().getModBars() * this.getParameterDescription('pattern').numCols);
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
        const tempsBeat = this.getTempsBeat();
        if (necessitaSwing(currentStep)) {
            modificadorTempsSwingGeneral = tempsBeat * getAudioGraphInstance().getSwing();
            modificatorTempsSwing1 = tempsBeat * this.getParameterValue('swing1', this.currentPreset);
            modificatorTempsSwing2 = tempsBeat * this.getParameterValue('swing2', this.currentPreset);
            modificatorTempsSwing3 = tempsBeat * this.getParameterValue('swing3', this.currentPreset);
            modificatorTempsSwing4 = tempsBeat * this.getParameterValue('swing4', this.currentPreset);
        }
        if (shouldPlaySound1) {
            this.playSoundFromPlayer('open_hat', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing1, 0, 1))
            this.stopSoundFromPlayer('open_hat', time + tempsBeat)

        }
        if (shouldPlaySound2) {
            this.playSoundFromPlayer('closed_hat', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing2, 0, 1))
            this.stopSoundFromPlayer('closed_hat', time + tempsBeat)
        }
        if (shouldPlaySound3) {
            this.playSoundFromPlayer('snare', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing3, 0, 1))
            this.stopSoundFromPlayer('snare', time + tempsBeat)
        }
        if (shouldPlaySound4) {
            this.playSoundFromPlayer('kick', time + clamp(modificadorTempsSwingGeneral + modificatorTempsSwing4, 0, 1))
            this.stopSoundFromPlayer('kick', time + tempsBeat)

        }
    }
    onMidiNote (midiNoteNumber, midiVelocity, noteOff){
        const playerName = ["open_hat", "closed_hat", "snare", "kick"][midiNoteNumber % 4];

        if (!noteOff){
            const recEnabled = document.getElementById(this.nom + '_pattern_REC').checked;
            // Si Rec està ON
            if (recEnabled) {
                const currentStep = currentMainSequencerStep % (getAudioGraphInstance().getModBars() * this.getParameterDescription('pattern').numCols);
                const pattern = this.getParameterValue('pattern', this.currentPreset);
                const index = indexOfArrayMatchingObject(pattern, {'i': (midiNoteNumber % 4), 'j': currentStep});
                if (index === -1) {
                    // Si la nota no està en el patró, l'afegeix
                    pattern.push({'i': (midiNoteNumber % 4), 'j': currentStep});
                };
            }
            // Play
            else  this.playSoundFromPlayer(playerName, Tone.now());
        } 
        else {
            // Stop
            this.stopSoundFromPlayer(playerName);
        }
        
    }
}