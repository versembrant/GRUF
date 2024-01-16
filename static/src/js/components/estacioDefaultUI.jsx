import { createElement } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArray } from "../utils";

const FloatParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div key={nomEstacio + '_' + parameterDescription.nom}>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <input
                type="range"
                min={parameterDescription.min}
                max={parameterDescription.max}
                step={parameterDescription.step || 0.05}
                value={parameterValue}
                onInput={(evt) => getCurrentSession().updateParametreEstacio(nomEstacio, parameterDescription.nom, evt.target.value)} />
        </div>
    )
};

const TextParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div key={nomEstacio + '_' + parameterDescription.nom}>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <input
                type="text"
                value={parameterValue}
                onInput={(evt) => getCurrentSession().updateParametreEstacio(nomEstacio, parameterDescription.nom, evt.target.value)} />
        </div>
    )
};

const EnumParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div key={nomEstacio + '_' + parameterDescription.nom}>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <select
                value={parameterValue}
                onChange={(evt) => getCurrentSession().updateParametreEstacio(nomEstacio, parameterDescription.nom, evt.target.value)}>
                {parameterDescription.options.map((option, i) => <option key={option} value={option}>{option}</option>)}
            </select>
        </div>
    )
};

const GridParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    const numRows = parameterDescription.numRows;
    const numSteps = parameterDescription.numCols;
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElementsPerRow = []
    for (let i = 0; i < numRows; i++) {
        const stepsElements = []
        for (let j = 0; j < numSteps; j++) {
            const filledClass = indexOfArray(parameterValue, [i, j]) > -1 ? 'filled' : '';
            const activeStep = currentStep == j ? 'active' : '';
            stepsElements.push(
            <div 
                key={i + "_" + j} // To avoid React warning
                className={'step ' + filledClass + ' ' + activeStep}
                onClick={(evt) => {
                    let updatedParameterValue = [...parameterValue]
                    const index = indexOfArray(parameterValue, [i, j]);
                    if (index > -1){
                        updatedParameterValue.splice(index, 1);
                    } else {
                        updatedParameterValue.push([i, j])
                    }
                    getCurrentSession().updateParametreEstacio(nomEstacio, parameterDescription.nom, updatedParameterValue)
                }}>
            </div>
            )
        }
        stepsElementsPerRow.push(stepsElements)
    }
    
    return (
        <div key={nomEstacio + '_' + parameterDescription.nom}>
            <p>{parameterDescription.label}: {parameterValue.join('|')}</p>
            <div className="grid-default">
                {stepsElementsPerRow.map(function(stepsElements, i){
                    return <div className="grid-row-default" key={'row_' + i}>{stepsElements}</div>;
                })}
            </div>
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
                {parameterDescription:parameterDescription, parameterValue:parametreValorState, nomEstacio:estacio.nom},
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
        <h2>{ estacio.nom }</h2>
        <p>Tipus: { estacio.tipus }</p>
        <div>
            {parametresElements}
        </div>
    </div>)
};