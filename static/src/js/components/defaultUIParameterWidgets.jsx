import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from "../audioEngine";


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
    const numSteps = parameterDescription.numSteps;
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElements = []
    for (let i = 0; i < numSteps; i++) {
        const filledClass = parameterValue.includes(i) ? 'filled' : '';
        const activeStep = currentStep == i ? 'active' : '';
        stepsElements.push(
        <div 
            className={'step ' + filledClass + ' ' + activeStep}
            onClick={(evt) => {
                let updatedParameterValue = [...parameterValue]
                if (parameterValue.includes(i)){
                    updatedParameterValue.splice(parameterValue.indexOf(i), 1);
                } else {
                    updatedParameterValue.push(i)
                }
                getCurrentSession().updateParametreEstacioInServer(nomEstacio, parameterDescription.nom, updatedParameterValue)
            }}>
        </div>
        )
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