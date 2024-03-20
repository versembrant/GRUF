import { createRoot } from "react-dom/client";
import { createElement, useState, useEffect, StrictMode } from "react";

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

// IndexOf like function for arrays of arrays
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

// IndexOf like function that returns the index of an element in an arrays of objects if such element exists that matches all 
// the given properties of the target object. Not that the matched element can contain more properties that those provided.
/*
E.g.:
indexOfArrayMatchingObject([{a: 'a', b: 'b'}, {a: 'c', b: 'd'}], {a: 'a', b: 'b'}) = 0
indexOfArrayMatchingObject([{a: 'a', b: 'b'}, {a: 'c', b: 'd', c: 'c'}], {a: 'c', b: 'd'}) = 1
indexOfArrayMatchingObject([{a: 'a', b: 'b'}, {a: 'c', b: 'd', c: 'c'}], {a: 'c', b: 't'}) = -1
*/
export const indexOfArrayMatchingObject = (arrayOfObjects, targetObjetProperties) => {
    for (let i = 0; i < arrayOfObjects.length; i++) {
        // Iterate over key and values of targetObjetProperties and see if they match that of arrayOfObjects[i]
        let isMatch = true;
        for (let key in targetObjetProperties) {
            if (arrayOfObjects[i][key] !== targetObjetProperties[key]) {
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

// Util function to render a react component in a DOM element
export const renderReactComponentInElement = (reactComponent, elementID, props={}, reactRoot=undefined) => {
    let root = reactRoot
    if (reactRoot === undefined) {
        root = createRoot(document.getElementById(elementID))
    }
    root.render(
        createElement(StrictMode, null, createElement(reactComponent, props))
    );
    return root;
}

const exponent = 2;

export const norm2Real = (x, parameterDescription) => {
    if(parameterDescription.logarithmic){
        return Math.pow(x, exponent)*(parameterDescription.max-parameterDescription.min)+parameterDescription.min;
    }else{
        return x * (parameterDescription.max-parameterDescription.min) + parameterDescription.min;
    }
}

export const real2Norm = (x, parameterDescription) => {
    if(parameterDescription.logarithmic){
        return Math.pow((x - parameterDescription.min)/(parameterDescription.max-parameterDescription.min), 1/exponent);
    }else{
        return (x - parameterDescription.min)/(parameterDescription.max-parameterDescription.min);
    }
}

// Util function to check if a beat is a swing beat
export const necessitaSwing = (numeroBeat) => {
    return ((numeroBeat - 2) % 4) == 0
}