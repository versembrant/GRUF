import { useState, useRef, useEffect, useId, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { num2Norm, norm2Num, real2Num, num2Real, real2String, getParameterNumericMin, getParameterNumericMax, getParameterStep, indexOfArrayMatchingObject, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom, capitalizeFirstLetter, clamp , transformaNomTonalitat, getTonalityForSamplerLibrarySample, subscribeToAudioGraphParameterChanges, subscribeToPresetChanges }  from "../utils";
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
import { subscribeToStoreChanges, subscribeToParameterChanges, updateParametre } from "../utils";
import throttle from 'lodash.throttle'
import { AudioRecorder } from "../components/audioRecorder";


import cssVariables from '../../styles/exports.module.scss';
import { circularProgressClasses } from "@mui/material";

const valueToText = (value) => {
    return `${value >= 5 ? value.toFixed(0) : value.toFixed(2)}`;
}

export const createRecordingHandler = (estacio, parameterDescription) => {
    const recordingElementId = estacio.nom + '_' + parameterDescription.nom + '_REC';

    const toggleRecording = (button) => {
        const recordingInputElement = document.getElementById(recordingElementId);
        if (recordingInputElement.checked) {
            recordingInputElement.checked = false;
            button.classList.remove('recording');
        } else {
            recordingInputElement.checked = true;
            button.classList.add('recording');
        }
    };

    return { recordingElementId, toggleRecording };
};

export const GrufSeparatorLine = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1 1"
            preserveAspectRatio="none" // so that the viewBox doesn't need to scale evenly
            width="2px" height="80%">
            <line x1="0" x2="0" y1="0" y2="1"
            stroke={cssVariables.lightGrey}/>
        </svg>
    )
}

export const GrufLegend = ({ text, bare=false }) => {
    // we actually style the span element inside the legend element :)
    return (
        <legend style={{display: "contents"}}><span className={`gruf-legend ${bare ?  "bare" : ""}`}>{text}</span></legend> 
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

export const GrufButtonNoBorder = ({text, top, left, onClick}) => {
    return (
        <button className="btn-gruf no-border" onClick={onClick} style={{top: top, left: left}}>
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


export const GrufKnob = ({ parameterParent, parameterName, position, top, left, label, mida, noOutput=false, customWidth=undefined, customHeight=undefined }) => {
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
                <label htmlFor={knobctrlId}>{label || parameterDescription.label}</label>
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

export const GrufReverbTime = ({estacio, parameterName, top, left}) => {
    subscribeToParameterChanges(estacio, parameterName);
    const parameterValue=estacio.getParameterValue(parameterName);
    const nomEstacio=estacio.nom;
    
    return (
        <div className="gruf-reverb-time" style={{top: top, left: left}}>
            <div>Curta</div><div><button
                style={{width: "20%"}}
                className={parameterValue == "1.0" ? 'selected' : ''} 
                onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, "1.0")}
            ></button></div>
            <div>Mitja</div><div><button
                style={{width: "50%"}}
                className={parameterValue == "5.0" ? 'selected' : ''} 
                onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, "5.0")}
            ></button></div>
            <div>Llarga</div><div><button
                style={{width: "100%"}}
                className={parameterValue == "12.0" ? 'selected' : ''} 
                onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, "12.0")}
            ></button></div>
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

export const GrufPad = ({ estacio, playerIndex, onClick, isSelected, label }) => {
    const [isClicked, setIsClicked] = useState(false);
    const [isHeld, setIsHeld] = useState(false);
    const holdTimer = useRef(null);
    const nomEstacio = estacio.nom;

    const handleMouseDown = (evt) => {
        setIsClicked(true);
        playSample(playerIndex);
        setIsHeld(true);  // He canviar el comportament de "is held" perquè sempre soni la nota quan es toca el pad. Però com que només sona mentre el pad s'aguanta, no passa res si es clicka rapid per triar un pad
    };

    const handleMouseUp = (evt) => {
        if (isHeld) {
            clearTimeout(holdTimer.current);
            setIsClicked(false);
            setIsHeld(false);
            stopSample(playerIndex);
            onClick(playerIndex);
        }
    };

    const playSample = async (playerIndex) => {
        if (!getAudioGraphInstance().isGraphBuilt()){return;}
        const estacio = getCurrentSession().getEstacio(nomEstacio);
        if (estacio && estacio.playSoundFromPlayer) {
            estacio.playSoundFromPlayer(playerIndex, Tone.now());
        }
    }; 

    const stopSample = (playerIndex) => {
        if (!getAudioGraphInstance().isGraphBuilt()){return;}
        const estacio = getCurrentSession().getEstacio(nomEstacio);
        if (estacio && estacio.playSoundFromPlayer) {
            estacio.stopSoundFromPlayer(playerIndex, Tone.now());
        }
    }; 

    return (
        <div className="gruf-pad">
            <Button
                className={ isClicked || isSelected ? 'selected': '' }
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseOut={handleMouseUp}
                label={label}
            />
        </div>
    )
}

export const GrufPadGrid = ({ estacio, top, left, width="200px", height="200px", onPadClick, currentSelectedPad }) => {
    return (
        <div className="pad-grid" style={{ top: top, left: left, width: width, height:height }}>
            {Array.from({ length: 16 }).map((_, index) => (
                <GrufPad
                    key={index}
                    playerIndex={index}
                    onClick={onPadClick}
                    estacio={estacio}
                    isSelected={currentSelectedPad===index}
                    label={index + 1}
                />
            ))}
        </div>
    );
};

export const GrufToggle = ({ estacio, parameterName, top, left}) => {
    subscribeToParameterChanges(estacio, parameterName);

    const parameterValue = estacio.getParameterValue(parameterName);

    const handleClick = () => { // En clicar, invertim el valor i l'actualitzem
        estacio.updateParametreEstacio(parameterName, !parameterValue);
    };

    return (
        <div className="gruf-toggle" style={{ top: top, left: left }}>
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
            const isActive = (currentStep == stepIndex && (getAudioGraphInstance().isPlayingLive() || (getAudioGraphInstance().isPlayingArranjement() && estacio.getCurrentLivePreset() === estacio.arranjementPreset )));
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

    const { recordingElementId, toggleRecording } = createRecordingHandler(estacio, parameterDescription);
    
    return (
        <div className="gruf-on-off-grid" style={{ top: top, left: left}}>
            <div className="grid-default" style={transformStyle}>
                {stepsElementsPerRow.map(function(stepsElements, i){
                    return <div className="grid-row-default" key={'row_' + i}>{stepsElements}</div>;
                })}
            </div>
            <div className="gruf-grid-controls" style={{ position: 'fixed', top: '245px', left: '465px' }}>
                { parameterDescription.showRecButton && (
                    <>
                        <input id={recordingElementId} type="checkbox" style={{ display: "none" }} />
                        <button onMouseDown={(evt) => toggleRecording(evt.target)} style={{ marginBottom: '8px' }}>Rec</button>
                    </>
                )}
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
                position: 'absolute',
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


export const GrufSelectorPresets = ({ className, estacio, top, left, buttonSize="20px" }) => {
    subscribeToPresetChanges();
    return (
        <div className={`gruf-selector-presets ${className}`} style={{ top: top, left: left }}>
            {[...Array(estacio.numPresets).keys()].map(i => 
                <div
                    key={"preset_" + i}
                    className={(getCurrentSession().getLivePresetsEstacions()[estacio.nom] == i ? " selected" : "")}
                    onClick={() => { getCurrentSession().setLivePresetForEstacio(estacio.nom, i) }}
                    style={{
                        width: buttonSize,
                        height: buttonSize,
                        lineHeight: buttonSize,
                    }}
                >
                    {i + 1}
                </div>
            )}
        </div>
    );
};

export const GrufPianoRoll = ({ className, estacio, parameterName, top, left, width="500px", height="200px", monophonic=false, colorNotes, modeSampler, triggerNotes=true }) => {
    subscribeToParameterChanges(estacio, parameterName);
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar playhead position i tonality
    subscribeToPresetChanges();

    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName);
    const numSteps =  estacio.getNumSteps();
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const uniqueId = estacio.nom + "_" + parameterDescription.nom
    let lastEditedData = "";
    const getAllowedNotesForTonality = (tonality) => {
        const midiNotesMap = {
            'c': 60,  'c#': 61, 'db': 61,
            'd': 62,  'd#': 63, 'eb': 63,
            'e': 64,  'f': 65,  'f#': 66, 'gb': 66,
            'g': 67,  'g#': 68, 'ab': 68,
            'a': 69,  'a#': 70, 'bb': 70,
            'b': 71
        };
    
        const parseTonality = (tonality) => {
            let rootNote = tonality.slice(0, 2).toLowerCase();
            //Comprova si la root té alteracions, sinó, torna a separar. 
            if (!midiNotesMap[rootNote]) {
                rootNote = tonality.slice(0, 1).toLowerCase();
            }
    
            const isMinor = tonality.toLowerCase().includes('minor');
    
            if (!midiNotesMap[rootNote]) {
                throw new Error(`Root note no vàlida: ${rootNote}`);
            }
    
            return {
                rootMidi: midiNotesMap[rootNote],  
                isMinor: isMinor                  
            };
        };
    
        const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];  
        const minorScaleIntervals = [0, 2, 3, 5, 7, 8, 10];  
    
        const { rootMidi, isMinor } = parseTonality(tonality);
    
        const scaleIntervals = isMinor ? minorScaleIntervals : majorScaleIntervals;
    
        let allowedNotes = [];
    
        for (let octave = -2; octave <= 8; octave++) { 
            const octaveOffset = octave * 12; 
            scaleIntervals.forEach(interval => {
                const note = rootMidi + interval + octaveOffset;
                if (note >= 0 && note <= 127) {  // Midi range permitido
                    allowedNotes.push(note);
                }
            });
        }
    
        return allowedNotes;
    };
    const tonality = getAudioGraphInstance().getTonality(); 
    
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
                    sendNoteOn(evt.detail.midiNote, 127, skipTriggerEvent=true);
                    setTimeout(() => {
                        sendNoteOff(evt.detail.midiNote, 0);
                    }, evt.detail.durationInBeats * Tone.Time("16n").toSeconds() * 1000);
                });
            }
            document.addEventListener("midiNoteOn-" + estacio.nom , (evt) => {
                let noteNumber = evt.detail.note;                
                if (parameterDescription.hasOwnProperty("rangDeNotesPermeses")) {
                    const notaMesBaixaPermesa = parameterDescription.notaMesBaixaPermesa || 0;
                    noteNumber = notaMesBaixaPermesa + ((noteNumber - notaMesBaixaPermesa )  % parameterDescription.rangDeNotesPermeses);   
                }
                const noteHeight = jsElement.height/jsElement.yrange;
                let bottomPosition = noteHeight * noteNumber;
                const canvasOffset = jsElement.yoffset*noteHeight;
                bottomPosition = bottomPosition - canvasOffset;

                if ((bottomPosition >= 0) && (bottomPosition <= jsElement.height - 10)) {
                    const noteMarker = document.createElement('div');
                    noteMarker.style.position = 'absolute';
                    noteMarker.style.bottom = (bottomPosition + 38) + 'px';
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

                    setTimeout(() => {
                        noteMarker.remove();
                    }, 500);
                }
            })
            
            jsElement.dataset.alreadyBinded = true;
        } else {
            if (jsElement.dataset.lastTonality !== tonality) {
                jsElement.setAllowedNotes(getAllowedNotesForTonality(tonality));
                jsElement.dataset.lastTonality = tonality;
            }
        }

        if (!isequal(jsElement.sequence, appSequenceToWidgetSequence(parameterValue))) {
            jsElement.sequence = appSequenceToWidgetSequence(parameterValue)
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
            'f': value.s,  // note is selected
            'on': value.on,  // original note
            'ot': value.ob,  // original time
            'og': value.od,  // original duration
        }})
    }

    const widgetSequenceToAppSequence = (wSequence) => {
        return wSequence.map(value => {return {
            'b': value.t,  // beat position
            'n': value.n,  // midi note number
            'd': value.g,  // note duration in beats
            's': value.f,  // note is selected
            'on': value.on,  // original note
            'ob': value.ot,  // original time
            'od': value.og,  // original duration
        }})
    }

    const handleSequenceEdited = (widgetSequence) => {
        estacio.updateParametreEstacio(parameterDescription.nom, widgetSequenceToAppSequence(widgetSequence))
    }

    const getLowestNoteForYOffset = () => {
        // Gets the lowest midi note value in the sequence, or a sensible default to be used in the piano roll
        if (parameterDescription.permetScrollVertical === 0) {
            return parameterDescription.notaMesBaixaPermesa;
        }

        let lowestNote = 127
        for (let i = 0; i < parameterValue.length; i++) {
            if (parameterValue[i].n < lowestNote) {
                lowestNote = parameterValue[i].n
            }
        }
        if (lowestNote == 127) {
            return parameterDescription.notaMesBaixaPermesa || 48
        } else {
            return lowestNote
        }
    }

    // Available webaudio-pianoroll attributes: https://github.com/g200kg/webaudio-pianoroll
    const position = (top || left) ? "absolute" : "static"; // TODO: remove
    return (
        <div className={`gruf-piano-roll ${className}`} style={{ overflow:"hidden", position, top, left}}>
                <gruf-pianoroll
                    id={uniqueId + "_id"}
                    editmode={monophonic ? "dragmono" : "dragpoly"}
                    secondclickdelete={true}
                    allowednotes={modeSampler === undefined ? getAllowedNotesForTonality(tonality): []}
                    width={width.replace('px', '')}
                    grid={2}
                    xrange={numSteps}
                    yrange={parameterDescription.rangDeNotesPermeses || 36}
                    yoffset={modeSampler === undefined ? getLowestNoteForYOffset(): 0}
                    xruler={0}
                    markstart={-10}  // make it dissapear
                    markend={-10}  // make it dissapear
                    //cursoroffset={2500}  // make it dissapear
                    yscroll={parameterDescription.hasOwnProperty('permetScrollVertical') ? parameterDescription.permetScrollVertical : 1}
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
                    cursorsrc={"/gruf/static/src/img/playhead_long.svg"}
                    kbwidth={modeSampler === undefined ? 65: 0}
                    kbstyle={modeSampler === undefined ? "piano": "midi"}
                    yruler={modeSampler === undefined ? 20: 22}
                ></gruf-pianoroll>
        </div>
    )
};

export const GrufNoteControls = ({ className, estacio, width }) => {
    const { recordingElementId, toggleRecording } = createRecordingHandler(estacio, "notes");
    return(
        <fieldset className={className} style={{width: width}}>
            <GrufSelectorPresets className="flex flex-wrap gap-10 justify-between" estacio={estacio} buttonSize="70px"/>
            <fieldset className="flex flex-col gap-10">
                <input id={recordingElementId} type="checkbox" style={{display:"none"}}/>
                <button onMouseDown={(evt)=> estacio.updateParametreEstacio("notes", [])}>Clear</button>
                <button onMouseDown={(evt)=> toggleRecording(evt.target)}>Rec</button>
            </fieldset>
        </fieldset>
    )
}

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
            <button onMouseDown={(evt)=> estacio.updateParametreEstacio(parameterDescription.nom, [])}>Clear</button>
        </div>
    )
}

export const GrufSelectorTonalitat = ({ className, label="Tonalitat" }) => {
    subscribeToParameterChanges(getAudioGraphInstance(), 'tonality');
    const dropdownOptions = getAudioGraphInstance().getParameterDescription('tonality').options.map(option=> {
        const root = option.slice(0, -5).replace(/^(.)b$/, '$1♭');
        const rootTranslations = {"c": "do", "d": "re", "e": "mi", "f": "fa", "g": "sol","a": "la", "b": "si"};
        const catRoot = root.split('').map(char => rootTranslations[char] || char).join('');
        const mode = option.slice(-5);
        const catMode = mode.replace('minor', 'menor');
        return {label: capitalizeFirstLetter(`${catRoot} ${catMode}`), value: option}
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

export const GrufSelectorLoopMode = ({estacio, parameterName, top, left}) => {
    subscribeToParameterChanges(estacio, parameterName);
    const loopModeOptions = estacio.getParameterDescription(parameterName).options;
    const parameterValue = estacio.getParameterValue(parameterName);
    const inputs = loopModeOptions.map((loopModeOption, i)=> {
        return <input type="radio" key={i} name={parameterName}
        value={loopModeOption} checked={loopModeOption===parameterValue}
        onChange={(e) => estacio.updateParametreEstacio(parameterName, e.target.value)}/>
    })
    return(
        <fieldset className="gruf-selector-loopmode">{inputs}</fieldset>
    )
    
}

export const GrufSelectorSonsSampler = ({estacio, parameterName, top, left, width}) => {
    subscribeToParameterChanges(estacio, parameterName);
    subscribeToAudioGraphParameterChanges('tonality');
    [inputMeterPercent, setInputMeterPercent] = useState(0);

    const selectedSoundName = estacio.getParameterValue(parameterName);
    const showTrashOption = getCurrentSession().getRecordedFiles().indexOf(selectedSoundName) > -1;
    const tonalitat = getAudioGraphInstance().getTonality();

    const options = 
        [...getCurrentSession().getRecordedFiles().map((item, i) => ({
            'label': 'Gravació usuari ' + (i + 1), 
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
        return (
            <span className={((tonalitatSampleLlista !== undefined) && (tonalitat !== tonalitatSampleLlista)) ? "text-red": ""}>{option.label}</span>
        );
    };

    return (
        <div>
            <div className="flex">
                <div className="gruf-selector-patrons-grid" style={{top: top, left: left, width:(showTrashOption ? parseInt(width.replace("px", "")) -20: width)}}>
                    <Dropdown
                        className= {((tonalitatSample !== undefined) && (tonalitat !== tonalitatSample)) ? "text-red": ""}
                        itemTemplate={optionTemplate}
                        value={selectedSoundName}
                        onChange={(evt) => {
                            estacio.updateParametreEstacio(parameterName, evt.target.value)
                        }}
                        options={options}
                        placeholder="Cap"
                    />
                    {showTrashOption ? <button style={{width: "22px", verticalAlign: "bottom" }} onClick={() => {handleRemoveFileButton(selectedSoundName)}}><img src={appPrefix + "/static/src/img/trash.svg"}></img></button>: ''}
                </div>
                <AudioRecorder setInputMeterPercent={setInputMeterPercent} onRecordUploadedCallback={(data) => {
                    console.log("Sound uploaded to server: ", data.url);
                    estacio.updateParametreEstacio('selectedSoundName', data.url.split("/").slice(-1)[0])
                }} />
            </div>
            <div id="inputMeterInner" style={{width: inputMeterPercent + "%", height: '5px', marginTop: '3px', backgroundColor:'green'}}></div>
        </div>
    )
}

export const ADSRGraph = ({estacio, adsrParameterNames}) => {
    adsrParameterNames.forEach(parameterName => subscribeToParameterChanges(estacio, parameterName));

    const a = estacio.getParameterValue(adsrParameterNames[0]);
    const d = estacio.getParameterValue(adsrParameterNames[1]);
    const s = estacio.getParameterValue(adsrParameterNames[2]);
    const r = estacio.getParameterValue(adsrParameterNames[3]);

    const strokeWidthPx = 3;

    const timeValues = [a, d, r];

    const maxTime = 9; // knowing that the sum of the max values for attack, decay and release is 9. maybe it could get it automatically?
    const sustainTime = maxTime - timeValues.reduce((sum, element)=> sum + element);
    const timeValuesWithSustain = [a, d, sustainTime, r];

    const absoluteTimeValues = timeValuesWithSustain.reduce((absoluteValuesArray, timeValue, index) => {
        const absoluteTimeValue = timeValue + (absoluteValuesArray[index-1] || 0);
        absoluteValuesArray.push(absoluteTimeValue);
        return absoluteValuesArray;
    }, []);

    const adsrPoints = absoluteTimeValues.map((absTimeValue) => {
        const normTimeValue = absTimeValue / maxTime;
        return {x: normTimeValue * (100 - strokeWidthPx / 2) + strokeWidthPx / 4}; // we account for stroke width so that the line isn't clipped
    });

    const levelValues = [1, s, s, 0];

    levelValues.forEach((levelValue, index) => {
        adsrPoints[index].y = 75 - levelValue * 50;
    });

    const sustainPoints = { x1: adsrPoints[1].x, x2: adsrPoints[2].x, y1: adsrPoints[1].y, y2: adsrPoints[2].y };

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


    return (
        <div className="adsr-graph">
            <svg viewBox={"0 0 100 100"} preserveAspectRatio="none">
                <g stroke="#555" strokeDasharray="1 4" strokeLinecap="round">
                    {bgLineItems}
                </g>

                <defs>
                    <mask id="adsr-mask">
                        <rect x="0" y="0" width="100" height="100" fill="white"/>
                        <g fill="black" stroke="black">
                            <line
                            x1={sustainPoints.x1} x2={sustainPoints.x2}
                            y1={sustainPoints.y1} y2={sustainPoints.y2}
                            vectorEffect="non-scaling-stroke" strokeWidth={strokeWidthPx}
                            strokeLinecap="round" />
                            <g fill="white" stroke="white">
                                <line
                                    x1={sustainPoints.x1} x2={sustainPoints.x2}
                                    y1={sustainPoints.y1} y2={sustainPoints.y2}
                                    vectorEffect="non-scaling-stroke" strokeWidth={strokeWidthPx}
                                    strokeLinecap="round" strokeDasharray="8"/>
                            </g>
                        </g>
                    </mask>
                </defs>

                <g fill="none" stroke="var(--accent-color)" strokeWidth={strokeWidthPx} strokeLinecap="round">
                    <path d={adsrPathString} vectorEffect="non-scaling-stroke" mask="url(#adsr-mask)" strokeLinejoin="round"></path>
                </g>

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