import { useEffect } from "react"
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { isWebMidiEnabled, getAvailableMidiInputNames, bindMidiInputOnMidiMessage } from "../midi";
import Checkbox from '@mui/material/Checkbox';
import NativeSelect from '@mui/material/NativeSelect';


export const sendNoteOn = ({ nomEstacio, pitch, velocity, origin }) => {
    const messageData =  { pitch, velocity, type: 'noteOn', origin };
    document.notesActivades[nomEstacio].add(pitch);
    getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData, document.getElementById("forwardToServer").checked);
}

export const sendNoteOff = ({ nomEstacio, pitch, velocity, origin, force }) => {
    const messageData =  { pitch, velocity, type: 'noteOff', origin, force };
    document.notesActivades[nomEstacio].delete(pitch);
    getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData, document.getElementById("forwardToServer")?.checked ?? !getCurrentSession().usesAudioEngine());
}

const bindMidiInputDevice = (nomDevice, nomEstacio) => {
    console.log("Binding MIDI input device: " + nomDevice);
    const origin = 'midiinput';
    bindMidiInputOnMidiMessage(nomDevice, (midiMessage) => {
        const pitch = midiMessage.data[1];
        const velocity = midiMessage.data[2];
        if (midiMessage.data[0] === 144) {
            // Note on
            sendNoteOn({ nomEstacio, pitch, velocity, origin });
        } else if (midiMessage.data[0] === 128) {
            // Note off
            sendNoteOff({ nomEstacio, pitch, velocity, origin });
        }
    })
}

export const EntradaMidi = ({estacio}) => {
    useEffect(()=>{
        return () => { // es dispara al canviar d'estació, per treure les notes penjades que no han rebut noteoff
            document.notesActivades[estacio.nom]?.forEach(pitch => sendNoteOff({ nomEstacio: estacio.nom, pitch, velocity: 127, force: true, origin: 'midiinput' }))
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
    if (localStorage.getItem("lastMidiInputDevice", undefined) !== undefined) {
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
                            bindMidiInputDevice(evt.target.value);
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
                        defaultChecked={!getCurrentSession().usesAudioEngine()}
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
    const nomEstacio = estacio.nom;
    const velocity = 127; // és fixa
    const origin = 'midiinput';

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
                    const pitch = boundKeys.get(evt.key.toLowerCase());
                    sendNoteOff({ nomEstacio, pitch, velocity, origin });
                    boundKeys.delete(evt.key.toLowerCase())
                    return;
                }
                // so, it's keydown
                let pitch;
                while (true) {
                    pitch = document.baseNotes[estacio.nom] + kbdNotes.indexOf(evt.key.toLowerCase());
                    if (notesDescription && pitch < notesDescription.notaMesBaixaPermesa) {
                        handleOctaveUp();
                        continue;    
                    }
                    else if (notesDescription && pitch > notesDescription.notaMesAltaPermesa) {
                        handleOctaveDown();
                        continue;
                    }
                    break;
                }
                boundKeys.set(evt.key.toLowerCase(), pitch);
                sendNoteOn({ nomEstacio, pitch, velocity, origin });
            }

            // Drum and sampler pads
            const padNotes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
            if (padNotes.includes(evt.key)) {
                const pitch = padNotes.indexOf(evt.key);
                if (evt.type === 'keydown') sendNoteOn({ nomEstacio, pitch, velocity, origin });
                else sendNoteOff({ nomEstacio, pitch, velocity, origin });
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
            <input id="forwardToServer" type="checkbox" defaultChecked={!getCurrentSession().usesAudioEngine()} style={{display:"none"}} />
        </div>
    )
}