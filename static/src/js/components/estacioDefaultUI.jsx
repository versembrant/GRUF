import { createElement, useState, useEffect } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, num2Norm, norm2Num, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import isequal from 'lodash.isequal'

const FloatParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue >= 5 ? parameterValue.toFixed(0) : parameterValue}</p>
            <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.01}
                value= {num2Norm(parameterValue, parameterDescription)}
                onInput={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Num(evt.target.value, parameterDescription))}/>
                </div>
    )
};

const TextParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <input
                type="text"
                style={{width: "100%"}}
                value={parameterValue}
                onInput={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, evt.target.value)} />
        </div>
    )
};

const EnumParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <select
                value={parameterValue}
                onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, evt.target.value)}>
                {parameterDescription.options.map((option, i) => <option key={option} value={option}>{option}</option>)}
            </select>
        </div>
    )
};

const BoolParameterDefaultWidget = ({ parameterDescription, parameterValue, nomEstacio }) => {
    return (
        <div>
            <label>
                <input
                    type="checkbox"
                    checked={parameterValue}
                    onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, evt.target.checked)} />
                {parameterDescription.label}
            </label>
        </div>
    )
};

const GridParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    const estacio = getCurrentSession().getEstacio(nomEstacio);
    const numRows = parameterDescription.numRows;
    const numSteps =  estacio.getNumSteps();
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElementsPerRow = []
    for (let i = 0; i < numRows; i++) {
        const stepsElements = []
        for (let j = 0; j < numSteps; j++) {
            const filledClass = indexOfArrayMatchingObject(parameterValue, {'i': i, 'j': j}) > -1 ? 'filled' : '';
            const activeStep = (currentStep == j && (getAudioGraphInstance().isPlayingLive() || (getAudioGraphInstance().isPlayingArranjement() && estacio.getCurrentLivePreset() === estacio.arranjementPreset ))) ? 'active' : '';
            stepsElements.push(
            <div 
                key={i + "_" + j} // To avoid React warning
                className={'step ' + filledClass + ' ' + activeStep}
                onMouseDown={(evt) => {
                    let updatedParameterValue = [...parameterValue]
                    const index = indexOfArrayMatchingObject(parameterValue, {'i': i, 'j': j});
                    if (index > -1){
                        updatedParameterValue.splice(index, 1);
                    } else {
                        updatedParameterValue.push({'i': i, 'j': j})
                    }
                    getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, updatedParameterValue)
                }}>
            </div>
            )
        }
        stepsElementsPerRow.push(stepsElements)
    }
    
    return (
        <div>
            <p>{parameterDescription.label}: {JSON.stringify(parameterValue)}</p>
            <div className="grid-default">
                {stepsElementsPerRow.map(function(stepsElements, i){
                    return <div className="grid-row-default" key={'row_' + i}>{stepsElements}</div>;
                })}
            </div>
            <div>
            <button onMouseDown={(evt)=>
                getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [])
            }>Clear</button>
            { parameterDescription.showRecButton && <label><input id={nomEstacio + '_' + parameterDescription.nom + '_REC'} type="checkbox"/>Rec</label> } 
            </div>
            
            {hasPatronsPredefinits(parameterDescription) &&
                (
                <div>
                Patró:
                <select 
                    defaultValue={getNomPatroOCap(parameterDescription, parameterValue)}
                    onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, getPatroPredefinitAmbNom(parameterDescription, evt.target.value))}
                >              
                    <option key="cap" value="Cap">Cap</option>
                    {parameterDescription.patronsPredefinits.map(patro => <option key={patro.nom} value={patro.nom}>{patro.nom}</option>)}
                </select>
                </div>
                )

            }
        </div>
    )
};

const PianoRollParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    const estacio = getCurrentSession().getEstacio(nomEstacio);
    const numSteps = estacio.getNumSteps();
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const uniqueId = estacio.nom + "_" + parameterDescription.nom
    let lastEditedData = "";
    
    useEffect(() => {
        const jsElement = document.getElementById(uniqueId + "_id")
        if (jsElement.dataset.alreadyBinded === undefined){
            jsElement.addEventListener("pianoRollEdited", evt => {
                const stringifiedData = JSON.stringify(evt.detail)
                if (!isequal(stringifiedData, lastEditedData)) {
                    handleSequenceEdited(evt.detail)
                    lastEditedData = stringifiedData // Save using stringified version to avoid using a reference. If using a reference, "isequal" above will always be true after the first iteration
                }
            });
            jsElement.dataset.alreadyBinded = true;
        }
        if (!isequal(jsElement.sequence, appSequenceToWidgetSequence(parameterValue))) {
            jsElement.sequence = appSequenceToWidgetSequence(parameterValue)
            jsElement.redraw()
        }
        if (currentStep >= 0) {
            jsElement.locate(currentStep);
        } else {
            jsElement.locate(-10);  // make it dissapear
        }
    })

    const appSequenceToWidgetSequence = (sequence) => {
        return sequence.map(value => {return {
            't': value.b,  // time in beats
            'n': value.n,  // midi note number
            'g': value.d,  // note duration in beats
            'f': value.s,  // note is selected
            'on': value.on,  // original note
            'ot': value.ob,  // original time
            'og': value.od,  // original duration
        }})
    }

    const widgetSequenceToAppSequence = (wSequence) => {
        return wSequence.map(value => {return {
            'b': value.t,  // beat position
            'n': value.n,  // midi note number
            'd': value.g,  // note duration in beats
            's': value.f,  // note is selected
            'on': value.on,  // original note
            'ob': value.ot,  // original time
            'od': value.og,  // original duration
        }})
    }

    const handleSequenceEdited = (widgetSequence) => {
        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, widgetSequenceToAppSequence(widgetSequence))
    }

    const instrumentRange = parameterDescription.notaMesAltaPermesa - parameterDescription.notaMesBaixaPermesa + 1 || 127;
    const maxYRange = 36;
    const doesYScroll = instrumentRange > maxYRange;

    const getLowestNoteForYOffset = () => {
        // if the roll doesn't scroll, simply return the lowest roll
        if (!doesYScroll) return parameterDescription.notaMesBaixaPermesa;

        // else, return the lowest drawn note, if there are any notes drawn on the roll
        if (parameterValue) return parameterValue.map(note => note.n).reduce((min, value) => Math.min(min, value));

        // else, return a sensible default, if it exists
        if (parameterDescription.notaMesBaixaTipica) return parameterDescription.notaMesBaixaTipica;

        return 0;
    }

    return (
        <div>
            <p>{parameterDescription.label}: {JSON.stringify(parameterValue)}</p>
            <div style={{overflow:"scroll"}}>
                <webaudio-pianoroll
                    id={uniqueId + "_id"}
                    width="600"
                    xrange={numSteps}
                    yrange={Math.min(instrumentRange, maxYRange)}
                    yoffset={getLowestNoteForYOffset()}
                    xruler={0}
                    markstart={-10}  // make it dissapear
                    markend={-10}  // make it dissapear
                    yscroll={doesYScroll ? 1 : 0} // only allow scroll when there is 'overflow'
                ></webaudio-pianoroll>
            </div>
            <button onMouseDown={(evt)=>
                getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [])
            }>Clear</button>
            { parameterDescription.showRecButton && <label><input id={nomEstacio + '_' + parameterDescription.nom + '_REC'} type="checkbox"/>Rec</label> } 
        </div>
    )
};


// Util function to create UI widgets for the default UIs
const creaUIWidgetPerParametre = (estacio, nomParametre) => {
    const parameterDescription = estacio.getParameterDescription(nomParametre);
    const parametreValorState = estacio.getParameterValue(nomParametre);
    const widgetUIClassParameterType = {
        float: FloatParameterDefaultWidget,
        enum: EnumParameterDefaultWidget,
        text: TextParameterDefaultWidget,
        grid: GridParameterDefaultWidget,
        bool: BoolParameterDefaultWidget,
        piano_roll: PianoRollParameterDefaultWidget
    }
    const widgetUIClass = widgetUIClassParameterType[parameterDescription.type]
    if (widgetUIClass === undefined) {
        return (<div key={estacio.nom + '_' + nomParametre}>
            <p>No UI widget for parameter type: {parameterDescription.type}</p>
        </div>);
    } else {
        return (
            createElement(
                widgetUIClass,
                {key:estacio.nom + '_' + nomParametre, parameterDescription:parameterDescription, parameterValue:parametreValorState, nomEstacio:estacio.nom},
                null
            )
        );
    }
}

export const EstacioDefaultUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal
    
    const parametresElements = [];
    estacio.getParameterNames().forEach(nomParametre => {
        parametresElements.push(creaUIWidgetPerParametre(estacio, nomParametre));
    });

    return (<div key={estacio.nom} className="estacio-default">
        <div>
            <button className="btn-petit" onClick={(evt) => {setEstacioSelected(undefined)}}>Canvia d'estació</button>
            <div className="preset-buttons grid-default">
                <div className="grid-row-default">
                    {[...Array(estacio.numPresets).keys()].map(i => 
                    <div key={"preset_" + i}
                        className={"step" + (getCurrentSession().getLivePresetsEstacions()[estacio.nom] == i ? " filled": "")}
                        onClick={(evt) => {getCurrentSession().setLivePresetForEstacio(estacio.nom, i)}}>
                            {i}
                    </div>
                    )}
                </div>
            </div>
            <h2>{ estacio.nom }</h2>
            <p>Tipus: { estacio.tipus }</p>
        </div>
        <div>
            {parametresElements}
        </div>
    </div>)
};