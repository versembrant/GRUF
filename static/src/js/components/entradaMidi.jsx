import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";

export const EntradaMidi = () => {

    const buildAudioGraphIfNotBuilt = async () => {  
        if (!getAudioGraphInstance().graphIsBuilt()) {
            await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
            getAudioGraphInstance().buildAudioGraph();  // Only build audio graph the first time "play" is pressed
        }
    }

    const handleKeyDown = async (evt) => {
        await buildAudioGraphIfNotBuilt()
        const noteNumber = parseInt(evt.target.dataset.midiNote, 10);
        sendNoteOn(noteNumber, 127);
    }

    const handleKeyUp = async (evt) => {  
        await buildAudioGraphIfNotBuilt()
        const noteNumber = parseInt(evt.target.dataset.midiNote, 10);
        sendNoteOff(noteNumber, 127);
    }

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
        getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData);
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
        getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData);
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
                    sendNoteOn(60, 127);
                } else if (evt.key == "w") {
                    sendNoteOn(61, 127);
                } else if (evt.key == "s") {
                    sendNoteOn(62, 127);
                } else if (evt.key == "e") {
                    sendNoteOn(63, 127);
                } else if (evt.key == "d") {
                    sendNoteOn(64, 127);
                } else if (evt.key == "f") {
                    sendNoteOn(65, 127);
                } else if (evt.key == "t") {
                    sendNoteOn(66, 127);
                } else if (evt.key == "g") {
                    sendNoteOn(67, 127);
                } else if (evt.key == "y") {
                    sendNoteOn(68, 127);
                } else if (evt.key == "h") {
                    sendNoteOn(69, 127);
                } else if (evt.key == "u") {
                    sendNoteOn(70, 127);
                } else if (evt.key == "j") {
                    sendNoteOn(71, 127);
                } else if (evt.key == "k") {
                    sendNoteOn(72, 127);
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
                    sendNoteOff(0, 127);
                } else if (evt.key == "2") {
                    sendNoteOff(1, 127);
                } else if (evt.key == "3") {
                    sendNoteOff(2, 127);
                } else if (evt.key == "4") {
                    sendNoteOff(3, 127);
                }

                // Notes
                if (evt.key == "a") {
                    sendNoteOff(60, 127);
                } else if (evt.key == "w") {
                    sendNoteOff(61, 127);
                } else if (evt.key == "s") {
                    sendNoteOff(62, 127);
                } else if (evt.key == "e") {
                    sendNoteOff(63, 127);
                } else if (evt.key == "d") {
                    sendNoteOff(64, 127);
                } else if (evt.key == "f") {
                    sendNoteOff(65, 127);
                } else if (evt.key == "t") {
                    sendNoteOff(66, 127);
                } else if (evt.key == "g") {
                    sendNoteOff(67, 127);
                } else if (evt.key == "y") {
                    sendNoteOff(68, 127);
                } else if (evt.key == "h") {
                    sendNoteOff(69, 127);
                } else if (evt.key == "u") {
                    sendNoteOff(70, 127);
                } else if (evt.key == "j") {
                    sendNoteOff(71, 127);
                } else if (evt.key == "k") {
                    sendNoteOff(72, 127);
                } 
            }
        })
    }
    
    return (
        <div>
            <h2>Entrada MIDI</h2>
            <div>
                Estació: 
                <select id="entradaMidiNomEstacio">
                    <option value="all">Totes</option>
                    {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <option key={nomEstacio} value={nomEstacio}>{nomEstacio}</option>)}
                </select>
            </div>
            <div>
                <button data-midi-note="0" onMouseDown={handleKeyDown}>Pad #1</button>
                <button data-midi-note="1" onMouseDown={handleKeyDown}>Pad #2</button>
                <button data-midi-note="2" onMouseDown={handleKeyDown}>Pad #3</button>
                <button data-midi-note="3" onMouseDown={handleKeyDown}>Pad #4</button>
            </div>
            <div>
                <button data-midi-note="60" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>C</button>
                <button data-midi-note="62" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>D</button>
                <button data-midi-note="64" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>E</button>
                <button data-midi-note="65" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>F</button>
                <button data-midi-note="67" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>G</button>
                <button data-midi-note="69" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>A</button>
                <button data-midi-note="71" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>B</button>
                <button data-midi-note="72" onMouseDown={handleKeyDown} onMouseUp={handleKeyUp}>C</button>
            </div>
            <div>Pots tocar els pads amb les tecles 1, 2, 3, 4. Pots tocar el "piano" amb les tecles a, w, s, e, d...</div>
        </div>
    )
};