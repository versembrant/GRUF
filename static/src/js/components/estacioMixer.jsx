import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { AudioEffectsControlPanel} from  "./fxControlPanel"
import { GrufButtonNoBorder } from "../components/widgets";


export const EstacioMixerUI = ({setEstacioSelected}) => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    const handleAnyInputSlider = (evt) => {
        const allGainValues = {};
        evt.target.closest('.mixer').querySelectorAll('input').forEach((inputElement) => {
            allGainValues[inputElement.name] = parseFloat(inputElement.value, 10);
        });
        getCurrentSession().liveSetGainsEstacions(allGainValues);
    }

    return (<div key="mixer1" className="estacio estacio-mixer">
        <div className="estacio-main">
            <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
            {getCurrentSession().getNomsEstacions().map(function(nomEstacio, i){
                return (
                <div key={nomEstacio}>
                    <input 
                        type="range"
                        min="0.0" 
                        max="1.0"
                        step="0.1"
                        value={getCurrentSession().getLiveGainsEstacions()[nomEstacio]}
                        name={nomEstacio}
                        onInput={(evt) => handleAnyInputSlider(evt)}
                    />{nomEstacio}
                </div>);
            })}
            <AudioEffectsControlPanel/>
        </div>
    </div>)
};