import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { isWebMidiEnabled, getAvailableMidiInputNames, bindMidiInputOnMidiMessage } from "../midi";

export const EntradaMidi = () => {

    let baseNote = 60;
    document.baseNote = baseNote;

    const buildAudioGraphIfNotBuilt = async () => {  
        if (!getAudioGraphInstance().graphIsBuilt()) {
            await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
            getAudioGraphInstance().buildAudioGraph();  // Only build audio graph the first time "play" is pressed
        }
    }

    const getMidiNoteNoteNumber = buttonElement => {
        if (buttonElement.dataset.midiNote !== undefined) {
            return baseNote + parseInt(buttonElement.dataset.midiNote, 10);
        } else {
            return parseInt(buttonElement.dataset.midiPad, 10);
        }
    }

    const handleKeyDown = async (evt) => {
        await buildAudioGraphIfNotBuilt()
        sendNoteOn(getMidiNoteNoteNumber(evt.target), 127);
    }

    const handleKeyUp = async (evt) => {  
        await buildAudioGraphIfNotBuilt()
        sendNoteOff(getMidiNoteNoteNumber(evt.target), 127);
    }

    const handleOctaveUp = (evt) => {
        baseNote += 12;
        document.baseNote = baseNote;
    }

    const handleOctaveDown = (evt) => {
        baseNote -= 12;
        document.baseNote = baseNote;
    }

    document.notesActivades = {};
    getCurrentSession().getNomsEstacions().forEach((nomEstacio) => {
        document.notesActivades[nomEstacio] = new Set();
    });

    const sendNoteOn = (noteNumber, noteVelocity) => {
        const messageData =  {
            noteNumber: noteNumber,
            velocity: noteVelocity,
            type: 'noteOn'
        }
        let nomEstacio = document.getElementById("entradaMidiNomEstacio").value;
        if (nomEstacio == "all") {
            nomEstacio = undefined;
        }
        document.notesActivades[nomEstacio].add(noteNumber);
        getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData, document.getElementById("forwardToServer").checked);
    }

    const sendNoteOff = (noteNumber, noteVelocity) => {
        const messageData =  {
            noteNumber: noteNumber,
            velocity: noteVelocity,
            type: 'noteOff'
        }
        let nomEstacio = document.getElementById("entradaMidiNomEstacio").value;
        if (nomEstacio == "all") {
            nomEstacio = undefined;
        }
        document.notesActivades[nomEstacio].delete(noteNumber);
        getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData, document.getElementById("forwardToServer").checked);
    }

    const panic = () => {
        // Sends a note off for all active notes in all devices
        for (let nomEstacio in document.notesActivades) {
            document.notesActivades[nomEstacio].forEach((noteNumber) => {
                const messageData =  {
                    noteNumber: noteNumber,
                    velocity: 0,
                    type: 'noteOff'
                }
                document.notesActivades[nomEstacio].delete(noteNumber);
                getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData, document.getElementById("forwardToServer").checked);
            });
        }
    }

    if (document.inputKeyDownEventBinded === undefined){
        document.inputKeyDownEventBinded = true;
        document.addEventListener('keydown', async (evt) => {
            await buildAudioGraphIfNotBuilt()
            if ((document.activeElement.tagName === "INPUT") && (document.activeElement.type === "text")){
                // If typing in a text input, do not trigger MIDI events from keypress
            } else if (evt.repeat) {
                // If repeat event, ignore it
            } else {
                // Drum pads
                if (evt.key == "1") {
                    sendNoteOn(0, 127);
                } else if (evt.key == "2") {
                    sendNoteOn(1, 127);
                } else if (evt.key == "3") {
                    sendNoteOn(2, 127);
                } else if (evt.key == "4") {
                    sendNoteOn(3, 127);
                }

                // Notes
                if (evt.key == "a") {
                    sendNoteOn(document.baseNote, 127);
                } else if (evt.key == "w") {
                    sendNoteOn(document.baseNote + 1, 127);
                } else if (evt.key == "s") {
                    sendNoteOn(document.baseNote + 2, 127);
                } else if (evt.key == "e") {
                    sendNoteOn(document.baseNote + 3, 127);
                } else if (evt.key == "d") {
                    sendNoteOn(document.baseNote + 4, 127);
                } else if (evt.key == "f") {
                    sendNoteOn(document.baseNote + 5, 127);
                } else if (evt.key == "t") {
                    sendNoteOn(document.baseNote + 6, 127);
                } else if (evt.key == "g") {
                    sendNoteOn(document.baseNote + 7, 127);
                } else if (evt.key == "y") {
                    sendNoteOn(document.baseNote + 8, 127);
                } else if (evt.key == "h") {
                    sendNoteOn(document.baseNote + 9, 127);
                } else if (evt.key == "u") {
                    sendNoteOn(document.baseNote + 10, 127);
                } else if (evt.key == "j") {
                    sendNoteOn(document.baseNote + 11, 127);
                } else if (evt.key == "k") {
                    sendNoteOn(document.baseNote + 12, 127);
                } 
            }
        })

        document.addEventListener('keyup', async (evt) => {
            await buildAudioGraphIfNotBuilt()
            if ((document.activeElement.tagName === "INPUT") && (document.activeElement.type === "text")){
                // If typing in a text input, do not trigger MIDI events from keypress
            } else if (evt.repeat) {
                // If repeat event, ignore it
            } else {
                // Drum pads
                if (evt.key == "1") {
                    sendNoteOff(0, 0);
                } else if (evt.key == "2") {
                    sendNoteOff(1, 0);
                } else if (evt.key == "3") {
                    sendNoteOff(2, 0);
                } else if (evt.key == "4") {
                    sendNoteOff(3, 0);
                }

                // Notes
                if (evt.key == "a") {
                    sendNoteOff(document.baseNote, 0);
                } else if (evt.key == "w") {
                    sendNoteOff(document.baseNote + 1, 0);
                } else if (evt.key == "s") {
                    sendNoteOff(document.baseNote + 2, 0);
                } else if (evt.key == "e") {
                    sendNoteOff(document.baseNote + 3, 0);
                } else if (evt.key == "d") {
                    sendNoteOff(document.baseNote + 4, 0);
                } else if (evt.key == "f") {
                    sendNoteOff(document.baseNote + 5, 0);
                } else if (evt.key == "t") {
                    sendNoteOff(document.baseNote + 6, 0);
                } else if (evt.key == "g") {
                    sendNoteOff(document.baseNote + 7, 0);
                } else if (evt.key == "y") {
                    sendNoteOff(document.baseNote + 8, 0);
                } else if (evt.key == "h") {
                    sendNoteOff(document.baseNote + 9, 0);
                } else if (evt.key == "u") {
                    sendNoteOff(document.baseNote + 10, 0);
                } else if (evt.key == "j") {
                    sendNoteOff(document.baseNote + 11, 0);
                } else if (evt.key == "k") {
                    sendNoteOff(document.baseNote + 12, 0);
                } 
            }
        })
    }
    
    return (
        <div>
            <h2>Entrada MIDI</h2>
            <div>
                Enviar a estació: 
                <select 
                    id="entradaMidiNomEstacio"
                    defaultValue={getCurrentSession().getNomsEstacions()[0]}>
                    {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <option key={nomEstacio} value={nomEstacio}>{nomEstacio}</option>)}
                </select>
            </div>
            <div>
                <label>Enviar al servidor: <input id="forwardToServer" type="checkbox" defaultChecked={false} /></label>
            </div>
            <div>
                <button data-midi-pad="0" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>Pad #1</button>
                <button data-midi-pad="1" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>Pad #2</button>
                <button data-midi-pad="2" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>Pad #3</button>
                <button data-midi-pad="3" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>Pad #4</button>
            </div>
            <div>
                <button data-midi-note="0" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>C</button>
                <button data-midi-note="2" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>D</button>
                <button data-midi-note="4" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>E</button>
                <button data-midi-note="5" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>F</button>
                <button data-midi-note="7" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>G</button>
                <button data-midi-note="9" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>A</button>
                <button data-midi-note="11" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>B</button>
                <button data-midi-note="12" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp} onMouseLeave={handleKeyUp}>C</button>
                <button onClick={handleOctaveDown}>Octave down</button>
                <button onClick={handleOctaveUp}>Octave up</button>
            </div>
            <div>Pots tocar els pads amb les tecles 1, 2, 3, 4. Pots tocar el "piano" amb les tecles a, w, s, e, d...</div>
            {isWebMidiEnabled() && 
                <div>
                    <select
                        onChange={async (evt) => {
                            await buildAudioGraphIfNotBuilt();
                            bindMidiInputOnMidiMessage(evt.target.value, (midiMessage) => {
                                if (midiMessage.data[0] === 144) {
                                    // Note on
                                    sendNoteOn(midiMessage.data[1], midiMessage.data[2]);
                                } else if (midiMessage.data[0] === 128) {
                                    // Note off
                                    sendNoteOff(midiMessage.data[1], midiMessage.data[2]);
                                }
                            });
                        }}>
                        <option value="cap">Cap</option>
                        {getAvailableMidiInputNames().map((nomDevice, i) => <option key={nomDevice} value={nomDevice}>{nomDevice}</option>)}
                    </select>
                </div>
            }
            <div>
                <button onClick={panic}>Panic</button>
            </div>
        </div>
    )
};