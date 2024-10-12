import { createRoot } from "react-dom/client";
import { createElement, useState, useEffect, StrictMode } from "react";
import { getAudioGraphInstance } from './audioEngine';


export const buildAudioGraphIfNotBuilt = async () => {  
    if (!getAudioGraphInstance().isGraphBuilt()) {
        await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
        getAudioGraphInstance().buildAudioGraph();  // Only build audio graph the first time "play" is pressed
    }
}

export const capitalize = (string) => {
    return string.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export const  capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const sample = (arr, sampleSize=1) => {
    if (sampleSize > arr.length) {
        throw new Error("Sample size cannot be larger than the array size");
    }

    const sampledItems = new Set();
    
    while (sampledItems.size < sampleSize) {
        const randomIndex = Math.floor(Math.random() * arr.length);
        sampledItems.add(arr[randomIndex]);
    }
    
    if (sampleSize === 1) return [...sampledItems][0];
    return [...sampledItems];
}

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

// Util function to subscribe a react component to partial changes of a store
export const subscribeToPartialStoreChanges = (objectWithStore, storeFilter) => {
    const partialStore = objectWithStore.store.getPartial(storeFilter)
    const [, setState] = useState(partialStore.getState());
    useEffect(() => {
        const unsubscribe = partialStore.subscribe(() => {
            setState(partialStore.getState());
        });
        return () => {
            unsubscribe()};
    }, [setState, storeFilter]);
}

// Util function to subscribe a react component to changes of a change of a parameter of a estacio
export const subscribeToEstacioParameterChanges = (estacio, nomParametre) => {
    return subscribeToPartialStoreChanges(estacio, nomParametre);
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

// Parameter range conversions
const exponent = 2;

export const norm2Num = (normValue, parameterDescription) => {
    const numMin = getParameterNumericMin(parameterDescription);
    const numMax = getParameterNumericMax(parameterDescription);

    if(!parameterDescription.logarithmic) return normValue * (numMax-numMin) + numMin;
    return Math.pow(normValue, exponent)*(numMax-numMin)+numMin;
}

export const num2Norm = (numValue, parameterDescription) => {
    const numMin = getParameterNumericMin(parameterDescription);
    const numMax = getParameterNumericMax(parameterDescription);

    if(!parameterDescription.logarithmic) return (numValue - numMin)/(numMax-numMin);
    return Math.pow((numValue - numMin)/(numMax-numMin), 1/exponent);
}

export const real2Num = (realValue, parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return realValue;
        case 'enum':
            return parameterDescription.options.indexOf(realValue);
        default:
            throw new Error(`Unknown parameter type: ${parameterDescription.type}`);
    }
}

export const num2Real = (numValue, parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return numValue;
        case 'enum':
            return parameterDescription.options[Math.round(numValue)];
        default:
            throw new Error(`Unknown parameter type: ${parameterDescription.type}`);
    }
}

export const getParameterNumericMin = (parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return parameterDescription.min;
        case 'enum':
            return 0;
        default:
            throw new Error(`Unknown parameter type: ${parameterDescription.type}`);
    }
}

export const getParameterNumericMax = (parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return parameterDescription.max;
        case 'enum':
            return parameterDescription.options.length - 1;
        default:
            throw new Error(`Unknown parameter type: ${parameterDescription.type}`);
    }
}

// Util function to check if a beat is a swing beat
export const necessitaSwing = (numeroBeat) => {
    return ((numeroBeat - 2) % 4) == 0
}

const esMateixPatro = (patro1, patro2) => {
    // TODO: tenir en compte l'ordre en què està escrit el patró
    if (patro1.length != patro2.length) return false;
    for (let posicio = 0; posicio < patro1.length; posicio++){
        const i_patro1 = patro1[posicio].i;
        const i_patro2 = patro2[posicio].i;
        const j_patro1 = patro1[posicio].j;
        const j_patro2 = patro2[posicio].j;
        if (i_patro1 !== i_patro2 || j_patro1 !== j_patro2) return false;
    }
    return true;
}

export const hasPatronsPredefinits = (parameterDescription) => {
    // Retorna true si la descripció del paràmetre conté patrons predefintis
    if (parameterDescription.patronsPredefinits !== undefined) {
        return true;
    } else {
        return false;
    }
}

export const getNomPatroOCap = (parameterDescription, patroActual) => {
    // Donat un patró, comprova si es correspon amb algun dels patrons predefinits i
    // retorna el nom del patró si és el cas. Si no es correspon amb cap patró, retorna "Cap"
    if (hasPatronsPredefinits(parameterDescription)) {
        for (let i in parameterDescription.patronsPredefinits){
            if (esMateixPatro(parameterDescription.patronsPredefinits[i].patro, patroActual)){
                return parameterDescription.patronsPredefinits[i].nom;
            };
        }
    }
    return 'Cap'
};

export const getPatroPredefinitAmbNom = (parameterDescription, nomPatro) => {
    // Donat el nom d'un patró, retorna el patró corresponent si hi és dins la llista
    // de patrons predefinits, sino retorna un patro buit.
    if (hasPatronsPredefinits(parameterDescription)) {
        for (let i in parameterDescription.patronsPredefinits){
            if (parameterDescription.patronsPredefinits[i].nom === nomPatro) {
                return parameterDescription.patronsPredefinits[i].patro;
            }
        }
    }
    return []
}

// URL params utils

export const getURLParamValue = (paramName, defaultValue) => {
    var queryString = location.search
    let params = new URLSearchParams(queryString)
    if (!params.has(paramName)) {
        return defaultValue
    }
    return params.get(paramName)
}

export const removeURLParam = (paramName) => {
    let url = new URL(window.location.href)
    let params = new URLSearchParams(url.search.slice(1))
    if (params.has(paramName)) {
        params.delete(paramName)
        let newUrl = window.location.pathname;
        if (`${params}` !== '' || window.location.hash !== '') {
            newUrl += `?${params}${window.location.hash}`
        }
        window.history.replaceState(null, null, newUrl)
    }    
}

export const units = {
    second: 's',
    hertz: 'Hz',
    decibel: 'dB',
    percent: '%'
}