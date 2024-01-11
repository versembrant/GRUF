import { io } from 'socket.io-client';
import { createElement} from "react";
import { getCurrentSession } from './sessionManager';
import { getAudioGraphInstance } from './audioEngine';


// Export socket object to be used by other modules and communicate with server
export const socket = io();

socket.on('message', function (message) {
    console.log(message);
});


// Make sure numeric value is within min/max boundaries
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Make sure enum value is within options
export const ensureValueInOptions = (value, options, defaultValue) => {
    if (!options.includes(value)) {
        if (defaultValue === undefined) {
            return options[0];
        } else {
            return defaultValue;
        }
    }
    return value;
}

// Util function to ensure value is valid for parameter type
export const ensureValidValue = (value, parameterDescription) => {
    if (parameterDescription.type === 'float') {
        return clamp(value, parameterDescription.min, parameterDescription.max);
    } else if (parameterDescription.type === 'enum') {
        return ensureValueInOptions(value, parameterDescription.options, parameterDescription.initial);
    }
    return value;
}

// Util function to create UI widgets for the default UIs

export const creaUIWidgetPerParametre = (estacio, nomParametre) => {

    const parameterDescription = estacio.getParameterDescription(nomParametre);
    const parametreValorState = estacio.getParameterValue(nomParametre);

    if (parameterDescription.type === 'float') {
        return (
            createElement(
                'div',
                null,
                createElement('p', null, parameterDescription.label + ': ', parametreValorState),
                createElement(
                    'input',
                    {'type': 'range', 'min': parameterDescription.min, 'max': parameterDescription.max, 'step': parameterDescription.step || 0.05, 'value': parametreValorState, onInput: (evt) => getCurrentSession().updateParametreEstacioInServer(estacio.nom, nomParametre, evt.target.value)},
                    null
                )
            )
        );
    } else if (parameterDescription.type === 'enum') {
        const opcionsElements = [] 
        parameterDescription.options.forEach(option => {
            opcionsElements.push(createElement('option', {value: option}, option),)
        });
        return (
            createElement(
                'div',
                null,
                createElement('p', null, parameterDescription.label + ': ', parametreValorState),
                createElement(
                    'select',
                    {'value': parametreValorState, onChange: (evt) => getCurrentSession().updateParametreEstacioInServer(estacio.nom, nomParametre, evt.target.value)},
                    ...opcionsElements
                )
            )
        );
    } else if (parameterDescription.type === 'text') {
        return (
            createElement(
                'div',
                null,
                createElement('p', null, parameterDescription.label + ': ', parametreValorState),
                createElement(
                    'input',
                    {'type': 'text', 'value': parametreValorState, onInput: (evt) => getCurrentSession().updateParametreEstacioInServer(estacio.nom, nomParametre, evt.target.value)},
                    null
                )
            )
        );
    } else if (parameterDescription.type === 'steps') {
        const stepsElements = []
        const numSteps = parameterDescription.initial.length;
        const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
        for (let i = 0; i < numSteps; i++) {
            const filledClass = parametreValorState[i] == 1.0 ? 'filled' : '';
            const activeStep = currentStep == i ? 'active' : '';
            stepsElements.push(createElement(
                    'div', 
                    {className: 'step ' + filledClass + ' ' + activeStep, onClick: (evt) => {  //
                        var updatedSteps = [...parametreValorState];
                        if (updatedSteps[i] == 1.0) {
                            updatedSteps[i] = 0.0;
                        } else {
                            updatedSteps[i] = 1.0;
                        }
                        getCurrentSession().updateParametreEstacioInServer(estacio.nom, nomParametre, updatedSteps)}
                    }, 
                    null
                )
            )
        }
        return createElement(
            'div',
            null,
            createElement('p', null, parameterDescription.label + ': ', parametreValorState.join(',')),
            createElement('div', {className: 'steps-default'}, ...stepsElements)
        );
    } else {
        return createElement('div', null, 'Tipus de paràmetre no suportat');
    }
}

