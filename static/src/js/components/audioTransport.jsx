import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";

export const AudioTransportControls = () => {
    subscribeToStoreChanges(getAudioGraphInstance());

    const handlePlayButton = async () => {  
        await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
        if (!getAudioGraphInstance().isPlaying()){
            if ((getCurrentSession() !== undefined && (!getAudioGraphInstance().graphIsBuilt()))) {
                getAudioGraphInstance().buildAudioGraph();  // Only build audio graph the first time "play" is pressed
            }
            getAudioGraphInstance().transportStart();
        } else {
            getAudioGraphInstance().transportStop()
        }
    }

    const handleSetBpm = (e) => {
        getAudioGraphInstance().updateParametreAudioGraph('bpm', e.target.value)
    }
    const handleSetSwing = (e) => {
        getAudioGraphInstance().updateParametreAudioGraph('swing', e.target.value)
    }
    return (
        <div>
            <div>
                <button onClick={handlePlayButton}>{getAudioGraphInstance().isPlaying() ? 'Stop' : 'Play'}</button>
                <label>
                    <input type="checkbox" checked={getAudioGraphInstance().isPlayingArranjement()} onChange={() => getAudioGraphInstance().updateParametreAudioGraph('playingArranjement', !getAudioGraphInstance().isPlayingArranjement())}/> Play arranjement
                </label>
                
            </div>
            <div>
                Current step: {getAudioGraphInstance().getMainSequencerCurrentStep()}
            </div>
            <div>
                Volume: <input type="range" min="0" max="1" step="0.01" value={getAudioGraphInstance().getMasterGain()} onChange={(e) => getAudioGraphInstance().setMasterGain(e.target.value)}/>
            </div>
            <div>
                BPM: <input type="range" min="40" max="300" step="1" value={getAudioGraphInstance().getBpm()} onChange={(e) => handleSetBpm(e)}/> {getAudioGraphInstance().getBpm()}
            </div>
            <div>
                Swing: <input type="range" min="0" max="1" step="0.01" value={getAudioGraphInstance().getSwing()} onChange={(e) => handleSetSwing(e)}/> {getAudioGraphInstance().getSwing()}
            </div>
            <div>
                <label>
                    <input type="checkbox" checked={getAudioGraphInstance().isMasterAudioEngine()} onChange={() => getAudioGraphInstance().setMasterAudioEngine(!getAudioGraphInstance().isMasterAudioEngine())}/> Master audio engine
                </label>
            </div>
        </div>
    )
};