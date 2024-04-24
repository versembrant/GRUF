import React from 'react';
import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";

export const AudioEffectsControlPanel = () => {
    const audioGraph = getAudioGraphInstance();
    subscribeToStoreChanges(audioGraph);

    const handleEffectParameterChange = (effectKey, value) => {
        audioGraph.setEffectParameter(effectKey, parseFloat(value));
    }

    const DelayTimeSelector = () => {
        return (
            <div>
                Delay Time: 
                <select 
                    value={audioGraph.getEffectParameter('delayTime')}
                    onChange={(e) => handleEffectParameterChange('delayTime', e.target.value)}
                >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                </select>
            </div>
        );
    };

    const EffectSlider = (effectKey, label, min, max, step) => {
        return (
            <div>
                {label}: 
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    step={step} 
                    value={audioGraph.getEffectParameter(effectKey)}
                    onChange={(e) => handleEffectParameterChange(effectKey, e.target.value)}
                />
                {audioGraph.getEffectParameter(effectKey).toFixed(2)}
            </div>
        );
    };

    return (
        <div>
            <h3>Audio Effects Control</h3>
            {EffectSlider('reverbWet', 'Reverb Wet', 0, 1, 0.01)}
            {EffectSlider('reverbDecay', 'Reverb Decay', 0.5, 10, 0.1)}
            {EffectSlider('delayWet', 'Delay Wet', 0, 1, 0.01)}
            {DelayTimeSelector()}
            {EffectSlider('delayFeedback', 'Delay Feedback', 0, 1, 0.01)}
            {EffectSlider('drive', 'Drive', 0, 1, 0.01)}
            {EffectSlider('eq3HighGain', 'EQ3 High Gain', -12, 12, 0.1)}
            {EffectSlider('eq3MidGain', 'EQ3 Mid Gain', -12, 12, 0.1)}
            {EffectSlider('eq3LowGain', 'EQ3 Low Gain', -12, 12, 0.1)}
        </div>
    );
};