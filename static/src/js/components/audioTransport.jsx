import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import icona_play_live from "../../img/play_button.svg"
import icona_play_arranjament from "../../img/play_button_grid.svg"
import icona_stop_live from "../../img/stop_button.svg"
import icona_stop_arranjament from "../../img/stop_button_grid.svg"

const handlePlayButton = async (playMode) => {
    if (playMode !== 'live' && playMode !== 'arranjament') throw new Error(`Unknown playMode: ${playMode}`)

    if (getAudioGraphInstance().isPlaying()) return getAudioGraphInstance().transportStop();
    if (playMode === 'live') return getAudioGraphInstance().transportStart(); // isPlayingArranjament is auto-set to false when hitting transportStop
    getAudioGraphInstance().updateParametreAudioGraph('isPlayingArranjament', true);
    setTimeout(() => {
        // Give it some time make sure isPlayingArranjament is updated
        getAudioGraphInstance().transportStart();
    }, 100)
}

export const AudioTransportPlayStop = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    // Aquest play/stop el mostrem a la part superior de les estacions. Només mostra l'estat de "isPlaying" si s'està fent play en mode live, no en mode arranjament
    const imgSrc = !getAudioGraphInstance().isPlaying() ? icona_play_live :
        getAudioGraphInstance().isPlayingArranjament() ? icona_stop_arranjament : icona_stop_live;
    return (
        <div>
            <button disabled={!getAudioGraphInstance().isGraphBuilt()}
            className="btn-petit"
            onClick={() => handlePlayButton('live')}>
                <img height="16px" src={imgSrc}/>
            </button>
        </div>
    )
};

export const PlayArranjamentButton = () => {
    return(
        <button disabled={!getAudioGraphInstance().isGraphBuilt()}
        className="btn-petit"
        onClick={() => handlePlayButton('arranjament')}>
        {getAudioGraphInstance().isPlaying() ?
            <img height="16px" src={getAudioGraphInstance().isPlayingArranjament() ? (appPrefix + "/static/src/img/stop_button_grid.svg"): (appPrefix + "/static/src/img/stop_button.svg")}/>
        : <img height="16px" src={appPrefix + "/static/src/img/play_button_grid.svg"}/>}
        </button>
    )
}

