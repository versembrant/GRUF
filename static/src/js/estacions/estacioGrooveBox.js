import * as Tone from 'tone'
import { EstacioBase, getCurrentSession, updateParametreEstacio } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing, getNomPatroOCap, hasPatronsPredefinits} from '../utils';
import { AudioGraph, getAudioGraphInstance } from '../audioEngine';
import { EstacioGrooveBoxUI } from "../components/estacioGrooveBox";
import { sampleLibrary} from "../sampleLibrary";


const getSoundURL = (soundNumber, presetname) => {
    soundName = presetname + '-sound' + soundNumber;
    soundFound = undefined;
    sampleLibrary.groovebox.forEach((sound) => {
        if (sound.name.toLowerCase() === soundName.toLowerCase()) {
            soundFound = sound.url;
        }
    });
    if (soundFound !== undefined) {
        return soundFound;
    }
    // Otherwise, return default sounds
    if (soundNumber === 1) {
        return 'https://cdn.freesound.org/previews/509/509984_8033171-hq.mp3';
    } else if (soundNumber === 2) {
        return 'https://cdn.freesound.org/previews/173/173537_1372815-hq.mp3';
    } else if (soundNumber === 3) {
        return 'https://cdn.freesound.org/previews/561/561511_12517458-hq.mp3';
    } else  {
        return 'https://cdn.freesound.org/previews/324/324982_3914271-hq.mp3';
    }
}


export class EstacioGrooveBox extends EstacioBase {
    
    tipus = 'groovebox'
    versio = '0.1'
    parametersDescription = {
        pattern: {type: 'grid', label:'Pattern', numRows: 4, initial:[], showRecButton: true, patronsPredefinits :[
            {'nom': 'Hip Hop Classic 1', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":0,"j":14},{"i":3,"j":15}]}, 
            {'nom': 'Hip Hop classic 2' , 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":9},{"i":1,"j":14},{"i":2,"j":15}]},
            {'nom': 'Reggae Roots', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":2,"j":15},{"i":2,"j":2},{"i":3,"j":4},{"i":0,"j":11},{"i":3,"j":11},{"i":1,"j":13},{"i":3,"j":13}]},
            {'nom': 'Dub Reggae', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":3,"j":4},{"i":1,"j":2},{"i":3,"j":2},{"i":2,"j":4},{"i":3,"j":6},{"i":0,"j":8},{"i":3,"j":8},{"i":3,"j":10},{"i":2,"j":12},{"i":3,"j":12},{"i":3,"j":14}]},
            {'nom': 'Soul Pop', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":2,"j":4},{"i":3,"j":8},{"i":2,"j":12}]},
            {'nom': 'Funky Soul', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":2},{"i":3,"j":8},{"i":1,"j":14},{"i":2,"j":15}]},
            {'nom': 'Acid House', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":8},{"i":0,"j":0},{"i":3,"j":4},{"i":3,"j":12},{"i":0,"j":14}]},
            {'nom': 'Trap 1', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":1},{"i":1,"j":5},{"i":1,"j":7},{"i":2,"j":8},{"i":1,"j":11},{"i":1,"j":13},{"i":1,"j":14},{"i":1,"j":15}]},
            {'nom': 'Trap 2', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":1},{"i":1,"j":5},{"i":2,"j":8},{"i":1,"j":11},{"i":1,"j":13},{"i":1,"j":15},{"i":1,"j":4},{"i":3,"j":4},{"i":1,"j":9},{"i":3,"j":15}]},
            {'nom': 'Urban Reggaeton', 'patro': [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":10},{"i":1,"j":4},{"i":3,"j":4},{"i":2,"j":3},{"i":1,"j":6},{"i":2,"j":6},{"i":1,"j":8},{"i":3,"j":8},{"i":2,"j":11},{"i":1,"j":12},{"i":3,"j":12},{"i":2,"j":14},{"i":0,"j":14}]}
        ], followsPreset: true},
        sound1URL: {type: 'text', label: 'OpHat', initial: getSoundURL(1, 'Hip Hop Classic 1')}, // OpHat
        volume: {type: 'float', label: 'Volume', min: -30, max: 6, initial: 0},
        swing1: {type: 'float', label: 'Swing1', min: 0, max: 1, initial: 0, followsPreset: true},
        tone1: {type: 'enum', label: 'Tone1', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume1: {type: 'float', label: 'OpHatVolume', min: -30, max: 6, initial: 0},
        atack1: {type: 'enum', label: 'Atack1', options: ['0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9', '1'], initial: '0'},
        release1: {type: 'enum', label: 'Release1', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '0'},
        reverbSend1:{type: 'float', label: 'OpHatReverb ', min: -30, max: 6, initial: -30},
        sound2URL: {type: 'text', label: 'CHat', initial: getSoundURL(2, 'Hip Hop Classic 1')}, // CHat
        swing2: {type: 'float', label: 'Swing2', min: 0, max: 1, initial: 0, followsPreset: true},
        tone2: {type: 'enum', label: 'Tone2', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume2: {type: 'float', label: 'CHatVolume', min: -30, max: 6, initial: 0},
        atack2: {type: 'enum', label: 'Atack2', options: ['0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9', '1'], initial: '0'},
        release2: {type: 'enum', label: 'Release2', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '0'},
        reverbSend2:{type: 'float', label: 'CHatReverb ', min: -30, max: 6, initial: -30},
        sound3URL: {type: 'text', label: 'Snare', initial: getSoundURL(3, 'Hip Hop Classic 1')}, // Snare
        swing3: {type: 'float', label: 'Swing3', min: 0, max: 1, initial: 0, followsPreset: true},
        tone3: {type: 'enum', label: 'Tone3', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume3: {type: 'float', label: 'SnareVolume', min: -30, max: 6, initial: 0},
        atack3: {type: 'enum', label: 'Atack3', options: ['0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9', '1'], initial: '0'},
        release3: {type: 'enum', label: 'Release3', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '0'},
        reverbSend3:{type: 'float', label: 'SnareReverb ', min: -30, max: 6, initial: -30},
        sound4URL: {type: 'text', label: 'Kick', initial: getSoundURL(4, 'Hip Hop Classic 1')}, // Kick
        swing4: {type: 'float', label: 'Swing4', min: 0, max: 1, initial: 0, followsPreset: true},
        tone4: {type: 'enum', label: 'Tone4', options: ['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','0', '1','2','3','4','5','6','7','8','9','10','11','12'], initial: '0'},
        volume4: {type: 'float', label: 'KickVolume', min: -30, max: 6, initial: 0},
        atack4: {type: 'enum', label: 'Atack4', options: ['0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9', '1'], initial: '0'},
        release4: {type: 'enum', label: 'Release4', options: ['1','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1','0'], initial: '0'},
        reverbSend4:{type: 'float', label: 'KickReverb ', min: -30, max: 6, initial: -30},
        cutoff: {type: 'float', label: 'Cutoff', min: 1200, max: 12000, initial: 12000, logarithmic: true},

        // FX
        fxReverbWet: {type: 'float', label:'Reverb Wet', min: 0.0, max: 0.5, initial: 0.0},
        fxReverbDecay: {type: 'float', label:'Reverb Decay', min: 0.1, max: 15, initial: 1.0},
        fxDelayOnOff: {type : 'bool', label: 'Delay On/Off', initial: false},
        fxDelayWet: {type: 'float', label:'Delay Wet', min: 0.0, max: 1, initial: 0.0},
        fxDelayFeedback:{type: 'float', label:'Delay Feedback', min: 0.0, max: 1.0, initial: 0.5},
        fxDelayTime:{type: 'enum', label:'Delay Time', options: ['1/4', '1/4T', '1/8', '1/8T', '1/16', '1/16T'], initial: '1/8'},
        fxDrive:{type: 'float', label:'Drive', min: 0.0, max: 1.0, initial: 0.0},
        fxEqOnOff: {type : 'bool', label: 'EQ On/Off', initial: true},
        fxLow:{type: 'float', label:'Low', min: -12, max: 12, initial: 0.0},
        fxMid:{type: 'float', label:'Mid', min: -12, max: 12, initial: 0.0},
        fxHigh:{type: 'float', label:'High', min: -12, max: 12, initial: 0.0},
    }

    getNumSteps (){
        // L'estació groovebox només te 1 compàs
        return getAudioGraphInstance().getNumSteps(1);
    }

    getTempsBeat = () => {
        return 60.0 / getAudioGraphInstance().getBpm() / 4.0;
    };

    getUserInterfaceComponent() {
        return EstacioGrooveBoxUI
    }

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

        const cutoff = new Tone.Filter(500, 'lowpass', -24);

        const mainChannel = new Tone.Channel({
            volume: 0
        }).connect(cutoff);

        const channels = {
            kick: new Tone.Channel(),
            snare: new Tone.Channel(),
            closed_hat: new Tone.Channel(),
            open_hat: new Tone.Channel()
        };

        const grooveBoxReverb = new Tone.Reverb({
            wet: 1,
            decay: 5,
        }).connect(estacioMasterChannel);

        const grooveBoxReverbChannel = new Tone.Channel({
            volume: 0,
        }).connect(grooveBoxReverb);
        grooveBoxReverbChannel.receive('grooveBoxReverb');

        const player1 = new Tone.Player().connect(channels.kick);
        const player2 = new Tone.Player().connect(channels.snare);
        const player3 = new Tone.Player().connect(channels.closed_hat);
        const player4 = new Tone.Player().connect(channels.open_hat);
        
        Object.values(channels).forEach(channel => channel.connect(mainChannel));

        // Creem els nodes del graph
        this.audioNodes = {
            kick: player1,
            snare: player2,
            closed_hat: player3,
            open_hat: player4,
            sendReverbGainNode1: channels.open_hat.send("grooveBoxReverb", -100),
            sendReverbGainNode2: channels.closed_hat.send("grooveBoxReverb", -100),
            sendReverbGainNode3: channels.snare.send("grooveBoxReverb", -100),
            sendReverbGainNode4: channels.kick.send("grooveBoxReverb", -100),
            mainChannel: mainChannel,
            cutoff: cutoff
        }
        this.addEffectChainNodes(cutoff, estacioMasterChannel);
    }

    setParameterInAudioGraph(name, value, preset) {
        if (name == 'tone4') {
            this.audioNodes.kick.set({
                'playbackRate': Math.pow(2,(value/12)),
            });
        } else if (name == 'cutoff'){
            this.audioNodes.cutoff.frequency.rampTo(value, 0.01);
        } else if (name =='volume4'){
            this.audioNodes.kick.set({
                'volume': value > -30 ? value: -100,
            });
        } else if (name =='atack4'){
            this.audioNodes.kick.set({
                'fadeIn': value*this.getTempsBeat(),
            });
        } else if (name =='release4'){
            this.audioNodes.kick.set({
                'fadeOut': value*this.getTempsBeat(),
            });
        } else if (name =='tone3'){
            this.audioNodes.snare.set({
                'playbackRate': Math.pow(2,(value/12)),
            });
        } else if (name =='volume3'){
            this.audioNodes.snare.set({
                'volume': value > -30 ? value: -100,
            });
        } else if (name =='atack3'){
            this.audioNodes.snare.set({
                'fadeIn': value*this.getTempsBeat(),
            });
        } else if (name =='release3'){
            this.audioNodes.closed_hat.set({
                'fadeOut': value*this.getTempsBeat(),
            });
        } else if (name =='tone2'){
            this.audioNodes.closed_hat.set({
                'playbackRate': Math.pow(2,(value/12)),
            });
        } else if (name =='volume2'){
            this.audioNodes.closed_hat.set({
                'volume': value > -30 ? value: -100,
            });
        } else if (name =='atack2'){
            this.audioNodes.closed_hat.set({
                'fadeIn': value*this.getTempsBeat(),
            });
        } else if (name =='release2'){
            this.audioNodes.closed_hat.set({
                'fadeOut': value*this.getTempsBeat(),
            });
        } else if (name =='tone1'){
            this.audioNodes.open_hat.set({
                'playbackRate': Math.pow(2,(value/12)),
            });
        } else if (name =='volume1'){
            this.audioNodes.open_hat.set({
                'volume': value > -30 ? value: -100,
            });
        } else if (name =='atack1'){
            this.audioNodes.open_hat.set({
                'fadeIn': value*this.getTempsBeat(),
            });
        } else if (name =='release1'){
            this.audioNodes.open_hat.set({
                'fadeOut': value*this.getTempsBeat(),
            });
        } else if (name === 'reverbSend1'){
            this.audioNodes.sendReverbGainNode1.gain.value = value > -30 ? value: -100
        } else if (name === 'reverbSend2'){
            this.audioNodes.sendReverbGainNode2.gain.value = value > -30 ? value: -100
        } else if (name === 'reverbSend3'){
            this.audioNodes.sendReverbGainNode3.gain.value = value > -30 ? value: -100
        } else if (name === 'reverbSend4'){
            this.audioNodes.sendReverbGainNode4.gain.value = value > -30 ? value: -100
        } else if (name === 'sound1URL'){
            this.loadSoundinPlayer('open_hat', value);
        } else if (name === 'sound2URL'){
            this.loadSoundinPlayer('closed_hat', value);
        } else if (name === 'sound3URL'){
            this.loadSoundinPlayer('snare', value);
        } else if (name === 'sound4URL'){
            this.loadSoundinPlayer('kick', value);
        } else if (name === 'pattern'){
            // If a pattern is changed, set the 4 individual sounds to what they are supposed to be
            const parameterDescription = this.getParameterDescription(name)
            const nomPatro = getNomPatroOCap(parameterDescription, value)
            if (  nomPatro !== "Cap"){
                setTimeout(()=> {
                    // Aquests updates s'han de fer amb un delay per evitar crides recursives (?)
                    this.updateParametreEstacio('sound1URL', getSoundURL(1, nomPatro));
                    this.updateParametreEstacio('sound2URL', getSoundURL(2, nomPatro));
                    this.updateParametreEstacio('sound3URL', getSoundURL(3, nomPatro));
                    this.updateParametreEstacio('sound4URL', getSoundURL(4, nomPatro));
                }, 50)
            }   
        }
    }

    playSoundFromPlayer(playerName, time) {
        const validPlayers = ["kick", "snare", "closed_hat", "open_hat"];
        if (validPlayers.includes(playerName) && this.audioNodes[playerName].buffer.loaded) {
            this.audioNodes[playerName].start(time);
        }
    }
    
    stopSoundFromPlayer(playerName, time) {
        const validPlayers = ["kick", "snare", "closed_hat", "open_hat"];
        if (validPlayers.includes(playerName) && this.audioNodes[playerName].state === "started") {
            this.audioNodes[playerName].stop(time);
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % (this.getNumSteps());
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
    onMidiNote (midiNoteNumber, midiVelocity, noteOff, skipRecording=false){
        if (!getAudioGraphInstance().isGraphBuilt()){return;}
        
        const playerName = ["open_hat", "closed_hat", "snare", "kick"][midiNoteNumber % 4];

        if (!noteOff){
            const recEnabled = this.recEnabled('pattern') && !skipRecording;
            // Si Rec està ON
            if (recEnabled) {   
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % this.getNumSteps();
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