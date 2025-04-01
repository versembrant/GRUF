import { subscribeToParameterChanges } from "../utils"; // subscriptions
import { getAudioGraphInstance } from "../audioEngine";

export const SessionAudioRecorder = ({}) => {
    
    subscribeToParameterChanges(getAudioGraphInstance(), 'isRecordArmed');
    subscribeToParameterChanges(getAudioGraphInstance(), 'isRecordigSession');
    
    const handleStartRecording = () => {
        getAudioGraphInstance().startRecordingSession();
    }
    
    const handleStoptRecording = () => {
        getAudioGraphInstance().stopRecordingSession();
    }
    
    const isRecording = getAudioGraphInstance().isRecording();
    const isRecordArmed = getAudioGraphInstance().isRecordArmed();
    
    let button;
    if (isRecording) {
        button = <button className="btn-white session-recording" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStoptRecording}>Atura la gravació</button>
    } else {
        if (isRecordArmed) {
            button = <button className="btn-white session-armed-recording" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStartRecording}>Esperant que començi l'àudio...</button>
        } else {
            button = <button className="btn-white" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStartRecording}>Grava l'àudio</button>
        }
    }
    return <div>{button}</div>
}