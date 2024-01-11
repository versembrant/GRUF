import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from "../audioEngine";
import { createElement } from "react";


export const FloatParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <input
                type="range"
                min={parameterDescription.min}
                max={parameterDescription.max}
                step={parameterDescription.step || 0.05}
                value={parameterValue}
                onInput={(evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, parameterDescription.nom, evt.target.value)} />
        </div>
    )
};


export const TextParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <input
                type="text"
                value={parameterValue}
                onInput={(evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, parameterDescription.nom, evt.target.value)} />
        </div>
    )
};


export const EnumParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <select
                value={parameterValue}
                onChange={(evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, parameterDescription.nom, evt.target.value)}>
                {parameterDescription.options.map((option, index) => <option value={option}>{option}</option>)}
            </select>
        </div>
    )
};


export const StepsParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    const numSteps = parameterDescription.initial.length;
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElements = []
    for (let i = 0; i < numSteps; i++) {
        const filledClass = parameterValue[i] == 1.0 ? 'filled' : '';
        const activeStep = currentStep == i ? 'active' : '';
        stepsElements.push(<div 
            className={'step ' + filledClass + ' ' + activeStep}
            onClick={(evt) => {  //
                var updatedSteps = [...parameterValue];
                if (updatedSteps[i] == 1.0) {
                    updatedSteps[i] = 0.0;
                } else {
                    updatedSteps[i] = 1.0;
                }
                getCurrentSession().updateParametreEstacioInServer(nomEstacio, parameterDescription.nom, updatedSteps)
            }}></div>)
    }
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue.join(',')}</p>
            <div class="steps-default">
                {stepsElements}
            </div>
        </div>
    )
};