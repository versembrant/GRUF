import React from 'react';
import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";

export const AudioEffectsControlPanel = () => {
    subscribeToStoreChanges(getAudioGraphInstance());

    const handleEffectParameterChange = (effectKey, value) => {
        const parsedValue = effectKey === 'delayTime' ? parseInt(value, 10) : parseFloat(value);
        let newEffectParameters = {...getAudioGraphInstance().getEffectParameters() , [effectKey]: parsedValue};
        getAudioGraphInstance().updateParametreAudioGraph('effectParameters', newEffectParameters);
    };

    return (
        <div>
            <h3>Estació de control d'efectes</h3>
            {/* Diccionari que passa per cada efecte de l'store */}
            {Object.entries(getAudioGraphInstance().getEffectParameters()).map(([param, value]) => {
                const isEqParameter = param.includes('eq3');
                const isReverbDecay = param === 'reverbDecay';
                let inputElement = param === 'delayTime' ? (
                    <select
                        value={value}
                        onChange={(e) => handleEffectParameterChange(param, e.target.value)}
                    >
                        <option value="1">1/4</option>
                        <option value="2">1/8</option>
                        <option value="4">1/16</option>
                        <option value="3">1/8T</option>
                        <option value="6">1/16T</option>
                    </select>
                ) : (
                    <input
                        // Ajustem aquí els paràmetres tipus range.
                        type="range"
                        min={isEqParameter ? "-12" : isReverbDecay ? "0.1" : "0"}
                        max={isEqParameter ? "12" : isReverbDecay ? "10" : "1"}
                        step={isEqParameter || isReverbDecay ? "0.01" : "0.01"}
                        value={value}
                        onChange={(e) => handleEffectParameterChange(param, e.target.value)}
                    />
                );

                return (
                    //Retorna el nom i el input element de cada paràmetre de manera automàtica
                    <div key={param}>
                        {param.replace(/([A-Z])/g, ' $1').trim()}:
                        {inputElement}
                        {typeof value === 'number' ? value.toFixed(2) : value}
                    </div>
                );
            })}
        </div>
    );
};
