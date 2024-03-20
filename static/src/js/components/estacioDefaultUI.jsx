import { createElement } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArray, real2Norm, norm2Real } from "../utils";

const FloatParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue >= 5 ? parameterValue.toFixed(0) : parameterValue}</p>
            <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.01}
                value= {real2Norm(parameterValue, parameterDescription)} 
                onInput={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.target.value, parameterDescription))}/> 
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

const GridParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    const estacio = getCurrentSession().getEstacio(nomEstacio);
    const numRows = parameterDescription.numRows;
    const numSteps = parameterDescription.numCols;
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElementsPerRow = []
    for (let i = 0; i < numRows; i++) {
        const stepsElements = []
        for (let j = 0; j < numSteps; j++) {
            const filledClass = indexOfArray(parameterValue, [i, j]) > -1 ? 'filled' : '';
            console.log()
            const activeStep = (currentStep == j && (getAudioGraphInstance().isPlayingLive() || (getAudioGraphInstance().isPlayingArranjement() && estacio.getCurrentLivePreset() === estacio.arranjementPreset ))) ? 'active' : '';
            stepsElements.push(
            <div 
                key={i + "_" + j} // To avoid React warning
                className={'step ' + filledClass + ' ' + activeStep}
                onMouseDown={(evt) => {
                    let updatedParameterValue = [...parameterValue]
                    const index = indexOfArray(parameterValue, [i, j]);
                    if (index > -1){
                        updatedParameterValue.splice(index, 1);
                    } else {
                        updatedParameterValue.push([i, j])
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
            <p>{parameterDescription.label}: {parameterValue.join('|')}</p>
            <div className="grid-default">
                {stepsElementsPerRow.map(function(stepsElements, i){
                    return <div className="grid-row-default" key={'row_' + i}>{stepsElements}</div>;
                })}
            </div>
            <div>
            <button onMouseDown={(evt)=>
                getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [])
            }>Clear</button>
            </div>
        </div>
    )
};

// Util function to create UI widgets for the default UIs
const creaUIWidgetPerParametre = (estacio, nomParametre) => {
    const parameterDescription = estacio.getParameterDescription(nomParametre);
    const parametreValorState = estacio.getParameterValue(nomParametre, estacio.getCurrentLivePreset());
    const widgetUIClassParameterType = {
        float: FloatParameterDefaultWidget,
        enum: EnumParameterDefaultWidget,
        text: TextParameterDefaultWidget,
        grid: GridParameterDefaultWidget
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

export const EstacioDefaultUI = ({estacio}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal
    
    const parametresElements = [];
    estacio.getParameterNames().forEach(nomParametre => {
        parametresElements.push(creaUIWidgetPerParametre(estacio, nomParametre));
    });

    return (<div key={estacio.nom}>
        <div>
            <div className="preset-buttons grid-default">
                <div className="grid-row-default">
                    {[...Array(estacio.numPresets).keys()].map(i => 
                    <div key={"preset_" + i}
                        className={"step" + (getCurrentSession().getLivePresetsEstacions()[estacio.nom] == i ? " filled": "")}
                        onClick={(evt) => {getCurrentSession().liveSetPresetForEstacio(estacio.nom, i)}}>
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