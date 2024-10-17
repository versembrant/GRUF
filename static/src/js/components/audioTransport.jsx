import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";

const handlePlayButton = async () => {  
    if (!getAudioGraphInstance().isPlaying()){
        getAudioGraphInstance().transportStart();
    } else {
        getAudioGraphInstance().transportStop() 
    }
}

export const handlePlayArranjementButton = async () => {  
    if (!getAudioGraphInstance().isPlaying()){
        getAudioGraphInstance().updateParametreAudioGraph('isPlayingArranjement', true)
        setTimeout(() => {
            // Give it some time make sure isPlayingArranjement is updated
            getAudioGraphInstance().transportStart();
        }, 100)
    } else {
        getAudioGraphInstance().transportStop();
        // No need to set isPlayingArranjement to false here as this is done automatically when hitting transportStop
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
    if (!getAudioGraphInstance().isGraphBuilt()){return (<div></div>);}// If graph is not built, don't show the play/stop button
    const compasOptions = getAudioGraphInstance().getParameterDescription('compas').options.map(compasOption=> <option value={compasOption}>{compasOption}</option>)
    return (
        <div>
            <div>
                <button onClick={handlePlayButton}>{getAudioGraphInstance().isPlaying() ? 'Stop' : 'Play'}</button>
                <label>
                    <input type="checkbox" checked={getAudioGraphInstance().isPlayingArranjement()} onChange={() => getAudioGraphInstance().updateParametreAudioGraph('isPlayingArranjement', !getAudioGraphInstance().isPlayingArranjement())}/> Play arranjement
                </label>
            </div>
            <div>
                Current step: {getAudioGraphInstance().getMainSequencerCurrentStep()}
            </div>
            <div>
                Gain: <input type="range" min="0" max="1" step="0.01" value={getAudioGraphInstance().getMasterGain()} onChange={(e) => getAudioGraphInstance().setMasterGain(e.target.value)}/>
            </div>
            <div>
                BPM: <input type="range" min={getAudioGraphInstance().getParameterDescription('bpm').min} max={getAudioGraphInstance().getParameterDescription('bpm').max} step="1" value={getAudioGraphInstance().getBpm()} onChange={(e) => handleSetBpm(e)}/> {getAudioGraphInstance().getBpm()}
            </div>
            <div>
                Swing: <input type="range" min="0" max="1" step="0.01" value={getAudioGraphInstance().getSwing()} onChange={(e) => handleSetSwing(e)}/> {getAudioGraphInstance().getSwing()}
            </div>
            <div>
                Compàs:
                <select value={getAudioGraphInstance().getCompas()} onChange={handleCompasChange}>
                    {compasOptions}
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

export const AudioTransportPlayStop = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    // Aquest play/stop el mostrem a la part superior de les estacions. Només mostra l'estat de "isPlaying" si s'està fent play en mode live, no en mode arranjement
    return (
        <div>
            <button disabled={!getAudioGraphInstance().isGraphBuilt()} className="btn-petit" onClick={handlePlayButton}>{getAudioGraphInstance().isPlaying() ? <img height="16px" src={getAudioGraphInstance().isPlayingLive() ? (appPrefix + "/static/src/img/stop_button.svg"): (appPrefix + "/static/src/img/stop_button_grid.svg")}/> : <img height="16px" src={getAudioGraphInstance().isPlayingLive() ? (appPrefix + "/static/src/img/play_button.svg"):(appPrefix + "/static/src/img/play_button_grid.svg")}/>}</button>
        </div>
    )
};

