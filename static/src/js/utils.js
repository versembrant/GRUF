import * as Tone from 'tone';
import { createRoot } from "react-dom/client";
import { createElement, useState, useEffect, StrictMode } from "react";
import { getCurrentSession } from './sessionManager';
import { getAudioGraphInstance } from './audioEngine';
import { sampleLibrary} from "./sampleLibrary";


export const buildAudioGraphIfNotBuilt = async () => {  
    if (!getAudioGraphInstance().isGraphBuilt()) {
        //await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
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

// based on https://github.com/trekhleb/javascript-algorithms/tree/master/src/algorithms/statistics/weighted-random
export const weightedSample = (items, weights) => {
    if (items.length !== weights.length) throw new Error('Items and weights must be of the same size');
    if (!items.length) throw new Error('Items must not be empty');

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0); // Calculate the total sum of weights.
    const threshold = totalWeight * Math.random();
  
    let cumulative = 0;
    for (let i = 0; i < items.length; i++) {
      cumulative += weights[i];
      if (cumulative >= threshold) return items[i];
    }
}

export const roundToStep = (value, step) => {
    if (step === undefined || step === 0) return value;
    return Math.round(value / step) * step;
}

// Make sure numeric value is within min/max boundaries
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const lerp = (value1, value2, t) => value1 + (value2-value1) * t;

export const distanceToAbsolute = (distanceArray, startOffset=0) => {
    return distanceArray.reduce((absoluteArray, distanceValue, index) => {
        const absoluteValue = distanceValue + (absoluteArray[index]);
        absoluteArray.push(absoluteValue);
        return absoluteArray;
    }, [startOffset])
}

export const absoluteToDistance = (absoluteArray) => {
    return absoluteArray.slice(1).reduce((distanceArray, absoluteValue, index) => {
        const distanceValue = absoluteValue - absoluteArray[index];
        distanceArray.push(distanceValue);
        return distanceArray;
    }, []);
}

// the good old http://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf
export const euclid = (pulses, steps, offset=0) => {
    if (pulses > steps) throw new Error(`More pulses (${pulses}) than steps (${steps})!`);

    const bjorklundArray = Array(steps);
	let lastTruncated = 0;
	for (let i = 1; i <= steps; i++) {	
		const truncatedValue = Math.floor((i * pulses)/steps);
		const bjorklundValue = truncatedValue - lastTruncated;
		lastTruncated = truncatedValue;
		
		const index = (i==steps) ? 0 : i;	// puts the last element first
		bjorklundArray[index] = bjorklundValue;
	}

    const rotatedBjorklund = rotateArray(bjorklundArray, offset);
    const euclidAbsolute = rotatedBjorklund.map((value, index)=>value == 1 ? value*index : undefined).filter(item=>item!==undefined);
	const euclidArray = absoluteToDistance([...euclidAbsolute, steps]);
	return euclidArray;
}

const rotateArray = (array, rotation) => {
    const n = array.length;
    const rotatedArray = Array(n);
    
    //	Check for sanity
    rotation = (rotation % n + n) % n;
    
    for (let i = 0; i < n; i++) {
        const element = array[i];
        const newIndex = (i + rotation) % n;
        rotatedArray[newIndex] = element;
    }
    return rotatedArray;
}

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
    if (estacio.getParameterDescription(nomParametre).live) return subscribeToPartialStoreChanges(getCurrentSession(), 'live');
    return subscribeToPartialStoreChanges(estacio, nomParametre);
}

export const subscribeToAudioGraphParameterChanges = (nomParametre) => {
    return subscribeToPartialStoreChanges(getAudioGraphInstance(), nomParametre);
}

export const subscribeToParameterChanges = (parameterParent, nomParametre) => {
    if (parameterParent === getAudioGraphInstance()) return subscribeToAudioGraphParameterChanges(nomParametre);
    else return subscribeToEstacioParameterChanges(parameterParent, nomParametre)
}

export const subscribeToPresetChanges = () => {
    subscribeToPartialStoreChanges(getCurrentSession(), 'live');
}

// Function for widgets to have a single interface to update any parameter
export const updateParametre = (parameterParent, parameterName, value) => {
    if (parameterParent === getAudioGraphInstance()) parameterParent.updateParametreAudioGraph(parameterName, value);
    else parameterParent.updateParametreEstacio(parameterName, value);
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

const throwUnknownParameterError = (parameterDescription) => {
    throw new Error(`Unknown parameter type (${parameterDescription.type}) for parameter ${parameterDescription.nom}`);
}

export const real2Num = (realValue, parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return realValue;
        case 'enum':
            return parameterDescription.options.indexOf(realValue);
        default: throwUnknownParameterError(parameterDescription);
    }
}

export const num2Real = (numValue, parameterDescription) => {
    const discreteValue = roundToStep(numValue, getParameterStep(parameterDescription));
    switch(parameterDescription.type) {
        case 'float':
            return discreteValue;
        case 'enum':
            return parameterDescription.options[discreteValue];
        default: throwUnknownParameterError(parameterDescription);
    }
}

export const getParameterNumericMin = (parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return parameterDescription.min;
        case 'enum':
            return 0;
        default: throwUnknownParameterError(parameterDescription);
    }
}

export const getParameterNumericMax = (parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return parameterDescription.max;
        case 'enum':
            return parameterDescription.options.length - 1;
        default: throwUnknownParameterError(parameterDescription);
    }
}

export const real2String = (realValue, parameterDescription) => {
    let displayValue = realValue;
    
    if (parameterDescription.type === 'float') {
        const valueTenExponent = Math.floor(realValue) === 0 ? 1 : Math.floor(Math.log10(Math.abs(realValue))) + 1; // the number of digits of the integer
        const stepSize = getParameterStep(parameterDescription);
        const stepDecimals = stepSize ? stepSize.toString().split('.')[1]?.length || 0 : undefined;
        const precision = 4; // but integers can have more ciphers
        const maxDecimals = stepSize ? stepDecimals : 2; // for continous values, we show a maximum of 2 decimals. for stepped ones, the ones corresponding to the step size.
        const decimals = parameterDescription.displayAsDb ? 1 :Math.max(Math.min(precision - valueTenExponent, maxDecimals), 0);
        if (parameterDescription.displayAsDb) {
            displayValue = Tone.gainToDb(displayValue);
        }
        displayValue = displayValue.toFixed(decimals);
        displayValue = displayValue.toString().replace("Infinity", "∞");
    }
        
    const THINSPACE = " ";
    const unitInfo = parameterDescription.unit ? THINSPACE + parameterDescription.unit : "";
    return displayValue + unitInfo;
}

export const getParameterStep = (parameterDescription) => {
    switch(parameterDescription.type) {
        case 'float':
            return parameterDescription.step;
        case 'enum':
            return 1;
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
    percent: '%',
    semitone: 'st'
}

// Tonalitat
const getPCNumber = (pcName) => {
    return {
        'c': 0, 
        'c#': 1, 'db': 1,
        'd': 2, 
        'd#': 3, 'eb': 3,
        'e': 4, 
        'f': 5, 
        'f#': 6, 'gb': 6,
        'g': 7, 
        'g#': 8, 'ab': 8,
        'a': 9, 
        'a#': 10, 'bb': 10,
        'b': 11
    }[pcName.toLowerCase()];
}

const wrappedPCNumber = (pcNumber) => {
    pcNumber = pcNumber % 12;
    if (pcNumber < 0) {
        return pcNumber + 12;
    }
    if (pcNumber >= 12) {
        return pcNumber - 12;
    }
    return pcNumber;
}

const getPCName = (pcNumber) => {
    return {
        0: 'c',
        1: 'c#',
        2: 'd',
        3: 'd#',
        4: 'e',
        5: 'f',
        6: 'f#',
        7: 'g',
        8: 'g#',
        9: 'a',
        10: 'a#',
        11: 'b'
    }[pcNumber];
}

const getPCNameAndMode = (tonality) => {
    const pcName = tonality.slice(0, -5);
    const mode = tonality.slice(-5);
    return {pcName, mode};
}

const getTonalityName = (pcName, mode) => {
    return `${pcName}${mode}`;
}

export const getTonalityDisplayName = (nomTonalitat) => {
    //let nomActualitzat = nomTonalitat.charAt(0).toUpperCase() + nomTonalitat.slice(1);
    //nomActualitzat = nomActualitzat.replace("minor", " Minor");
    //nomActualitzat = nomActualitzat.replace("major", " Major");
    //nomActualitzat = nomActualitzat.replace("b ", "♭ ");
    //return nomActualitzat;
    const {pcName, mode} = getPCNameAndMode(nomTonalitat);
    const pcNameTranslations = {"c": "do", "d": "re", "e": "mi", "f": "fa", "g": "sol","a": "la", "b": "si"};
    const catPCName = pcName.replace(/^(.)b$/, '$1♭').split('').map(char => pcNameTranslations[char] || char).join('');
    const catMode = mode.replace('minor', 'menor');
    return capitalizeFirstLetter(`${catPCName} ${catMode}`)
}

export const tonalitatsCompatibles = (tonalitat1, tonalitat2) => {
    if (tonalitat1 === undefined || tonalitat2 === undefined) {
        return false;
    }
    // Retorna true si les tonalitats són compatibles, false si no ho són
    const {pcName:pcName1, mode:mode1} = getPCNameAndMode(tonalitat1);
    const {pcName:pcName2, mode:mode2} = getPCNameAndMode(tonalitat2);
    
    // Cas les dues tonalitats siguin la mateixa
    if ((pcName1 === pcName2) && (mode1 === mode2)) {
        return true;
    }

    // Cas relatiu menor
    if (mode1 !== mode2) {
        if (mode1 === 'major') {
            const relativeMinorPCNumber = wrappedPCNumber(getPCNumber(pcName1) - 3);
            if (relativeMinorPCNumber === getPCNumber(pcName2) && mode2 === 'minor') {
                return true;
            }
        } else if (mode2 === 'major') {
            const relativeMinorPCNumber = wrappedPCNumber(getPCNumber(pcName2) - 3);
            if (relativeMinorPCNumber === getPCNumber(pcName1) && mode1 === 'minor') {
                return true;
            }
        }
    }
    
    return false;
}

export const modificaTonalitatPerSemitons = (tonalitat, semitons) => {
    if (tonalitat === undefined) {
        return undefined;
    }
    const {pcName, mode} = getPCNameAndMode(tonalitat);
    let newPCNumber = wrappedPCNumber(getPCNumber(pcName) + semitons);
    return getTonalityName(getPCName(newPCNumber), mode);
}


export const getTonalityForSamplerLibrarySample = (soundName) => {
    let tonalityFound = undefined;
    sampleLibrary.sampler.forEach((sound) => {
        if (sound.name.toLowerCase() === soundName.toLowerCase()) {
            if (sound.hasOwnProperty('tonality')) {
                tonalityFound = sound.tonality;
            }
        }
    });
    return tonalityFound;
}

// returns an array with the index corresponding to the position on the scale
// and the number corresponding to the Pitch Class
export const getPCsFromScaleName = (scale) => {

    const parseScale = (scale) => {
        const rootNote = scale.slice(0, -5).toLowerCase(); 
        const isMinor = scale.toLowerCase().includes('minor'); 
        
        if (!getPCNumber(rootNote) === undefined) {
            throw new Error(`Root no vàlida: ${rootNote}`);
        }

        return {
            rootPC: getPCNumber(rootNote), 
            isMinor: isMinor                   
        };
    };

    const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];  
    const minorScaleIntervals = [0, 2, 3, 5, 7, 8, 10];  

    const { rootPC, isMinor } = parseScale(scale);

    const scaleIntervals = isMinor ? minorScaleIntervals : majorScaleIntervals;

    return scaleIntervals.map(interval=>(interval+rootPC)%12);
};

const ascii = a => a.charCodeAt(0);

const getWhiteNote = noteClass => noteClass.slice(0,1) + noteClass.slice(1).replaceAll('#', '').replaceAll('b', '');

const getScaleDegreeOfNoteClass = (noteClass, rootNoteClass) => {
    const rootWhiteAscii = ascii(getWhiteNote(rootNoteClass));
    const noteWhiteAscii = ascii(getWhiteNote(noteClass));
    return noteWhiteAscii - rootWhiteAscii + (rootWhiteAscii > noteWhiteAscii ? 7 : 0);
}

const separateNoteClassAndOctave = compoundNote => {
    return [compoundNote.slice(0, -1), compoundNote.slice(-1)]
}

const noteStrToMidi = (noteStr) => {
    [noteClass, octave] = separateNoteClassAndOctave(noteStr);
    return getPCNumber(noteClass) + (octave + 1) * 12;
}

export const getDiatonicInterval = (note1, note2) => {
    const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
    [noteClass1, octave1] = separateNoteClassAndOctave(note1);
    [noteClass2, octave2] = separateNoteClassAndOctave(note2);
    const noteClassInterval = getScaleDegreeOfNoteClass(noteClass2, 'c') - getScaleDegreeOfNoteClass(noteClass1, 'c');
    const quantity = noteClassInterval + (octave2 - octave1) * 7;
    const quality = (() =>{
        const chromaticInterval = noteStrToMidi(note2) - noteStrToMidi(note1);
        const modQuantity = Math.abs(quantity % 7);
        const modChromaticInterval = Math.abs(chromaticInterval % 12);
        const diff = modChromaticInterval - majorScaleIntervals[modQuantity];
        if (diff === 1) return 'aug';
        else if (modQuantity === 0 | modQuantity === 3 || modQuantity === 4) {
            if (diff === 0) return 'jus';
            if (diff === -1) return 'dim';
            return undefined;
        }
        if (diff === 0) return 'maj';
        if (diff === -1) return 'min';
        if (diff === -2) return 'dim';
    })();

    return {quantity: quantity, quality: quality};
}

export const getDiatonicIntervalEZ = (note1, note2) => {
    const semitoneDiff = note2 - note1;
    const directionMultiplier = semitoneDiff < 0 ? -1 : 1; // for when it's downwards
    const absModSemitoneDiff = Math.abs(semitoneDiff) % 12;
    const octaveDiff = Math.floor(Math.abs(semitoneDiff) / 12);
    const [absModQuantity, quality] = {
        0: [0, 'per'],
        1: [1, 'min'], 2: [1, 'maj'],
        3: [2, 'min'], 4: [2, 'maj'],
        5: [3, 'per'],
        6: [4, 'dim'], 7: [4, 'per'],
        8: [5, 'min'], 9: [5, 'maj'],
        10: [6, 'min'], 11: [6, 'maj']
    }[absModSemitoneDiff];
    const quantity = directionMultiplier * (absModQuantity + 7 * octaveDiff);
    return [quantity, quality]
}

export const getNextPitchClassAfterPitch = (pitchClass, midiPitch) => {
    return midiPitch - (midiPitch % 12) + pitchClass + (midiPitch % 12 <= pitchClass ? 0 : 12);
}

// Util function to set a master effects parameter

export const setMasterEffectsParameter = (effectKey, value) => {
    const parsedValue = (effectKey === 'delayATime' || effectKey === 'delayBTime') ? value : parseFloat(value);
    let newEffectParameters = {...getAudioGraphInstance().getEffectParameters() , [effectKey]: parsedValue};
    getAudioGraphInstance().updateParametreAudioGraph('effectParameters', newEffectParameters);
};

// Util function to return the display name of a pattern preset

export const getPatternPresetDisplayName = (patternPresetNumber) => {
    // Returns the uppercase character corresponding to the pattern preset number
    return String.fromCharCode(64 + patternPresetNumber);
}

// Util function to get the current version of GRUF
export const getAppVersion = () => {
    return appVersion;  // Defined in base.html
}

// Get download audio recording filename

function slugify(str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
    str = str.toLowerCase(); // convert string to lowercase
    str = str.replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
            .replace(/\s+/g, '-') // replace spaces with hyphens
            .replace(/-+/g, '-'); // remove consecutive hyphens
    return str;
}

export const downloadedAudioRecordingFilename = () => {
    const date = new Date();
    return `GRUF_${getCurrentSession().getID()}_${slugify(getCurrentSession().getNom())}_${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.wav`;
}

export const modalEditaSessioVisible = () => {
    return document.querySelector("div[group='editSessio']") !== null 
}

export const removeKeyFromDictionary = (dictionary, key) => {
    var duplicate = Object.assign({}, dictionary);
    delete duplicate[key];
    return duplicate;
}