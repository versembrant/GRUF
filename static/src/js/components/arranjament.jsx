import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { AudioTransportControlsComputer } from "../components/audioTransport";


export const Arranjament = ({setEstacioSelected}) => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    handleClearClips = () => {
        const clipIDs = getCurrentSession().getArranjamentClips().map(clip => clip.id);
        getCurrentSession().arranjamentEliminarClips(clipIDs);
    }

    const getClipPerBeatIEstacio = (nomEstacio, beat) => {
        const clip = arranjamentClips.find(clip => clip.estacio === nomEstacio && clip.beatInici <= beat && clip.beatInici + clip.duradaBeats > beat);
        if (clip) {
            return clip;
        } else {
            return undefined;
        }
    }

    const arranjament = getCurrentSession().getArranjament()
    const arranjamentClips = getCurrentSession().getArranjamentClips()
    const nomsEstacions = getCurrentSession().getNomsEstacions()
    const numRows = nomsEstacions.length
    const numSteps = arranjament.numSteps
    const beatsPerStep =arranjament.beatsPerStep
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep();

    const stepsElementsPerEstacio = []
    for (let i = 0; i < numRows; i++) {
        const stepsElements = []
        for (let j = 0; j < numSteps; j++) {
            const clip = getClipPerBeatIEstacio(nomsEstacions[i], j * beatsPerStep) 
            const preset = clip ? clip.preset : -1;
            const filledClass = preset > -1 ? 'filled' : '';
            const activeStep = getAudioGraphInstance().isPlayingArranjement() && (currentStep >= j * beatsPerStep && currentStep < (j  + 1) * beatsPerStep) ? 'active' : '';
            stepsElements.push(
            <div 
                key={i + "_" + j} // To avoid React warning
                className={'step ' + filledClass + ' ' + activeStep}
                onMouseDown={(evt) => {
                    // TODO: increase preset by 1 (and cycle presets if needed)
                    const estacio = getCurrentSession().getEstacio(nomsEstacions[i]);
                    let nextPreset = preset + 1;
                    if (nextPreset > estacio.numPresets) {
                        nextPreset = -1;
                    }
                    if (nextPreset > -1){
                        getCurrentSession().arranjamentAfegirClips([{
                            'id': clip ? clip.id : Date.now(),
                            'estacio': estacio.nom,
                            'beatInici': j * beatsPerStep,
                            'duradaBeats': beatsPerStep,
                            'preset': nextPreset
                        }]);
                    } else {
                        getCurrentSession().arranjamentEliminarClips([clip.id]);
                    }

                }}>
            {preset > -1 ? preset : ''}
            </div>
            )
        }
        stepsElementsPerEstacio.push(stepsElements)
    }

    return (
        <div className="arranjament">
            <div>
                <button className="btn btn-petit" onClick={(evt) => {setEstacioSelected(undefined)}}>Canvia d'estació</button>
                <h1>Computer</h1>
                <AudioTransportControlsComputer/>
                <br/>
                <div className="grid-default">
                    {stepsElementsPerEstacio.map(function(stepsElements, i){
                        return <div className="grid-row-default" key={'row_' + i}>{stepsElements}{nomsEstacions[i]}</div>;
                    })}
                </div>
            </div>
            <div>
                <button onClick={handleClearClips}>Eliminar cips</button><br/>
                {JSON.stringify(getCurrentSession().getArranjamentClips())}
            </div>
        </div>
    )
};