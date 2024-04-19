import React from 'react';
import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from "../audioEngine";

export const AudioEffectsControlPanel = () => {
    subscribeToStoreChanges(getAudioGraphInstance());

    const handleSetReverbWet = (e) => {
        getAudioGraphInstance().setReverbWet(parseFloat(e.target.value));
    }

    return (
        <div>
            <h3>Reverb Control</h3>
            <div>
                Reverb Wet: <input type="range" min="0" max="1" step="0.01"
                                   value={getAudioGraphInstance().store.getState().reverbWet}
                                   onChange={handleSetReverbWet} />
                {getAudioGraphInstance().store.getState().reverbWet.toFixed(2)}
            </div>
        </div>
    );
};
