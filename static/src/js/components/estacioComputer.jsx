import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges, getPatternPresetDisplayName } from "../utils";
import { SpectrumGraph, GrufCanviaInstrument } from "../components/widgets";
import { AudioTransportPlayStop } from "./audioTransport"

export const EstacioComputerUI = ({setEstacioSelected}) => {
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
            const estacioClasses = "estacio-" + getCurrentSession().getEstacio(nomsEstacions[i]).tipus + " computer-step"
            const activeStep = getAudioGraphInstance().isPlayingArranjament() && (currentStep >= j * beatsPerStep && currentStep < (j  + 1) * beatsPerStep) ? 'active' : '';
            stepsElements.push(
            <div 
                key={i + "_" + j} // To avoid React warning
                className={'step ' + filledClass + ' ' + activeStep + ' ' + estacioClasses}
                onMouseDown={(evt) => {
                    // TODO: increase preset by 1 (and cycle presets if needed)
                    const estacio = getCurrentSession().getEstacio(nomsEstacions[i]);
                    let nextPreset = preset + 1;
                    if (nextPreset >= estacio.numPresets) {
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
            {preset > -1 ? getPatternPresetDisplayName(preset + 1) : ''}
            </div>
            )
        }
        stepsElementsPerEstacio.push(stepsElements)
    }

    return (<div key="computer1" className="estacio estacio-computer">
        <div className="estacio-main p-4">
            <div className="flex justify-between" style={{ marginBottom: 20}}>
                <div></div>
                <GrufCanviaInstrument setEstacioSelected={setEstacioSelected}/>
            </div>
            <div className="flex flex-col gap-10 items-center p-10">
                <div className="modul-border flex gap-10 flex-col p-4">
                    <div className="flex justify-between">
                        <div className="flex gap-5">
                            <AudioTransportPlayStop playMode="arranjament" />
                        </div>
                        <button className="btn-vermell btn-petit" onClick={handleClearClips} title="Esborra arranjament">Esborra</button>
                    </div>
                    <div className="grid-computer">
                        {stepsElementsPerEstacio.map(function(stepsElements, i){
                            return <div className="grid-row-computer" key={'row_' + i}><div className="estacio-nom">{nomsEstacions[i]}</div>{stepsElements}</div>;
                        })}
                    </div>
                </div>
                <SpectrumGraph />
            </div>
        </div>
    </div>)
};