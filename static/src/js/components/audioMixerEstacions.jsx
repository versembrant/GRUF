import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";


export const AudioMixerEstacions = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    const handleAnyInputSlider = (evt) => {
        const allGainValues = {};
        evt.target.closest('.mixer').querySelectorAll('input').forEach((inputElement) => {
            allGainValues[inputElement.name] = parseFloat(inputElement.value, 10);
        });
        getCurrentSession().liveSetGainsEstacions(allGainValues);
    }

    return (
        <div className="mixer">
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
        </div>
    )
};