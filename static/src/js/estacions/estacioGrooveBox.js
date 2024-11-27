import * as Tone from 'tone'
import { EstacioBase, getCurrentSession, updateParametreEstacio } from "../sessionManager";
import { indexOfArrayMatchingObject, clamp, necessitaSwing, getNomPatroOCap, hasPatronsPredefinits, units} from '../utils';
import { AudioGraph, getAudioGraphInstance } from '../audioEngine';
import { EstacioGrooveBoxUI } from "../components/estacioGrooveBox";
import { sampleLibrary} from "../sampleLibrary";


const getSoundURL = (playerName, presetName) => {
    soundName = presetName + '-' + playerName;

    const sampleLibrarySound = sampleLibrary.groovebox
        .find(sound => sound.name.toLowerCase() === soundName.toLowerCase());
    if (sampleLibrarySound) return window.location.origin + sampleLibrarySound.url;

    // Otherwise, return default sounds
    console.warn(`The sound "${soundName}" wasn't found, resorting to default`);
    if (playerName === 'open_hat') {
        return 'https://cdn.freesound.org/previews/509/509984_8033171-hq.mp3';
    } else if (playerName === 'closed_hat') {
        return 'https://cdn.freesound.org/previews/173/173537_1372815-hq.mp3';
    } else if (playerName === 'snare') {
        return 'https://cdn.freesound.org/previews/561/561511_12517458-hq.mp3';
    } else  {
        return 'https://cdn.freesound.org/previews/324/324982_3914271-hq.mp3';
    }
}

const sounds = ['OpHat', 'CHat', 'Snare', 'Kick'];

export class EstacioGrooveBox extends EstacioBase {
    
    tipus = 'groovebox'
    versio = '0.1'
    parametersDescription = {
        ...EstacioBase.parametersDescription,
        cutoff: {type: 'float', label: 'Cutoff', unit: units.hertz, min: 200, max: 12000, initial: 12000, logarithmic: true},
        
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

        drumkit: {type: 'text', initial: 'Hip hop Classic 1'},

        ...Object.fromEntries(
            sounds.flatMap((sound, index) => {
                const i = index + 1;
                return [
                    [`swing${i}`, { type: 'float', label: `${sound}Swing`, min: 0, max: 1, initial: 0, followsPreset: true }],
                    [`tone${i}`, { type: 'float', label: `${sound}Tone`, unit: units.decibel, min: -12, max: 12, step: 1, initial: 0 }],
                    [`volume${i}`, { type: 'float', label: `${sound}Volume`, unit: units.decibel, min: -30, max: 6, initial: 0 }],
                    [`attack${i}`, { type: 'float', label: `${sound}Attack`, unit: units.second, min: 0, max: 1, step: 0.1, initial: 0 }],
                    [`release${i}`, { type: 'float', label: `${sound}Release`, unit: units.second, min: 0, max: 1, step: 0.1, initial: 0 }],
                    [`reverbSend${i}`, { type: 'float', label: `${sound}Reverb`, unit: units.decibel, min: -30, max: 6, initial: -30 }]
                ]
            })
        ),
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

    playerNames = ['open_hat', 'closed_hat', 'snare', 'kick'];

    carregaDrumkitDeLaLlibreria(newDrumkitName) {
        if (this.loadedKits.hasOwnProperty(newDrumkitName)) {
            console.log(`El kit ${newDrumkitName} ja estava carregat.`);
            return this.loadedKits[newDrumkitName];
        }

        console.log("Carregant kit de la llibreria:", newDrumkitName);
        this.loadedKits[newDrumkitName] = {}
        this.playerNames.forEach(playerName => {
            const url = getSoundURL(playerName, newDrumkitName);
            console.log(`Carregant so ${playerName} del kit ${newDrumkitName}, amb URL:`, url);
            const buffer = new Tone.Buffer(url);
            this.loadedKits[newDrumkitName][playerName] = buffer;
        })
        return this.loadedKits[newDrumkitName];
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

        this.loadedKits = {};
    }

    setParameterInAudioGraph(name, value, preset) {
        const parametersMatch = name.match(/^(volume|attack|release|tone|reverbSend)(\d+)$/);
        if (parametersMatch) {
            const [_, type, indexStr] = parametersMatch;
            const index = parseInt(indexStr, 10) - 1;
            const playerName = this.playerNames[index];
            if (type === 'volume') {
                this.audioNodes[playerName].set({
                    'volume': value > -30 ? value: -100,
                });
            } else if (type === 'attack') {
                this.audioNodes[playerName].set({
                    'fadeIn': value*this.getTempsBeat(),
                });
            } else if (type === 'release') {
                this.audioNodes[playerName].set({
                    'fadeOut': value*this.getTempsBeat(),
                });
            } else if (type === 'tone') {
                this.audioNodes[playerName].set({
                    'playbackRate': Math.pow(2,(value/12)),
                });
            } else if (type === 'reverbSend') {
                const nodeName = `sendReverbGainNode${index+1}`;
                this.audioNodes[nodeName].gain.value = value > -30 ? value: -100
            }
        } else if (name == 'cutoff'){
            this.audioNodes.cutoff.frequency.rampTo(value, 0.01);
        } else if (name === 'pattern'){
            // If a pattern is changed, set the 4 individual sounds to what they are supposed to be
            const parameterDescription = this.getParameterDescription(name)
            const nomPatro = getNomPatroOCap(parameterDescription, value)
            if (nomPatro !== "Cap") this.updateParametreEstacio('drumkit', nomPatro);
        } else if (name === 'drumkit') {
            const newDrumkit = this.carregaDrumkitDeLaLlibreria(value);
            this.playerNames.forEach((playerName) => {
                const soundBuffer = newDrumkit[playerName];
                const player = this.audioNodes[playerName]
                if (soundBuffer.loaded) player.buffer = soundBuffer;
                else soundBuffer.onload = (loadedBuffer) => player.buffer = loadedBuffer;
            });
        }
    }

    playSoundFromPlayer(playerName, time) {
        if (this.playerNames.includes(playerName) && this.audioNodes[playerName].buffer.loaded) {
            this.audioNodes[playerName].start(time);
        }
    }
    
    stopSoundFromPlayer(playerName, time) {
        if (this.playerNames.includes(playerName) && this.audioNodes[playerName].state === "started") {
            this.audioNodes[playerName].stop(time);
        }
    }

    onSequencerTick(currentMainSequencerStep, time) {
        // Check if sounds should be played in the current step and do it
        const currentStep = currentMainSequencerStep % (this.getNumSteps());
        const pattern = this.getParameterValue('pattern');
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
            modificatorTempsSwing1 = tempsBeat * this.getParameterValue('swing1');
            modificatorTempsSwing2 = tempsBeat * this.getParameterValue('swing2');
            modificatorTempsSwing3 = tempsBeat * this.getParameterValue('swing3');
            modificatorTempsSwing4 = tempsBeat * this.getParameterValue('swing4');
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
    onMidiNote (midiNoteNumber, midiVelocity, noteOff, extras){
        if (!getAudioGraphInstance().isGraphBuilt()){return;}
        
        const playerName = this.playerNames[midiNoteNumber % 4];

        if (!noteOff){
            const recEnabled = !extras.skipRecording && this.getParameterValue('isRecording');
            // Si Rec està ON
            if (recEnabled) {   
                const currentMainSequencerStep = getAudioGraphInstance().getMainSequencerCurrentStep();
                const currentStep = currentMainSequencerStep % this.getNumSteps();
                const pattern = this.getParameterValue('pattern');
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