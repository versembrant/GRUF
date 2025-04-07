import { subscribeToParameterChanges } from "../utils"; // subscriptions
import { getAudioGraphInstance } from "../audioEngine";
import icona_recording from "../../img/record_button.svg"
import icona_recording_vermell from "../../img/record_button_vermell.svg"

export const SessionAudioRecorder = ({}) => {
    
    subscribeToParameterChanges(getAudioGraphInstance(), 'usesAudioEngine');
    subscribeToParameterChanges(getAudioGraphInstance(), 'recordArmed');
    subscribeToParameterChanges(getAudioGraphInstance(), 'isRecordingSession');
    
    const handleStartRecording = () => {
        if (getAudioGraphInstance().isRecordArmed()) {
            getAudioGraphInstance().setIsRecordArmed(false);
        } else {
            getAudioGraphInstance().startRecordingSession();
        }
    }
    
    const handleStoptRecording = () => {
        getAudioGraphInstance().stopRecordingSession();
    }
    
    const isRecording = getAudioGraphInstance().isRecording();
    const isRecordArmed = getAudioGraphInstance().isRecordArmed();
    
    let button;
    if (isRecording) {
        button = <button className="btn-white btn-petit session-recording" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStoptRecording} title="Atura la gravació"><img height="16px" src={icona_recording_vermell}/></button>
    } else {
        if (isRecordArmed) {
            button = <button className="btn-white btn-petit session-armed-recording" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStartRecording} title="Esperant que començi l'àudio..."><img height="16px" src={icona_recording}/></button>
        } else {
            button = <button className="btn-white btn-petit" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStartRecording} title="Grava l'àudio"><img height="16px" src={icona_recording}/></button>
        }
    }
    return <div>{button}</div>
}