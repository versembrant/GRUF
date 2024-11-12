import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { handlePlayArranjementButton } from "../components/audioTransport";
import { GrufButtonBorder, SpectrumGraph } from "../components/widgets";

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
            const activeStep = getAudioGraphInstance().isPlayingArranjement() && (currentStep >= j * beatsPerStep && currentStep < (j  + 1) * beatsPerStep) ? 'active' : '';
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
            {preset > -1 ? preset + 1 : ''}
            </div>
            )
        }
        stepsElementsPerEstacio.push(stepsElements)
    }

    return (<div key="computer1" className="estacio estacio-computer">
        <div className="estacio-main">
            <div className="estacio-computer-container grid gap-10 p-4">
                <fieldset className="computer-header flex flex-row  col-start-1 row-start-1 col-span-3">
                    <fieldset className="flex flex-row items-center gap-10" style={{width: 775}}>
                        <button disabled={!getAudioGraphInstance().isGraphBuilt()} className="btn-petit" style={{height:35, padding: "8px 10px"}} onClick={handlePlayArranjementButton}>{getAudioGraphInstance().isPlaying() ? <img height="16px" src={getAudioGraphInstance().isPlayingArranjement() ? (appPrefix + "/static/src/img/stop_button_grid.svg"): (appPrefix + "/static/src/img/stop_button.svg")}/> : <img height="16px" src={appPrefix + "/static/src/img/play_button_grid.svg"}/>}</button>
                        <GrufButtonBorder text="Elimina arranjament" onClick={handleClearClips}/>      
                    </fieldset>
                    <GrufButtonBorder text="Canvia estació" onClick={() => {setEstacioSelected(undefined)}} />
                </fieldset>
                <fieldset className="computer-widgets">
                    <div className="grid-computer">
                        {stepsElementsPerEstacio.map(function(stepsElements, i){
                            return <div className="grid-row-computer" key={'row_' + i}><div className="estacio-nom">{nomsEstacions[i]}</div>{stepsElements}</div>;
                        })}
                    </div>
                    <SpectrumGraph />
                </fieldset>
            </div>
        </div>
    </div>)
};