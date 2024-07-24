import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";

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

const handlePlayArranjementButton = async () => {  
    await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
    if (!getAudioGraphInstance().isPlaying()){
        if ((getCurrentSession() !== undefined && (!getAudioGraphInstance().graphIsBuilt()))) {
            getAudioGraphInstance().buildAudioGraph();  // Only build audio graph the first time "play" is pressed
        }
        getAudioGraphInstance().updateParametreAudioGraph('playingArranjement', true)
        setTimeout(() => {
            // Give it some time make sure playingArranjement is updated
            getAudioGraphInstance().transportStart();
        }, 100)
        
    } else {
        getAudioGraphInstance().transportStop();
        // No need to set playingArranjement to false here as this is done automatically when hitting transportStop
    }
}

const handleSetBpm = (e) => {
    getAudioGraphInstance().updateParametreAudioGraph('bpm', e.target.value)
}
const handleSetSwing = (e) => {
    getAudioGraphInstance().updateParametreAudioGraph('swing', e.target.value)
}
const handleCompasChange = (e) => {
    getAudioGraphInstance().updateParametreAudioGraph('compas', e.target.value); 
}

export const AudioTransportControls = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
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
                Compàs:
                <select value={getAudioGraphInstance().getCompas()} onChange={handleCompasChange}>
                    <option value="2/4">2/4</option>
                    <option value="3/4">3/4</option>
                    <option value="4/4">4/4</option>
                </select>
            </div>
            <div>
                <label>
                    <input type="checkbox" checked={getAudioGraphInstance().isMasterAudioEngine()} onChange={() => getAudioGraphInstance().setMasterAudioEngine(!getAudioGraphInstance().isMasterAudioEngine())}/> Master audio engine
                </label>
            </div>
        </div>
    )
};

export const AudioTransportControlsMinimal = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    return (
        <div>
            <div>
                <button onClick={handlePlayButton}>{getAudioGraphInstance().isPlaying() ? 'Stop' : 'Play'}</button>
                Volume: <input type="range" min="0" max="1" step="0.01" value={getAudioGraphInstance().getMasterGain()} onChange={(e) => getAudioGraphInstance().setMasterGain(e.target.value)}/>
                <label>
                    <input type="checkbox" checked={getAudioGraphInstance().isMasterAudioEngine()} onChange={() => getAudioGraphInstance().setMasterAudioEngine(!getAudioGraphInstance().isMasterAudioEngine())}/> Master audio engine
                </label>
            </div>
        </div>
    )
};

export const AudioTransportPlayStop = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    return (
        <div>
            <div>
                <a className="btn btn-menys-marge" onClick={handlePlayButton}>{getAudioGraphInstance().isPlaying() ? '\u23F9' : '\u25B6'}</a>
                
            </div>
        </div>
    )
};

export const AudioTransportControlsComputer = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    return (
        <div>
            <div>
                <button onClick={handlePlayArranjementButton}>{getAudioGraphInstance().isPlaying() ? 'Stop' : 'Playing arranjement'}</button>
                {getAudioGraphInstance().isPlaying() && !getAudioGraphInstance().isPlayingArranjement() ? "Warning: not playing from arranjement!": ""}
            </div>
            <div>
                BPM: <input type="range" min="40" max="300" step="1" value={getAudioGraphInstance().getBpm()} onChange={(e) => handleSetBpm(e)}/> {getAudioGraphInstance().getBpm()}
            </div>
            <div>
                Swing: <input type="range" min="0" max="1" step="0.01" value={getAudioGraphInstance().getSwing()} onChange={(e) => handleSetSwing(e)}/> {getAudioGraphInstance().getSwing()}
            </div>
            <div>
                Compàs:
                <select value={getAudioGraphInstance().getCompas()} onChange={handleCompasChange}>
                    <option value="2/4">2/4</option>
                    <option value="3/4">3/4</option>
                    <option value="4/4">4/4</option>
                </select>
            </div>
            <div>
                Current step: {getAudioGraphInstance().isPlayingArranjement() ? getAudioGraphInstance().getMainSequencerCurrentStep(): "-"}
            </div>
        </div>
    )
};

