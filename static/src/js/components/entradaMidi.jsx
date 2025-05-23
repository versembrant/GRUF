import { useEffect } from "react"
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { isWebMidiEnabled, getAvailableMidiInputNames, bindMidiInputOnMidiMessage } from "../midi";
import Checkbox from '@mui/material/Checkbox';
import NativeSelect from '@mui/material/NativeSelect';

export const clearAllNotesActivates = () => {
    document.notesActivades = {}
}

export const sendNoteOn = (nomEstacio, noteNumber, noteVelocity, skipTriggerEvent=false) => {
    noteNumber = getCurrentSession().getEstacio(nomEstacio).adjustMidiNoteToEstacioRange(noteNumber);
    const messageData =  {
        noteNumber: noteNumber,
        velocity: noteVelocity,
        type: 'noteOn',
        skipTriggerEvent: skipTriggerEvent // Don't trigger event when receiving the note message, in this way it will not be shown in piano rolls
    }
    if (!document.notesActivades.hasOwnProperty(nomEstacio)) {
        document.notesActivades[nomEstacio] = new Set();
    }
    document.notesActivades[nomEstacio].add(noteNumber);
    const doSendToServer = document.getElementById("forwardToServer").checked || false;
    getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData, doSendToServer);
}

export const sendNoteOff = (nomEstacio, noteNumber, noteVelocity, extras={}) => {
    noteNumber = getCurrentSession().getEstacio(nomEstacio).adjustMidiNoteToEstacioRange(noteNumber);
    const messageData =  {
        noteNumber: noteNumber,
        velocity: noteVelocity,
        type: 'noteOff',
        ...extras
    }
    if (document.notesActivades.hasOwnProperty(nomEstacio)) {
        document.notesActivades[nomEstacio].delete(noteNumber);
    }
    getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData, document.getElementById("forwardToServer")?.checked ?? !getAudioGraphInstance().usesAudioEngine());
}

const bindMidiInputDevice = (nomDevice, nomEstacio) => {
    console.log("Binding MIDI input device: " + nomDevice);
    bindMidiInputOnMidiMessage(nomDevice, (midiMessage) => {
        if (midiMessage.data[0] === 144) {
            // Note on
            sendNoteOn(nomEstacio, midiMessage.data[1], midiMessage.data[2]);
        } else if (midiMessage.data[0] === 128) {
            // Note off
            sendNoteOff(nomEstacio, midiMessage.data[1], midiMessage.data[2]);
        }
    })
}

export const EntradaMidi = ({estacio}) => {
    useEffect(()=>{
        return () => { // es dispara al canviar d'estació, per treure les notes penjades que no han rebut noteoff
            document.notesActivades[estacio.nom]?.forEach(nota => sendNoteOff(estacio.nom, nota, 0, {force: true}))
        }
    })

    if (document.notesActivades === undefined) document.notesActivades = {};
    if (document.notesActivades[estacio.nom] === undefined) document.notesActivades[estacio.nom] = new Set();

    return(
        <div>
            <EntradaMidiExternal estacio={estacio}/>
            <EntradaMidiTeclatQWERTY estacio={estacio}/>
        </div>
    )
}

const EntradaMidiExternal = ({estacio}) => {
    if (isWebMidiEnabled() && localStorage.getItem("lastMidiInputDevice", undefined) !== undefined) {
        bindMidiInputDevice(localStorage.getItem("lastMidiInputDevice"), estacio.nom);
    }
    
    return (
        <div>
            {isWebMidiEnabled() && 
                <div>
                    <input 
                        type="hidden"
                        id="entradaMidiNomEstacio"
                        value={estacio.nom}>
                    </input>
                    <NativeSelect
                        defaultValue={localStorage.getItem("lastMidiInputDevice", getAvailableMidiInputNames()[0])}
                        disableUnderline={true}
                        onChange={async (evt) => {
                            localStorage.setItem("lastMidiInputDevice", evt.target.value);
                            bindMidiInputDevice(evt.target.value, estacio.nom);
                        }}
                        sx={{
                            color: "#fff",
                            "fontFamily": "Montserrat, sans-serif",
                            "svg": {
                                fill: "#fff"
                            }
                        }}
                        >
                        <option value="cap">Cap</option>
                        {getAvailableMidiInputNames().map((nomDevice, i) => <option key={nomDevice} value={nomDevice}>{nomDevice}</option>)}
                    </NativeSelect>
                    <Checkbox 
                        style={{display:"none"}}
                        id="forwardToServer" 
                        defaultChecked={!getAudioGraphInstance().usesAudioEngine()}
                        title="Marca per enviar notes al servidor" 
                        sx={{
                            color: "#fff",
                            '&.Mui-checked': {
                            color: "#fff",
                            },
                        }}
                    />
                    
                </div>
            }
        </div>
    )
}


const EntradaMidiTeclatQWERTY = ({estacio}) => {
    const notesDescription = estacio.getParameterDescription('notes');

    if (document.baseNotes === undefined) {
        document.baseNotes = {};
        getCurrentSession().getNomsEstacions().forEach(nomEstacio => document.baseNotes[nomEstacio] = 60);
    }

    const handleOctaveUp = (evt) => {
        if (document.baseNotes[estacio.nom] >= 100) return;
        document.baseNotes[estacio.nom] += 12;
    }

    const handleOctaveDown = (evt) => {
        if (document.baseNotes[estacio.nom] < 12) return;
        document.baseNotes[estacio.nom] -= 12;
    }

    const boundKeys = new Map();

    const handleKeyEvent = async (evt) => {
        if ((document.activeElement.tagName === "INPUT") && (document.activeElement.type === "text")) return;
                // If typing in a text input, do not trigger MIDI events from keypress
            if (evt.repeat) return; // If repeat event, ignore it
            // Notes
            const kbdNotes = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k"];
            if (kbdNotes.includes(evt.key.toLowerCase())) {
                if (evt.type === 'keyup') {
                    const midiNote = boundKeys.get(evt.key.toLowerCase());
                    sendNoteOff(estacio.nom, midiNote, 0);
                    boundKeys.delete(evt.key.toLowerCase())
                    return;
                }
                // so, it's keydown
                let midiNote;
                while (true) {
                    midiNote = document.baseNotes[estacio.nom] + kbdNotes.indexOf(evt.key.toLowerCase());
                    if (notesDescription && midiNote < notesDescription.notaMesBaixaPermesa) {
                        handleOctaveUp();
                        continue;    
                    }
                    else if (notesDescription && midiNote > notesDescription.notaMesAltaPermesa) {
                        handleOctaveDown();
                        continue;
                    }
                    break;
                }
                boundKeys.set(evt.key.toLowerCase(), midiNote);
                sendNoteOn(estacio.nom, midiNote, 127);
            }

            // Drum and sampler pads
            const padNotes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
            if (padNotes.includes(evt.key)) {
                if (evt.type === 'keydown') sendNoteOn(estacio.nom, padNotes.indexOf(evt.key), 127);
                else sendNoteOff(estacio.nom, padNotes.indexOf(evt.key), 127);
            }

            if (evt.type === 'keyup') return;
            // Octave change
            if (evt.key == "+") handleOctaveUp();
            else if (evt.key == "-") handleOctaveDown();
    }
    
    useEffect(()=> {
        document.addEventListener('keydown', handleKeyEvent);
        document.addEventListener('keyup', handleKeyEvent);

        return () => {
            document.removeEventListener('keydown', handleKeyEvent);
            document.removeEventListener('keyup', handleKeyEvent);
        }
    })
    
    return (
        <div>
            <input id="entradaMidiNomEstacio" type="hidden" value={estacio.nom}/>
            <input id="forwardToServer" type="checkbox" defaultChecked={!getAudioGraphInstance().usesAudioEngine()} style={{display:"none"}} />
        </div>
    )
}