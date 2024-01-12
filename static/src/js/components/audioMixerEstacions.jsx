import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";


export const AudioMixerEstacions = () => {
    subscribeToStoreChanges(getAudioGraphInstance());

    const handleAnyInputSlider = (evt) => {
        const allGainValues = {};
        evt.target.closest('.mixer').querySelectorAll('input').forEach((inputElement) => {
            allGainValues[inputElement.name] = parseFloat(inputElement.value, 10);
        });
        getAudioGraphInstance().setGainsEstacions(allGainValues);
        getAudioGraphInstance().updateGainsEstacionsInServer(allGainValues);
    }

    return (
        <div className="mixer">
            {getCurrentSession().getNomsEstacions().map(function(nomEstacio, i){
                return (
                <div key={i}>
                    <input 
                        type="range"
                        min="0.0" 
                        max="1.0"
                        step="0.1"
                        value={getAudioGraphInstance().getGainsEstacions()[nomEstacio]}
                        name={nomEstacio}
                        onInput={(evt) => handleAnyInputSlider(evt)}
                    />{nomEstacio}
                </div>);
            })}
        </div>
    )
};