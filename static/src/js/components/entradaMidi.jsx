import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";

export const EntradaMidi = () => {

    const handleDrumPad = (evt) => {  
        const noteNumber = evt.target.dataset.midiNote;
        const nomEstacio = undefined;
        const messageData =  {
            noteNumber: noteNumber,
            velocity: 127,
            type: 'noteOn'
        }
        getAudioGraphInstance().sendMidiEvent(nomEstacio, messageData);
    }

    return (
        <div>
            <div>
                <button data-midi-note="24" onClick={handleDrumPad}>Pad #1</button>
            </div>
        </div>
    )
};