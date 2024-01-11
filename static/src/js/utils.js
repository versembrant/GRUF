import { io } from 'socket.io-client';
import { createElement, useState, useEffect} from "react";
import { getCurrentSession } from './sessionManager';
import { getAudioGraphInstance } from './audioEngine';
import { FloatParameterDefaultWidget, EnumParameterDefaultWidget, TextParameterDefaultWidget, StepsParameterDefaultWidget } from './components/defaultUIParameterWidgets';


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

// Util function to subscribe a react component to changes of a redux store of an object
export const subscribeToStoreChanges = (objectWithStore) => {
    const [_, setState] = useState(objectWithStore.store.getState());
    useEffect(() => {
        const unsubscribe = objectWithStore.store.subscribe(() => {
            setState(objectWithStore.store.getState());
        });
        return () => unsubscribe();
    }, [setState]);
}


// Util function to create UI widgets for the default UIs
export const creaUIWidgetPerParametre = (estacio, nomParametre) => {
    const parameterDescription = estacio.getParameterDescription(nomParametre);
    const parametreValorState = estacio.getParameterValue(nomParametre);
    const widgetUIClassParameterType = {
        float: FloatParameterDefaultWidget,
        enum: EnumParameterDefaultWidget,
        text: TextParameterDefaultWidget,
        steps: StepsParameterDefaultWidget
    }
    const widgetUIClass = widgetUIClassParameterType[parameterDescription.type]
    if (widgetUIClass === undefined) {
        return createElement(
            'div',
            null,
            createElement('p', null, 'No UI widget for parameter type: ', parameterDescription.type)
        );
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

