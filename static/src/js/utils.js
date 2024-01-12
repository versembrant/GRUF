import { io } from 'socket.io-client';
import { createElement, useState, useEffect} from "react";
import { FloatParameterDefaultWidget, EnumParameterDefaultWidget, TextParameterDefaultWidget, StepsParameterDefaultWidget, GridParameterDefaultWidget } from './components/defaultUIParameterWidgets';


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

// IndexOf like function for arrays of arrays (useful for "grid" parameter type)
/*
E.g.:
indexOfArray([[1,1], [2,3]], [1,1]) = 0
indexOfArray([[1,1], [2,3]], [2,3]) = 1
indexOfArray([[1,1], [2,3]], [3,3]) = -1
*/
export const indexOfArray = (arrayOfArrays, targetArray) => {
    for (let i = 0; i < arrayOfArrays.length; i++) {
        let isMatch = true;
        for (let j = 0; j < targetArray.length; j++) {
            if (arrayOfArrays[i][j] !== targetArray[j]) {
                isMatch = false;
                break;
            }
        }
        if (isMatch) {
            return i;
        }
    }
    return -1;  
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
        steps: StepsParameterDefaultWidget,
        grid: GridParameterDefaultWidget
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

