import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";

export const AudioTransportControls = () => {
    subscribeToStoreChanges(getAudioGraphInstance());

    const handlePlayButton = async () => {  
        await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
        if (!getAudioGraphInstance().isRunning()){
            if ((getCurrentSession() !== undefined && (!getAudioGraphInstance().graphIsBuilt()))) {
                getAudioGraphInstance().buildAudioGraph();  // Only build audio graph the first time "play" is pressed
            }
            getAudioGraphInstance().transportStart();
        } else {
            getAudioGraphInstance().transportStop()
        }
    }

    const handleSetBpm = (e) => {
        getAudioGraphInstance().setBpm(e.target.value)
        getAudioGraphInstance().updateBpmInServer(e.target.value)
    }

    return (
        <div>
            <div>
                <button onClick={handlePlayButton}>{getAudioGraphInstance().isRunning() ? 'Stop' : 'Play'}</button>
                Current step: {getAudioGraphInstance().getMainSequencerCurrentStep()}
            </div>
            <div>
                Volume: <input type="range" min="0" max="1" step="0.01" value={getAudioGraphInstance().getMasterGain()} onChange={(e) => getAudioGraphInstance().setMasterGain(e.target.value)}/>
            </div>
            <div>
                BPM: <input type="range" min="40" max="300" step="1" value={getAudioGraphInstance().getBpm()} onChange={(e) => handleSetBpm(e)}/> {getAudioGraphInstance().getBpm()}
            </div>
            <div>
                <label>
                    <input type="checkbox" checked={getAudioGraphInstance().isMasterAudioEngine()} onChange={() => getAudioGraphInstance().setMasterAudioEngine(!getAudioGraphInstance().isMasterAudioEngine())}/> Master audio engine
                </label>
            </div>
        </div>
    )
};