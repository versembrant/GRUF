import * as Tone from 'tone'
import { EstacioBase, getCurrentSession, updateParametreEstacio } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing} from '../utils';
import { AudioGraph, getAudioGraphInstance } from '../audioEngine';

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
        masterEffectsGain: {type: 'float', label: 'Effects send', min: -60, max: 6, initial: -60},
        pattern: {type: 'grid', label:'Pattern', numRows: 4, initial:[], showRecButton: true, patronsPredefinits :[
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

        const grooveBoxMasterChannel = estacioMasterChannel;
        const channels = {
            kick: new Tone.Channel(),
            snare: new Tone.Channel(),
            closed_hat: new Tone.Channel(),
            open_hat: new Tone.Channel()
        };

        Object.values(channels).forEach(channel => channel.connect(grooveBoxMasterChannel));

        // Creem els nodes del graph
        this.audioNodes = {
            kick: new Tone.Player().connect(channels.kick),
            snare: new Tone.Player().connect(channels.snare),
            closed_hat: new Tone.Player().connect(channels.closed_hat),
            open_hat: new Tone.Player().connect(channels.open_hat),

            sendReverbGainNode1: channels.open_hat.send("reverb", -100),
            sendReverbGainNode2: channels.closed_hat.send("reverb", -100),
            sendReverbGainNode3: channels.snare.send("reverb", -100),
            sendReverbGainNode4: channels.kick.send("reverb", -100),
        

            //Creem l'objecte masterEffectsSends per controlar tots els efectes alhora. 
            masterEffectsSends:{},
        }
        // Assignem els efectes a l'objecte buid i creem un send per cada efecte. 
        const effects = ['reverb', 'delay', 'drive', 'eq3'];
        effects.forEach(effect => {
        this.audioNodes.masterEffectsSends[effect] = grooveBoxMasterChannel.send(effect, -100);  // Initial gain set to 0
        });
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

   setMasterEffectsGain(audioNodes, gainValue) {
        Object.keys(audioNodes.masterEffectsSends).forEach(effect => {
            audioNodes.masterEffectsSends[effect].gain.value = gainValue;
        });
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

        const  masterEffectsGain = this.getParameterValue('masterEffectsGain', preset);
        this.setMasterEffectsGain(this.audioNodes, masterEffectsGain); 


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
        else if (nomParametre === 'masterEffectsGain'){
            const  masterEffectsGain = this.getParameterValue('masterEffectsGain', preset);
            this.setMasterEffectsGain(this.audioNodes, masterEffectsGain);        
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
        const currentStep = currentMainSequencerStep % (getAudioGraphInstance().getNumSteps());
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
            this.stopSoundFromPlayer(playerName);
        }
        
    }
}