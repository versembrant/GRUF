import { subscribeToPartialStoreChanges, subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";
import icona_play_live from "../../img/play_button.svg"
import icona_play_arranjament from "../../img/play_button_grid.svg"
import icona_stop_live from "../../img/stop_button.svg"
import icona_stop_arranjament from "../../img/stop_button_grid.svg"
import { useEffect } from "react";
import { getCurrentSession } from "../sessionManager";

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

// Aquest play/stop el mostrem a la part superior de les estacions
export const AudioTransportPlayStop = ({ playMode='live' }) => {
    subscribeToStoreChanges(getAudioGraphInstance());

    const imgSrc = !getAudioGraphInstance().isPlaying() ? playMode === 'live' ? icona_play_live : icona_play_arranjament :
        getAudioGraphInstance().isPlayingArranjament() ? icona_stop_arranjament : icona_stop_live;
    
    const handleKbPress = (e) => {
        if (e.key !== " ") return; // only interested about space
        e.preventDefault(); // per defecte, la barra d'espai fa scroll vertical
        document.querySelector("#transport-toggle").click();
    }
    useEffect(()=> {
        document.addEventListener('keydown', handleKbPress);
        return () => document.removeEventListener('keydown', handleKbPress);
    }, [])

    const isRecording = getAudioGraphInstance().isRecording();

    return (
    <div>
        <button id="transport-toggle"
        title={"Play/stop" + (playMode === 'live' ? '' : ' arranjament')}
        disabled={!getAudioGraphInstance().usesAudioEngine()}
        className={"btn-white btn-petit " + (isRecording ? "session-recording btn-red" : "")}
        onClick={() => handlePlayButton(playMode)}>
            <img height="16px" src={imgSrc}/>
        </button>
    </div>
    )
};