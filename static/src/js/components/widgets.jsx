import { useState, useRef, useEffect, useId, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom, capitalizeFirstLetter, subscribeToEstacioParameterChanges}  from "../utils";
import { subscribeToStoreChanges, subscribeToParameterChanges, subscribeToAudioGraphParameterChanges, subscribeToPresetChanges} from "../utils"; // subscriptions
import { updateParametre, num2Norm, norm2Num, real2Num, num2Real, real2String, getParameterNumericMin, getParameterNumericMax, getParameterStep, } from "../utils"; // parameter related
import { clamp, distanceToAbsolute, euclid, sample, weightedSample, lerp }  from "../utils"; // math related
import { subscribeToParameterChanges, modificaTonalitatPerSemitons, transformaNomTonalitat, tonalitatsCompatibles, getTonalityForSamplerLibrarySample, getPCsFromScaleName, getNextPitchClassAfterPitch, getDiatonicIntervalEZ } from "../utils"; // music theory related
import { KnobHeadless } from 'react-knob-headless';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import Slider from '@mui/material/Slider';
import { InputNumber } from 'primereact/inputnumber';
import isequal from 'lodash.isequal'
import * as Tone from 'tone';
import { Dropdown } from 'primereact/dropdown';
import { sendNoteOn, sendNoteOff } from './entradaMidi';
import { sampleLibrary} from "../sampleLibrary";
import throttle from 'lodash.throttle'
import { AudioRecorder } from "../components/audioRecorder";
import { setMasterEffectsParameter } from "../utils";


import cssVariables from '../../styles/exports.module.scss';
import { circularProgressClasses } from "@mui/material";

const valueToText = (value) => {
    return `${value >= 5 ? value.toFixed(0) : value.toFixed(2)}`;
}

export const GrufLogoEstacio = ({tipusEstacio, setEstacioSelected, className=""}) => {
    return(
        <button className={`logo-estacio btn-white estacio-${tipusEstacio}-logo ${className}`} onClick={() => setEstacioSelected(undefined)}></button>
    )
}

export const GrufSeparatorLine = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1 1"
            preserveAspectRatio="none" // so that the viewBox doesn't need to scale evenly
            width="2px" height="80px">
            <line x1="0" x2="0" y1="0" y2="1"
            stroke={cssVariables.lightGrey}/>
        </svg>
    )
}

export const GrufLegend = ({ text, style={}, bare=false }) => {
    // we actually style the span element inside the legend element :)
    return (
        <legend style={{display: 'contents'}}><span style={style}className={`gruf-legend ${bare ?  "bare" : ""}`}>{text}</span></legend> 
    )
}

export const GrufLabel = ({text, top, left}) => {
    return (
        <div className="gruf-label" style={{top: top, left: left}}>
            {text}
        </div>
    )
}

export const GrufLabelPetit = ({text, top, left}) => {
    return (
        <div className="gruf-label-petit" style={{top: top, left: left}}>
            {text}
        </div>
    )
}

export const GrufLabelPetitVertical = ({text, top, left}) => {
    return (
        <div className="gruf-label-petit transformed" style={{top: top, left: left}}>
            {text}
        </div>
    )
}

export const GrufLabelEstacio = ({ estacio, className }) => {
    return (
        <div className={className}>
            {estacio.nom}
        </div>
    );
};

export const GrufButtonNoBorder = ({text, style, onClick}) => {
    return (
        <button className="btn-gruf no-border" onClick={onClick} style={style}>
            {text}
        </button>
    )
}

export const GrufButtonBorder = ({className, text, top, left, onClick}) => {
    return (
        <button className={`btn-gruf border-radius ${className}`} onClick={onClick} style={{top: top, left: left}}>
            {text}
        </button>
    )
}


export const GrufKnob = ({ parameterParent, parameterName, position, top, left, label, mida, colorizeLabel=false, markLabelRed=false, noOutput=false, customWidth=undefined, customHeight=undefined }) => {
    const [discreteOffset, setDiscreteOffset] = useState(0); // for when there are discrete options (parameterDescription.type === 'enum')
    subscribeToParameterChanges(parameterParent, parameterName);
    
    const parameterDescription = parameterParent.getParameterDescription(parameterName);

    const realValue =  parameterParent.getParameterValue(parameterName);
    const normValue = num2Norm(real2Num(realValue, parameterDescription), parameterDescription); // without discreteOffset for snapping when there are discrete options
    const angleMin = -145;
    const angleMax = 145;
    const angle = normValue * (angleMax - angleMin) + angleMin;
    
    const numValue = real2Num(realValue, parameterDescription) + discreteOffset;

    const handleKnobChange = (newNumValue) => {
        const newRealValue = num2Real(newNumValue, parameterDescription);
        setDiscreteOffset(newNumValue - real2Num(newRealValue, parameterDescription));
        updateParametre(parameterParent, parameterName, newRealValue);
    }

    let labelClass = "";
    if (colorizeLabel) labelClass = "text-accent"
    if (markLabelRed) labelClass = "text-red"

    position = position ?? (top || left) ? "absolute" : "relative" // TODO: remove when all knobs are relative
    const knobctrlId = useId();
    return (
        <div className={ `knob knob-${mida}` } style={{ top, left, position }}>
                <div className="knobctrl-wrapper" style={(customWidth !== undefined && customHeight !== undefined)?{width:customWidth, height:customHeight}:{}}>
                    <KnobHeadless id={knobctrlId} className="knobctrl" style={{rotate: `${angle}deg`}}
                        valueRaw={numValue}
                        valueMin={getParameterNumericMin(parameterDescription)}
                        valueMax={getParameterNumericMax(parameterDescription)}
                        mapTo01={(x) => num2Norm(x, parameterDescription)}
                        mapFrom01={(x) => norm2Num(x, parameterDescription)}
                        onValueRawChange={throttle(newNumValue => handleKnobChange(newNumValue), getCurrentSession().continuousControlThrottleTime)}
                        valueRawRoundFn={(value)=>value.toFixed(2)}
                        valueRawDisplayFn={(numValue) => real2String(num2Real(numValue, parameterDescription), parameterDescription)}
                        dragSensitivity="0.009"
                        orientation='vertical' // si knobheadless accepta la proposta de 'vertical-horizontal', ho podrem posar així
                    />
                </div>
                <label htmlFor={knobctrlId} className={labelClass}>{label || parameterDescription.label}</label>
                {!noOutput && <output htmlFor={knobctrlId}>{real2String(realValue, parameterDescription)}</output>}
        </div>
    )
};

export const GrufEnum2Columns = ({estacio, parameterName, top, left}) => {
    subscribeToParameterChanges(estacio, parameterName);
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName);
    const nomEstacio=estacio.nom;
    const enumOptions=parameterDescription.options;
    return (
        <div className="gruf-enum-2-columns" style={{top: top, left: left}}>
            {enumOptions.map((option, index) => {
                return (
                    <button 
                        key={index} 
                        className={parameterValue == option ? 'selected' : ''} 
                        onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, option)}
                    >
                        {option}
                    </button>
                )
            })}
        </div>
    )
}

export const GrufReverbDecay = ({send, top, left}) => {
    const parameterName = "reverb" + send + "Decay";
    subscribeToAudioGraphParameterChanges("effectParameters")
    const parameterValue=getAudioGraphInstance().getEffectParameters()[parameterName];
    return (
        <div className="gruf-reverb-time" style={{top: top, left: left}}>
            <div>Curta</div><div><button
                style={{width: "20%"}}
                className={parameterValue == 1.0 ? 'selected' : ''} 
                onClick={() => setMasterEffectsParameter(parameterName, '1.0')}
            ></button></div>
            <div>Mitja</div><div><button
                style={{width: "50%"}}
                className={parameterValue == 5.0 ? 'selected' : ''} 
                onClick={() => setMasterEffectsParameter(parameterName, '5.0')}
            ></button></div>
            <div>Llarga</div><div><button
                style={{width: "100%"}}
                className={parameterValue == 12.0 ? 'selected' : ''} 
                onClick={() => setMasterEffectsParameter(parameterName, '12.0')}
            ></button></div>
        </div>
    )
}

export const GrufDelayTime = ({send, top, left}) => {
    subscribeToAudioGraphParameterChanges("effectParameters")
    const parameterName = "delay" + send + "Time";
    const parameterValue=getAudioGraphInstance().getEffectParameters()[parameterName];
    const enumOptions=['1/4', '1/4T', '1/8', '1/8T', '1/16', '1/16T'];
    return (
        <div className="gruf-enum-2-columns" style={{top: top, left: left}}>
            {enumOptions.map((option, index) => {
                return (
                    <button 
                        key={index} 
                        className={parameterValue == option ? 'selected' : ''} 
                        onClick={() => setMasterEffectsParameter(parameterName, option)}
                    >
                        {option}
                    </button>
                )
            })}
        </div>
    )
}

export const GrufDelayFeedback = ({send, top, left}) => {

    // Aquest widget és un hack sobre Knob perquè ha de controlar un dels paràmetres dels efectes de l'audioGraph i això no es pot fer només amb parameterParent.
    // Segurament hauriem de millorar Knob pq també pugui setejar parametres d'efectes de l'audio graph

    const parameterName = "delay" + send + "Feedback";
    const parameterValue = getAudioGraphInstance().getEffectParameters()[parameterName];
    subscribeToAudioGraphParameterChanges("effectParameters")
    const angleMin = -145;
    const angleMax = 145;
    const angle = parameterValue * (angleMax - angleMin) + angleMin;

    const parameterDescription = {type: 'float', label: 'Delay ' + send + ' Feedback', min: 0.0, max: 1.0, initial: 0.5}
    const knobctrlId = useId();
    const numValue = real2Num(parameterValue, parameterDescription);
    const handleKnobChange = (newNumValue) => {
        const newRealValue = num2Real(newNumValue, parameterDescription);
        setMasterEffectsParameter(parameterName, newRealValue);
    }
    
    return (
        <div className={ `knob knob-petit` }>
            <div className="knobctrl-wrapper">
                <KnobHeadless id={knobctrlId} className="knobctrl" style={{rotate: `${angle}deg`}}
                    valueRaw={numValue}
                    valueMin={getParameterNumericMin(parameterDescription)}
                    valueMax={getParameterNumericMax(parameterDescription)}
                    mapTo01={(x) => num2Norm(x, parameterDescription)}
                    mapFrom01={(x) => norm2Num(x, parameterDescription)}
                    onValueRawChange={throttle(newNumValue => handleKnobChange(newNumValue), getCurrentSession().continuousControlThrottleTime)}
                    valueRawRoundFn={(value)=>value.toFixed(2)}
                    valueRawDisplayFn={(numValue) => real2String(num2Real(numValue, parameterDescription), parameterDescription)}
                    dragSensitivity="0.009"
                    orientation='vertical' // si knobheadless accepta la proposta de 'vertical-horizontal', ho podrem posar així
                />
            </div>
            <label htmlFor={knobctrlId}>Feedback</label>
            {<output htmlFor={knobctrlId}>{real2String(parameterValue, parameterDescription)}</output>}
    </div>
    )
}


export const GrufSlider = ({ estacio, parameterName, top, left, orientation='horizontal', size, label, labelSize="12px", markStart, markEnd, noLabel=false, noOutput=false }) => {
    [activeThumbIndex, setActiveThumbIndex] = useState(0);
    const parameterNames = Array.isArray(parameterName) ? parameterName : [parameterName];
    parameterNames.forEach(parameterName => subscribeToParameterChanges(estacio, parameterName));

    const parameterDescriptions = parameterNames.map(parameterName => estacio.getParameterDescription(parameterName));
    
    const marks = []

    const numericMinValue = Math.min(...parameterDescriptions.map(parameterDescription=>getParameterNumericMin(parameterDescription)));
    const numericMaxValue = Math.max(...parameterDescriptions.map(parameterDescription=>getParameterNumericMax(parameterDescription)));
    if (markStart !== undefined) marks.push({ value: numericMinValue, label: markStart});
    if (markEnd !== undefined) marks.push({ value: numericMaxValue, label: markEnd});
    
    const style = { top: top, left: left };
    if (top || left) style.position = "absolute";
    if (orientation==='vertical') style.height = size || '80px';
    if (orientation==='horizontal') style.width = size || '200px';

    const handleSliderChange = (newValues, activeThumbIndex) => {
        setActiveThumbIndex(activeThumbIndex);
        newValues.forEach((newValue, index)=> estacio.updateParametreEstacio(parameterNames[index], num2Real(newValue, parameterDescriptions[index])));
    }
    
    const realValues = parameterNames.map(parameterName => estacio.getParameterValue(parameterName));
    const sliderId = useId();
    return (
        <div className={`gruf-slider ${orientation}`} style={style}>
            <Slider
                id={sliderId}
                orientation={orientation}
                value={realValues.map((realValue, index) => real2Num(realValue, parameterDescriptions[index]))}
                step={getParameterStep(parameterDescriptions[0]) || 0.001 } // MuiSlider needs a step size, so returning small if it's undefined
                min={numericMinValue}
                max={numericMaxValue}
                marks={marks} 
                onChange={throttle((_, newValues, activeThumb) => handleSliderChange(newValues, activeThumb), getCurrentSession().continuousControlThrottleTime)}
            />
            {!noLabel && <label style={{fontSize: labelSize}} htmlFor={sliderId}>{label || parameterDescriptions[0].label}</label>}
            {!noOutput && <output htmlFor={sliderId}>{real2String(realValues[activeThumbIndex], parameterDescriptions[activeThumbIndex])}</output>}
        </div>
    )
};

export const GrufBpmCounter = ({ top, left }) => {
    subscribeToParameterChanges(getAudioGraphInstance(), 'bpm');
    const currentBpm = parseInt(getAudioGraphInstance().getBpm(), 10);
    const minBpm = getAudioGraphInstance().getParameterDescription('bpm').min;
    const maxBpm = getAudioGraphInstance().getParameterDescription('bpm').max;

    const handleBpmChange = (newBpm) => {
        getAudioGraphInstance().updateParametreAudioGraph('bpm', clamp(newBpm, minBpm, maxBpm));
    };

    return (
        <div className="bpm-counter" style={{ top: top, left: left }}>
            <div className="outer-square">
                <div className="inner-square">
                    <InputNumber
                        value={currentBpm}
                        onValueChange={(e) => handleBpmChange(e.value)}
                        min={minBpm}
                        max={maxBpm}
                        showButtons={false}
                        className="p-inputnumber"
                    />
                    <div className="bpm-buttons">
                        <div className="button decrement" onClick={() => handleBpmChange(currentBpm - 1)}></div>
                        <div className="button increment" onClick={() => handleBpmChange(currentBpm + 1)}></div>
                    </div>
                </div>
            </div>
            <label htmlFor="p-inputnumber">bpm</label>
        </div>
    );
};

export const GrufPad = ({ estacio, playerIndex, isSelected, setSelected, label }) => {

    const handleMouseDown = () => {
        setSelected();
        sendNoteOn(estacio.nom, playerIndex, 127);
        document.addEventListener('mouseup', handleMouseUp);
    }

    const handleMouseUp = () => {
        document.removeEventListener('mouseup', handleMouseUp);
        sendNoteOff(estacio.nom, playerIndex, 0);
    };


    return (
        <div className="gruf-pad">
            <Button
                className={ "btn-white " + (isSelected ? 'selected': '') }
                onMouseDown={handleMouseDown}
                label={label}
            />
        </div>
    )
}

export const GrufPadGrid = ({ estacio, width="200px", height="200px", selectedPad, setSelectedPad }) => {
    useEffect(()=> {
        document.addEventListener("midiNote-" + estacio.nom , (evt) => {
            if (evt.detail.type == 'noteOff') return;
            setSelectedPad(evt.detail.note % 16)
        });
    })
   
    return (
        <div className="pad-grid" style={{ width, height }}>
            {Array.from({ length: 16 }).map((_, index) => (
                <GrufPad
                    key={index}
                    estacio={estacio}
                    playerIndex={index}
                    isSelected={selectedPad===index}
                    setSelected={() => setSelectedPad(index)}
                    label={index + 1}
                />
            ))}
        </div>
    );
};

export const GrufToggle = ({ estacio, parameterName, className="", top, left}) => {
    subscribeToParameterChanges(estacio, parameterName);

    const parameterValue = estacio.getParameterValue(parameterName);

    const handleClick = () => { // En clicar, invertim el valor i l'actualitzem
        estacio.updateParametreEstacio(parameterName, !parameterValue);
    };

    return (
        <div className={`gruf-toggle ${className}`}style={{ top: top, left: left }}>
            <div
                className={`p-toggle ${parameterValue ? 'on' : 'off'}`}
                onClick={handleClick}
            >
                <div className={`circle-icon ${parameterValue ? 'selected' : ''}`}></div>
            </div>
        </div>
    );
};

export const GrufOnOffGrid = ({ estacio, parameterName, top, left }) => {
    subscribeToParameterChanges(estacio, parameterName);
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar playhead position
    subscribeToPresetChanges();

    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName);
    const numRows = parameterDescription.numRows;
    const numSteps =  estacio.getNumSteps();
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElementsPerRow = []
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
        const stepsElements = []
        for (let stepIndex = 0; stepIndex < numSteps; stepIndex++) {
            const isFilled = indexOfArrayMatchingObject(parameterValue, {'i': rowIndex, 'j': stepIndex}) > -1;
            const isActive = (currentStep == stepIndex && (getAudioGraphInstance().isPlayingLive() || (getAudioGraphInstance().isPlayingArranjament() && estacio.getCurrentLivePreset() === estacio.arranjamentPreset )));
            stepsElements.push(
            <div 
                key={rowIndex + "_" + stepIndex} // To avoid React warning
                className={`step ${isFilled ? 'selected' : ''} ${isActive ? 'active' : ''}`}
                onMouseDown={(evt) => {
                    let updatedParameterValue = [...parameterValue]
                    const index = indexOfArrayMatchingObject(parameterValue, {'i': rowIndex, 'j': stepIndex});
                    if (index > -1){
                        updatedParameterValue.splice(index, 1);
                    } else {
                        updatedParameterValue.push({'i': rowIndex, 'j': stepIndex})
                    }
                    estacio.updateParametreEstacio(parameterDescription.nom, updatedParameterValue)
                }}>
            </div>
            )
        }
        stepsElementsPerRow.push(stepsElements)
    }

    // Calculate transform scale style to adjust number of steps to current display
    let transformStyle = {}
    const scaleXTransFormFactor = 16 / numSteps;
    if (scaleXTransFormFactor < 1) {
        transformStyle = {
            transform: `scaleX(${scaleXTransFormFactor}) translateX(-10px)`,
            transformOrigin: 'left'
        }
    }
    
    return (
        <div className="gruf-on-off-grid" style={{ top: top, left: left}}>
            <div className="grid-default" style={transformStyle}>
                {stepsElementsPerRow.map(function(stepsElements, i){
                    return <div className="grid-row-default" key={'row_' + i}>{stepsElements}</div>;
                })}
            </div>
            <div style={{display:"none"}}>
                {/* <button onMouseDown={(evt)=>
                    estacio.updateParametreEstacio(parameterDescription.nom, [])
                }>Clear</button> */}
                {hasPatronsPredefinits(parameterDescription) &&
                    (
                    <div>
                    Patró:
                    <select 
                        defaultValue={getNomPatroOCap(parameterDescription, parameterValue)}
                        onChange={(evt) => estacio.updateParametreEstacio(parameterDescription.nom, getPatroPredefinitAmbNom(parameterDescription, evt.target.value))}
                    >              
                        <option key="cap" value="Cap">Cap</option>
                        {parameterDescription.patronsPredefinits.map(patro => <option key={patro.nom} value={patro.nom}>{patro.nom}</option>)}
                    </select>
                    </div>
                    )
                }
            </div>
        </div>
    )
};

export const GrufOnOffGridContainer = ({ estacio, parameterName, top = "0px", left = "0px" }) => {
    return (
        <div 
            style={{
                position: 'relative',
                top: top,
                left: left,
                backgroundColor: 'rgb(75, 75, 76)',
                borderRadius: '8px', 
                display: 'inline-block',
                width: '570px',
                height: '341px',
            }}
        >
            <GrufOnOffGrid estacio={estacio} parameterName={parameterName} />
        </div>
    );
};


export const GrufSelectorPresets = ({ className, estacio, top, left, buttonWidth, minHeight }) => {
    subscribeToPresetChanges();
    const selectedPreset = getCurrentSession().getLivePresetsEstacions()[estacio.nom];
    return (
        <div className={`gruf-selector-presets ${className}`} style={{ top: top, left: left, minHeight }}>
            {[...Array(estacio.numPresets).keys()].map(i => 
                <div
                    key={"preset_" + i}
                    className={`flex-auto flex justify-center items-center ${(selectedPreset == i ? " selected" : "")}`}
                    onClick={() => { getCurrentSession().setLivePresetForEstacio(estacio.nom, i) }}
                    style={{width: buttonWidth}}
                >
                    {i + 1}
                </div>
            )}
        </div>
    );
};

export const GrufPianoRoll = ({ className, estacio, parameterName, width="500px", height="320px", colorNotes, modeSampler, triggerNotes=true }) => {
    subscribeToParameterChanges(estacio, parameterName);
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar playhead position i tonality
    subscribeToPresetChanges();

    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName);
    const numSteps =  estacio.getNumSteps();
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const uniqueId = estacio.nom + "_" + parameterDescription.nom
    let lastEditedData = "";
    
    const tonality = getAudioGraphInstance().getTonality(); 
    const tonalityPCs = getPCsFromScaleName(tonality);
    const allowedNotes = [];

    for (let octave = -2; octave <= 8; octave++) { 
        const octaveOffset = octave * 12; 
        tonalityPCs.forEach(pitchclass => {
            const note = pitchclass + octaveOffset;
            if (note >= 0 && note <= 127) {  // Midi range permitido
                allowedNotes.push(note);
            }
        });
    }
    
    const instrumentRange = parameterDescription.notaMesAltaPermesa - parameterDescription.notaMesBaixaPermesa + 1 || 127;

    useEffect(() => {
        const jsElement = document.getElementById(uniqueId + "_id")
        if (jsElement.dataset.alreadyBinded === undefined){
            jsElement.dataset.lastTonality = tonality;

            jsElement.addEventListener("pianoRollEdited", evt => {
                const stringifiedData = JSON.stringify(evt.detail)
                if (!isequal(stringifiedData, lastEditedData)) {
                    handleSequenceEdited(evt.detail)
                    lastEditedData = stringifiedData // Save using stringified version to avoid using a reference. If using a reference, "isequal" above will always be true after the first iteration
                }
            });
            if (triggerNotes){
                jsElement.addEventListener("pianoRollNoteSelectedOrCreated", evt => {
                    // When a note is created or selected, we will trigger a callback
                    sendNoteOn(estacio.nom, evt.detail.midiNote, 127, skipTriggerEvent=false);
                    setTimeout(() => {
                        sendNoteOff(estacio.nom, evt.detail.midiNote, 0);
                    }, evt.detail.durationInBeats * Tone.Time("16n").toSeconds() * 1000);
                });
            }
            if (modeSampler) { // al mode keyboard, es gestiona a gruf-pianoroll.js directament
                document.addEventListener("midiNote-" + estacio.nom , (evt) => {
                    const noteNumber = evt.detail.note % 16;
                    if (evt.detail.type == 'noteOff') {
                        const noteMarker = document.querySelector(`.noteMarker[data-notenumber='${noteNumber}']`);
                        if (!noteMarker) return;
                        noteMarker.remove();
                        return;
                    }
    
                    const noteHeight = jsElement.height/jsElement.yrange;
                    let bottomPosition = noteHeight * noteNumber;
                    const canvasOffset = jsElement.yoffset*noteHeight;
                    bottomPosition = bottomPosition - canvasOffset;
    
                    if ((bottomPosition >= 0) && (bottomPosition <= jsElement.height - 10)) {
                        const noteMarker = document.createElement('div');
                        noteMarker.className = 'noteMarker'
                        noteMarker.dataset.notenumber = noteNumber;
                        noteMarker.style.position = 'absolute';
                        noteMarker.style.bottom = bottomPosition + 'px';
                        noteMarker.style.left = modeSampler ? '0px': '22px';
                        noteMarker.style.width = modeSampler ? '22px': '62px';
                        noteMarker.style.height = (noteHeight * 0.9) + 'px';
                        noteMarker.style.backgroundColor = colorNotes;
                        noteMarker.style.zIndex = 1000;
                        noteMarker.style.borderRadius = '2px';
                        noteMarker.style.opacity = '0.5';
                        noteMarker.style.pointerEvents = 'none';
                        noteMarker.style.transition = 'opacity 1s ease-in-out;';
                        jsElement.appendChild(noteMarker);
                    }
                })
            }
           
            
            jsElement.dataset.alreadyBinded = true;
        } else {
            if (jsElement.dataset.lastTonality !== tonality) {
                jsElement.setAllowedNotes(allowedNotes);
                jsElement.dataset.lastTonality = tonality;
            }
        }

        const newWidgetSequence = appSequenceToWidgetSequence(parameterValue);
        const oldWidgetSequence = jsElement.sequence;
        if (!isequal(oldWidgetSequence, newWidgetSequence)) {
            jsElement.sequence = newWidgetSequence.map(notaNova => {
                // si la nota ja existia, la coloquem amb la mateixa referència amb Object.assign
                // així, el widget sap que és la mateixa nota, i mantindrà el seu estat de selecció i s'hi podrà interactuar bé
                const notaAntigua = oldWidgetSequence.find(nota => nota.id === notaNova.id);
                if (notaAntigua) return Object.assign(notaAntigua, notaNova);
                return {...notaNova, f: 0};
            });
            jsElement.redraw()
        }
        if (currentStep >= 0) {
            jsElement.locate(currentStep);
        } else {
            jsElement.locate(-10);  // make it dissapear
        }
    })

    const appSequenceToWidgetSequence = (sequence) => {
        return sequence.map(value => {return {
            't': value.b,  // time in beats
            'n': value.n,  // midi note number
            'g': value.d,  // note duration in beats
            'id': value.id, // identifier
        }})
    }

    const widgetSequenceToAppSequence = (wSequence) => {
        return wSequence.map(value => {return {
            'b': value.t,  // beat position
            'n': value.n,  // midi note number
            'd': value.g,  // note duration in beats
            'id': value.id, // identifier
        }})
    }

    const handleSequenceEdited = (widgetSequence) => {
        estacio.updateParametreEstacio(parameterDescription.nom, widgetSequenceToAppSequence(widgetSequence))
    }


    const maxYRange = 36;
    const doesYScroll = instrumentRange > maxYRange;

    const getLowestNoteForYOffset = () => {
        // if the roll doesn't scroll, simply return the lowest roll
        if (!doesYScroll) return parameterDescription.notaMesBaixaPermesa;

        // else, return the lowest drawn note, if there are any notes drawn on the roll
        // if (parameterValue && parameterValue.map(note => note.n)) return parameterValue.map(note => note.n).reduce((min, value) => Math.min(min, value));

        // else, return a sensible default, if it exists
        if (parameterDescription.notaMesBaixaTipica) return parameterDescription.notaMesBaixaTipica;

        return 0;
    }

    // Available webaudio-pianoroll attributes: https://github.com/g200kg/webaudio-pianoroll
    const cursorSrcUrl =  appPrefix + "/static/src/img/playhead_long.svg";
    return (
        <div className={`gruf-piano-roll ${className}`} style={{ overflow:"hidden"}}>
                <gruf-pianoroll
                    id={uniqueId + "_id"}
                    editmode={parameterDescription.isMono ? "dragmono" : "dragpoly"}
                    secondclickdelete={true}
                    nomestacio={estacio.nom}
                    allowednotes={modeSampler === undefined ? allowedNotes: []}
                    width={width.replace('px', '')}
                    height={height.replace('px', '')}
                    grid={2}
                    xrange={numSteps}
                    yrange={Math.min(instrumentRange, maxYRange)}
                    yoffset={modeSampler === undefined ? getLowestNoteForYOffset(): 0}
                    xruler={0}
                    markstart={-10}  // make it dissapear
                    markend={-10}  // make it dissapear
                    //cursoroffset={2500}  // make it dissapear
                    yscroll={doesYScroll ? 1 : 0} // only allow scroll when there is 'overflow'
                    //xscroll={true}
                    colnote={colorNotes || "#f22"}
                    colnotesel={colorNotes || "#f22"}
                    colnotedissalowed="#333"    
                    collt={"rgb(200, 200, 200)"}
                    coldk={"rgb(176, 176, 176)"}
                    colgrid={"#999"}
                    colnoteborder={colorNotes || "#f22"}
                    colrulerbg={"#4b4b4b"}
                    colrulerfg={"#fff"}
                    colrulerborder={"#4b4b4b"}
                    cursorsrc={cursorSrcUrl}
                    kbwidth={modeSampler === undefined ? 65: 0}
                    kbstyle={modeSampler === undefined ? "piano": "midi"}
                    yruler={modeSampler === undefined ? 20: 22}
                ></gruf-pianoroll>
        </div>
    )
};

export const NoteGenerator = ({ estacio, parameterName }) => {
    subscribeToParameterChanges(getAudioGraphInstance(), 'tonality');
    const tonality = getAudioGraphInstance().getTonality();

    const parameterDescription = estacio.getParameterDescription(parameterName);
    let jsPianoRollEl;
    useEffect(()=> {
        jsPianoRollEl = document.getElementById(estacio.nom + "_" + parameterDescription.nom + "_id");
    })

    const lowestNote = parameterDescription.notaMesBaixaTipica || parameterDescription.notaMesBaixaPermesa;
    const highestNote = parameterDescription.notaMesAltaTipica || parameterDescription.notaMesAltaPermesa;
    const scalePCs = getPCsFromScaleName(tonality);
    const scalePitchesInRange = new Map();
    scalePCs.forEach((scalePC, i) => {
        const degree = i + 1;
        let octavedPC = getNextPitchClassAfterPitch(scalePC, lowestNote);
        while (octavedPC <= highestNote) {
            scalePitchesInRange.set(octavedPC, {degree: degree});
            octavedPC += 12;
        }
    });
    const degreeWeights = {1:5, 2:1, 3:2, 4:1, 5:4, 6:1, 7:1}
    const diatonicIntervalWeights = {0:1, 1:6, 2:1, 3:1, 4:1, 5:1, 7:2}

    const compassos = 2;
    const beatsPerCompas = 4;
    const stepsPerBeat = 4;

    const getNextPitch = (previousPitch) => {
        const possiblePitches = [...scalePitchesInRange.keys()];
        const weights = [...scalePitchesInRange.entries()].map(([pitch, noteInfo]) => {
            const degreeWeight = degreeWeights[noteInfo.degree];
            const [intervalQuantity, _] = previousPitch !== undefined ? getDiatonicIntervalEZ(previousPitch, pitch) : [0, 'per'];
            const intervalWeight = diatonicIntervalWeights[Math.abs(intervalQuantity)] ?? 0;
            return degreeWeight * intervalWeight;
        });
        return weightedSample(possiblePitches, weights);
    }

    const randomHalves = (array, iterations=0) => {
        if (typeof array === "number") array = [array];
        if (iterations === 0) return array;

        const newArray = [];
        array.forEach(element=> {
            if (Math.random() < 0.5) {
                newArray.push(element)
            } else {
                newArray.push(element/2, element/2);
            }
        });
        return randomHalves(newArray, iterations - 1);
    }

    const generate = () => {
        
        const parts = randomHalves(compassos*beatsPerCompas*stepsPerBeat, 2);
        const durations = [];
        parts.forEach(partDuration=>{
            durations.push(...euclid(sample([2,3,4,5]), partDuration));
        })
        const onsets = distanceToAbsolute(durations).slice(0,-1);
        
        const newNotes = [];
        let previousPitch;
        const firstAvailableID = jsPianoRollEl.getNextAvailableID();
        onsets.forEach((onset, index) => {
            const duration = durations[index];
            const pitch = getNextPitch(previousPitch);
            const nota = {
                b: onset,
                d: duration,
                n: pitch,
                s: 0, // this means not selected
                id: firstAvailableID + index,
            }
            newNotes.push(nota);
            previousPitch = pitch;
        })
        estacio.updateParametreEstacio(parameterName, newNotes);
    }

    return(
        <button className="btn-white" style={{padding: '0', minHeight: '58px'}} onClick={generate}>Auto-generar <span>✨</span></button>
    )
}

export const GrufNoteControls = ({ className, estacio, parameterName, width, maxHeight, ExtraComponent}) => {
    subscribeToParameterChanges(estacio, 'isRecording');
    useEffect(()=> {
        estacio.updateParametreEstacio('isRecording', false); // stop recording when entering station (could be on for whatever reason (refresh instead of exit...))
        return () => {
            estacio.updateParametreEstacio('isRecording', false); // stop recording when exiting station
        }
    }, []);
    const isRecording = estacio.getParameterValue('isRecording');
    return (
        <fieldset className={`modul-border ${className}`} style={{ width, maxHeight }}>
            {ExtraComponent ? <ExtraComponent estacio={estacio} parameterName={parameterName}/> : null}
            <GrufSelectorPresets className="flex flex-auto flex-wrap gap-10 justify-between" estacio={estacio} buttonWidth="58px" />
            <fieldset className="flex flex-col gap-10">
                <button className="btn-white" style={{padding: '0', minHeight: '58px'}} onMouseDown={(evt)=> estacio.updateParametreEstacio(parameterName, [])}>Clear</button>
                <button className={`btn-white ${isRecording ? 'recording' : ''}`} style={{padding: '0', minHeight: '58px'}} onMouseDown={(evt)=> estacio.updateParametreEstacio('isRecording', !isRecording)}>Rec</button>
            </fieldset>
        </fieldset>
    );
};

export const GrufSelectorPatronsGrid = ({estacio, parameterName, top, left, width}) => {
    subscribeToParameterChanges(estacio, parameterName);
    subscribeToPresetChanges();
    
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName);
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-selector-patrons-grid" style={{top: top, left: left, width:width}}>
            <Dropdown 
            value={getNomPatroOCap(parameterDescription, parameterValue)}
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, getPatroPredefinitAmbNom(parameterDescription, evt.target.value))} 
            options={parameterDescription.patronsPredefinits.map(patro => patro.nom)}
            placeholder="Cap"
            />
            {/* <button onMouseDown={(evt)=> estacio.updateParametreEstacio(parameterDescription.nom, [])}>Clear</button> */}
        </div>
    )
}

export const GrufSelectorTonalitat = ({ className, label="Tonalitat" }) => {
    subscribeToParameterChanges(getAudioGraphInstance(), 'tonality');
    const dropdownOptions = getAudioGraphInstance().getParameterDescription('tonality').options.map(option=> {
        return {label: transformaNomTonalitat(option), value: option}
    });
    
    const currentTonality = getAudioGraphInstance().getTonality();

    const handleTonalityChange = (event) => {
        const selectedTonality = event.target.value;
        getAudioGraphInstance().updateParametreAudioGraph('tonality', selectedTonality);
    };

    const tonalitatctrlId = useId();
    return (
        <div className={`tonality-selector ${className}`}>
            {label!==null && <label htmlFor={tonalitatctrlId}>{label || parameterDescription.label}</label>}
            <Dropdown id={tonalitatctrlId}
                value={currentTonality}  
                options={dropdownOptions}
                onChange={handleTonalityChange}
                placeholder="Selecciona Tonalitat"  
                scrollHeight="200px"  
                className="small-font-dropdown"  
            />
        </div>
    );
};

export const GrufSelectorPlayerMode = ({estacio, parameterName, top, left}) => {
    subscribeToParameterChanges(estacio, parameterName);
    const playerModeOptions = estacio.getParameterDescription(parameterName).options;
    const parameterValue = estacio.getParameterValue(parameterName);
    const inputsLabels = playerModeOptions.map((playerModeOption, i)=> {
        const inputId = useId();
        return {
        input: <input type="radio" key={i} id={inputId} name={parameterName}
            value={playerModeOption} checked={playerModeOption===parameterValue}
            onChange={(e) => estacio.updateParametreEstacio(parameterName, e.target.value)}
        />,
        label: <label key={i} htmlFor={inputId}>{playerModeOption}</label>
        }   
    })
    return(
        <fieldset className="gruf-selector-playermode">
            <div className="inputs">{inputsLabels.map(inputLabel=> inputLabel.input)}</div>
            <div className="labels text-accent">{inputsLabels.map(inputLabel=> inputLabel.label)}</div>
        </fieldset>
    )
    
}

export const GrufSelectorSonsSampler = ({estacio, parameterName, top, left, width}) => {
    subscribeToParameterChanges(estacio, parameterName);
    subscribeToAudioGraphParameterChanges('tonality');
    [inputMeterPercent, setInputMeterPercent] = useState(0);

    const selectedSoundName = estacio.getParameterValue(parameterName);
    const showTrashOption = getCurrentSession().getRecordedFiles().indexOf(selectedSoundName) > -1;
    const tonalitat = getAudioGraphInstance().getTonality();

    const extractUserRecordingNumberFromFilename = (filename) => {
        return parseInt(filename.split('_num_')[1].split('.')[0], 10);
    }

    const options = 
        [...getCurrentSession().getRecordedFiles().map((item, i) => ({
            'label': 'Gravació usuari ' + extractUserRecordingNumberFromFilename(item), 
            'value': item,
            'tonality': undefined
        })),
        ...sampleLibrary.sampler.map(item => ({
            'label': item.name + ' (' + transformaNomTonalitat(item.tonality) + ')', 
            'value': item.name,
            'tonality': item.tonality
        })).sort((item1, item2)=>(item2.tonality === tonalitat ? 1 : 0) - (item1.tonality === tonalitat ? 1 : 0)) // make the options in the current tonality show first
    ];
    
    const optionNames = options.map(item => item.value);
    const handleRemoveFileButton = (soundName) => {
        const deleteFileUrl = appPrefix + '/delete_file/' + getCurrentSession().getID() + '/';
        var fd = new FormData();
        fd.append('filename', soundName);
        fetch(deleteFileUrl, { 
            method: "POST", 
            body: fd,
        })
        .then(response => {
            response.json().then(data => {
                if (!data.error){
                    // In local mode, simulate receiving a parameter update with the updated list of avialable files
                    getCurrentSession().receiveUpdateParametreSessioFromServer('recorded_files', data.recorded_files)
                    
                    // Load a different sound in the sampler
                    let selectedOptionIndex = optionNames.indexOf(selectedSoundName);
                    const filteredOptionNames = optionNames.filter(item => item !== soundName);
                    if (selectedOptionIndex > -1) {
                        if (selectedOptionIndex >= filteredOptionNames.length) {
                            selectedOptionIndex = filteredOptionNames.length - 1;
                        }
                        estacio.updateParametreEstacio(parameterName, filteredOptionNames[selectedOptionIndex])
                    }
                }
            });
        })
    }

    const tonalitatSample = getTonalityForSamplerLibrarySample(selectedSoundName);
    const optionTemplate = (option) => {
        const tonalitatSampleLlista = option.tonality
        let optionTonalitatClass = "";
        if (!tonalitatsCompatibles(tonalitat, tonalitatSampleLlista)) optionTonalitatClass = "text-red";
        if (tonalitatSampleLlista === undefined) optionTonalitatClass = "text-orange";
        return (
            <span className={optionTonalitatClass}>{option.label}</span>
        );
    };

    let tonalitatClass = "";
    if (!tonalitatsCompatibles(tonalitat, tonalitatSample)) tonalitatClass = "text-red";
    if (tonalitatSample === undefined) tonalitatClass = "text-orange";

    return (
        <div>
            <div className="flex justify-between gap-10">
                <div className="gruf-selector-patrons-grid flex" style={{top: top, left: left, width: width}}>
                    <Dropdown
                        className= {tonalitatClass}
                        itemTemplate={optionTemplate}
                        value={selectedSoundName}
                        onChange={(evt) => {
                            estacio.updateParametreEstacio(parameterName, evt.target.value)
                        }}
                        options={options}
                        placeholder="Cap"
                    />
                    {showTrashOption ? <div><button className="trash-button" onClick={() => {handleRemoveFileButton(selectedSoundName)}}><img  style={{width: "20px"}} src={appPrefix + "/static/src/img/trash.svg"}></img></button></div>: ''}
                </div>
                <AudioRecorder setInputMeterPercent={setInputMeterPercent} onRecordUploadedCallback={(data) => {
                    console.log("Sound uploaded to server: ", data.url);
                    estacio.updateParametreEstacio(parameterName, data.url.split("/").slice(-1)[0])
                }} />
            </div>
            <div id="inputMeterInner" style={{width: inputMeterPercent + "%", height: '5px', marginTop: '3px', backgroundColor:'green'}}></div>
        </div>
    )
}

export const GrufSelectorPitch = ({estacio, selectedPad}) => {
    const tonalitat = getAudioGraphInstance().getTonality();
    const tonalitatSample = getTonalityForSamplerLibrarySample(estacio.getParameterValue('sound'));
    const valorPitchSelectedSlice = estacio.getParameterValue(`pitch${selectedPad + 1}`);
    const tonalitatSampleModificada = modificaTonalitatPerSemitons(tonalitatSample, valorPitchSelectedSlice);
    let sliceTonalitatCorrecta = tonalitatsCompatibles(tonalitat, tonalitatSampleModificada);
    if (tonalitatSample === undefined) {
        sliceTonalitatCorrecta = true  // Si no sabem la tonalitat del sample, no la marquem vermella mai
    }
    
    subscribeToParameterChanges(estacio, `sound`);
    for (let i = 0; i < 16; i++) {
        subscribeToParameterChanges(estacio, `pitch${i + 1}`);
    }

    return <GrufKnob mida="petit" parameterParent={estacio} parameterName={`pitch${selectedPad + 1}`} label='Pitch' colorizeLabel markLabelRed={!sliceTonalitatCorrecta} />
}

export const ADSRGraph = ({estacio, adsrParameterNames, dynamicHighlight, volumeParamName}) => {
    useEffect(()=> {
        if (dynamicHighlight) {
            document.addEventListener("midiNote-" + estacio.nom , onMidiNote);
            () => document.removeEventListener("midiNote-" + estacio.nom, onMidiNote)
        }
    }, []);

    const lastNoteInfoRef = useRef({});
    const onMidiNote = (evt) => {
        const {a, d, r} = adsrRef.current;
        let lastNoteInfo = lastNoteInfoRef.current;
        const {type, note} = evt.detail;
        if (type === "noteOff") {
            if (note !== lastNoteInfo.note && !estacio.getParameterDescription('notes').isMono) return;
            lastNoteInfo = {stage: 'release', duration: r*1000};
        } else lastNoteInfo = {stage: 'pre-sustain', duration: (a+d)*1000, note};
        lastNoteInfo = {...lastNoteInfo, initTime: Date.now()};
        lastNoteInfoRef.current = lastNoteInfo;
        checkLastNoteStatus();
    }

    const [lastNoteStatus, setLastNoteStatus] = useState({stage: 'finished', progress: '1'})
    const checkLastNoteStatus = () => {
        const lastNoteInfo = lastNoteInfoRef.current;
        const elapsedTime = Date.now() - lastNoteInfo.initTime;
        const progress = Math.min(lastNoteInfo.duration === 0 ? 1 : elapsedTime / lastNoteInfo.duration, 1);
        let stage = lastNoteInfo.stage;
        if (progress === 1) {
            if (stage === 'pre-sustain') stage = 'sustain';
            if (stage === 'release') stage = 'finished';
        }
        setLastNoteStatus({progress, stage})
        if (progress < 1) setTimeout(checkLastNoteStatus, 30);
    }

    adsrParameterNames.forEach(parameterName => subscribeToParameterChanges(estacio, parameterName));
    const a = estacio.getParameterValue(adsrParameterNames[0]);
    const d = estacio.getParameterValue(adsrParameterNames[1]);
    const s = estacio.getParameterValue(adsrParameterNames[2]);
    const r = estacio.getParameterValue(adsrParameterNames[3]);
    const adsrRef = useRef({});
    adsrRef.current = {a, d, s, r};

    if (volumeParamName) subscribeToParameterChanges(estacio, volumeParamName);
    const v = volumeParamName ? estacio.getParameterValue(volumeParamName) : 0;  // in dB units, minimum -60, maximum 6
    const minv = -60;
    const maxv = 6;
    const v01 = (v - minv) / (maxv - minv);

    const strokeWidthPx = 3;

    const timeValues = [a, d, r];

    const maxTime = 9; // knowing that the sum of the max values for attack, decay and release is 9. maybe it could get it automatically?
    const sustainTime = maxTime - timeValues.reduce((sum, element)=> sum + element);
    const timeValuesWithSustain = [a, d, sustainTime, r];

    const absoluteTimeValues = distanceToAbsolute(timeValuesWithSustain);

    const adsrPoints = absoluteTimeValues.map((absTimeValue) => {
        const normTimeValue = absTimeValue / maxTime;
        return {x: normTimeValue * (100 - strokeWidthPx / 2) + strokeWidthPx / 4}; // we account for stroke width so that the line isn't clipped
    });

    const levelValues = [0, 1, s, s, 0];

    levelValues.forEach((levelValue, index) => {
        adsrPoints[index].y = 75 - levelValue * 50 * v01;
    });

    const sustainPoints = [adsrPoints[2], adsrPoints[3]];

    const adsrPathString = adsrPoints.reduce((pathString, point) => {
        return pathString + ` L ${point.x} ${point.y}`;
    }, `M ${strokeWidthPx/4} 75`);

    const gridSize = 4;
    let bgLineItems = [];
    for (let i = 1; i < gridSize; i++) {
        const crossAxisPos = i / (gridSize) * 100;
        const hLine = <line key={`bgHLine-${i}`} x1='0' x2='100' y1={crossAxisPos} y2={crossAxisPos} vectorEffect="non-scaling-stroke"/>
        const vLine = <line key={`bgVLine-${i}`} x1={crossAxisPos} x2={crossAxisPos} y1='100' y2='0' vectorEffect="non-scaling-stroke"/>
        bgLineItems.push(hLine, vLine);
    }

    const getEnvStatusLine = () => {
        const {stage, progress} = lastNoteStatus;
        if (stage === 'finished') return undefined;
        let endPoints = [{}, {}];
        if (stage === 'pre-sustain' || 'sustain') endPoints = [adsrPoints[0], sustainPoints[0]];
        if (stage === 'release') endPoints = [sustainPoints[1], adsrPoints[adsrPoints.length - 1]];
        const x = lerp(endPoints[0].x, endPoints[1].x, progress);
        const lastPoint = adsrPoints.reduce((result, current) => (current.x >= x || current.x < result.x) ? result : current);
        const nextPoint = adsrPoints[adsrPoints.indexOf(lastPoint)+1];
        const segmentDuration = nextPoint.x - lastPoint.x;
        const segmentProgress = segmentDuration === 0 ? 1 : (x - lastPoint.x) / segmentDuration;
        const y = lerp(lastPoint.y, nextPoint.y, segmentProgress);
        return <g>
            <rect x={x-20} y="25" width="20" height="50" vectorEffect="non-scaling-stroke" fill="url(#grad)" mask="url(#adsr-mask)"/>
            <circle cx={x} cy={y} r="0.9" fill="var(--accent-color)"/>
        </g>
    }

    const envStatusLine = getEnvStatusLine()
    return (
        <div className="adsr-graph">
            <svg viewBox={"0 0 100 100"} preserveAspectRatio="none">
                <g stroke="#555" strokeDasharray="1 4" strokeLinecap="round">
                    {bgLineItems}
                </g>

                <defs>
                    <mask id="sustain-mask">
                        <rect x="0" y="0" width="100" height="100" fill="white"/>
                        <g fill="black" stroke="black">
                            <line
                            x1={sustainPoints[0].x} x2={sustainPoints[1].x}
                            y1={sustainPoints[0].y} y2={sustainPoints[1].y}
                            vectorEffect="non-scaling-stroke" strokeWidth={strokeWidthPx}
                            strokeLinecap="round" />
                            <g fill="white" stroke="white">
                                <line
                                    x1={sustainPoints[0].x} x2={sustainPoints[1].x}
                                    y1={sustainPoints[0].y} y2={sustainPoints[1].y}
                                    vectorEffect="non-scaling-stroke" strokeWidth={strokeWidthPx}
                                    strokeLinecap="round" strokeDasharray="8"/>
                            </g>
                        </g>
                    </mask>
                    <mask id="adsr-mask">
                        <path d={adsrPathString + " Z"} fill="white" stroke="white" strokeWidth={strokeWidthPx} vectorEffect="non-scaling-stroke" strokeLinejoin="round"></path>
                    </mask>
                    <linearGradient id="grad">
                        <stop offset="0%" stopColor="transparent"/>
                        <stop offset="80%" stopColor="color-mix(in srgb, var(--accent-color) 10%, transparent)"/>
                        <stop offset="90%" stopColor="color-mix(in srgb, var(--accent-color) 30%, transparent)"/>
                        <stop offset="100%" stopColor="var(--accent-color)"/>
                    </linearGradient>
                </defs>

                <g fill="color-mix(in srgb, var(--accent-color) 10%, transparent)" stroke="var(--accent-color)" strokeWidth={strokeWidthPx} strokeLinecap="round" strokeLinejoin="round">
                    <path d={adsrPathString} vectorEffect="non-scaling-stroke" mask="url(#sustain-mask)" stroke="color-mix(in srgb, var(--accent-color) 90%, transparent)"></path>
                </g>
                {envStatusLine && envStatusLine}
            </svg>
        </div>
    )
}

export const SpectrumGraph = () => {
    const [spectrumData, setSpectrumData] = useState(getAudioGraphInstance().getMasterSpectrumData());
    useEffect(() => {
        document.spectrumInterval = setInterval(() => {
            const newSpectrumData = getAudioGraphInstance().getMasterSpectrumData();
            if (newSpectrumData) setSpectrumData(new Float32Array(newSpectrumData));
        }, 100);

        return () => clearInterval(document.spectrumInterval);
    });

    const columns = getAudioGraphInstance().getMasterSpectrumSize();
    const rows = 32;

    const fgLineItems = [];
    for (let xPos = 0; xPos <= columns; xPos++) {
        const vLine = <line key={`fgVLine-${xPos}`} x1={xPos} x2={xPos} y1={rows} y2='0' vectorEffect="non-scaling-stroke"/>
        fgLineItems.push(vLine);
    }
    for (let yPos = 0; yPos <= rows; yPos++) {
        const hLine = <line key={`fgHLine-${yPos}`} x1='0' x2={columns} y1={yPos} y2={yPos} vectorEffect="non-scaling-stroke"/>
        fgLineItems.push(hLine);
    }

    // if spectrumdata is undefined, we do it with an empty array, which will later evaluate to false
    const levelRectangles = Array.from(spectrumData || []).map((sampleValue, index) => {
        const minDb = -100;
        const maxDb = 0;
        const normSampleValue = (clamp(sampleValue, minDb, maxDb)-minDb)/(maxDb-minDb);
        const height = Math.round(normSampleValue * rows); // rounded to half the grid square

        return <rect key={`levelRect-${index}`} x={index} width='1' y={(rows-height)/2} height={height} />
    });

    return (
        <div className="spectrum-graph">
            <svg width='100%' height='100%' viewBox={`0 0 ${columns} ${rows}`} preserveAspectRatio="none">
                <g fill="var(--accent-color)">
                    {levelRectangles && levelRectangles}
                </g>
                <g stroke="#555">
                    {fgLineItems}
                </g>
            </svg>
        </div>
    )
}

export const IkigaiMetronome = ({ isMetronomeActive }) => {
    const [bpm, setBpm] = useState(getAudioGraphInstance().getBpm());
  
    useEffect(() => {
      const interval = setInterval(() => {
        const newBpm = getAudioGraphInstance().getBpm();
        if (newBpm !== bpm) {
          setBpm(newBpm);
        }
      }, 100); 
  
      return () => clearInterval(interval); 
    }, [bpm]);
  
    const animationDuration = 60 / bpm; 
  
    return (
      <div className="metronome-ikigai-container">
        <div
          className={`circle-left ${isMetronomeActive ? 'circle-alternate' : ''}`}
          style={{
            animationDuration: `${animationDuration}s`,
          }}
        ></div>
        <div
          className={`circle-right ${isMetronomeActive ? 'circle-alternate' : ''}`}
          style={{
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDuration / 2}s`, // Retardo para alternar la iluminación
          }}
        ></div>
      </div>
    );
  };