import React from 'react';
import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";

export const AudioEffectsControlPanel = () => {
    subscribeToStoreChanges(getAudioGraphInstance());

    const handleEffectParameterChange = (value) => {
        getAudioGraphInstance().updateParametreAudioGraph('effectParameters', parseFloat(value));
    };

    return (
        <div>
            <h3>Audio Effects Control</h3>
            <div>
                Reverb Wet:
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={getAudioGraphInstance().getEffectParameter('reverbWet')}
                    onChange={(e) => handleEffectParameterChange('reverbWet', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('reverbWet').toFixed(2)}
            </div>
            <div>
                Reverb Decay:
                <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={getAudioGraphInstance().getEffectParameter('reverbDecay')}
                    onChange={(e) => handleEffectParameterChange('reverbDecay', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('reverbDecay').toFixed(2)}
            </div>
            <div>
                Delay Wet:
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={getAudioGraphInstance().getEffectParameter('delayWet')}
                    onChange={(e) => handleEffectParameterChange('delayWet', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('delayWet').toFixed(2)}
            </div>
            <div>
                Delay Time:
                <select
                    value={getAudioGraphInstance().getEffectParameter('delayTime')}
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
            <div>
                Delay Feedback:
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={getAudioGraphInstance().getEffectParameter('delayFeedback')}
                    onChange={(e) => handleEffectParameterChange('delayFeedback', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('delayFeedback').toFixed(2)}
            </div>
            <div>
                Drive:
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={getAudioGraphInstance().getEffectParameter('drive')}
                    onChange={(e) => handleEffectParameterChange('drive', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('drive').toFixed(2)}
            </div>
            <div>
                EQ High Gain:
                <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.1"
                    value={getAudioGraphInstance().getEffectParameter('eq3HighGain')}
                    onChange={(e) => handleEffectParameterChange('eq3HighGain', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('eq3HighGain').toFixed(2)}
            </div>
            <div>
                EQ Mid Gain:
                <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.1"
                    value={getAudioGraphInstance().getEffectParameter('eq3MidGain')}
                    onChange={(e) => handleEffectParameterChange('eq3MidGain', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('eq3MidGain').toFixed(2)}
            </div>
            <div>
                EQ Low Gain:
                <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.1"
                    value={getAudioGraphInstance().getEffectParameter('eq3LowGain')}
                    onChange={(e) => handleEffectParameterChange('eq3LowGain', e.target.value)}
                />
                {getAudioGraphInstance().getEffectParameter('eq3LowGain').toFixed(2)}
            </div>
        </div>
    );
};
