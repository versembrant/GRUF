
import React from 'react';
import { getAudioGraphInstance } from "../audioEngine";

export const AudioEffectsControls = () => {
    const audioGraph = getAudioGraphInstance();

    return (
        <div>
            <div>
                <label>Chorus Wet:</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={audioGraph.getChorusWet()}
                    onChange={(e) => audioGraph.updateParametreAudioGraph('chorusWet', parseFloat(e.target.value))}
                />
            </div>
            <div>
                <label>Reverb Decay:</label>
                <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={audioGraph.getReverbDecay()}
                    onChange={(e) => audioGraph.updateParametreAudioGraph('reverbDecay', parseFloat(e.target.value))}
                />
            </div>
            <div>
                <label>Delay Time:</label>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={audioGraph.getDelayTime()}
                    onChange={(e) => audioGraph.updateParametreAudioGraph('delayTime', parseFloat(e.target.value))}
                />
            </div>
        </div>
    );
};