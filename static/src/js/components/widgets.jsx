import { useState, useRef, useEffect, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { real2Norm, norm2Real, indexOfArrayMatchingObject, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom } from "../utils";
import { Knob } from 'primereact/knob';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import Slider from '@mui/material/Slider';
import { InputNumber } from 'primereact/inputnumber';
import isequal from 'lodash.isequal'
import * as Tone from 'tone';
import { Dropdown } from 'primereact/dropdown';
import { sendNoteOn, sendNoteOff } from './entradaMidi';
import { sampleLibrary} from "../sampleLibrary";
import { subscribeToStoreChanges, subscribeToEstacioParameterChanges, subscribeToPartialStoreChanges } from "../utils";
import throttle from 'lodash.throttle'


import cssVariables from '../../styles/exports.module.scss';
import { circularProgressClasses } from "@mui/material";

const valueToText = (value) => {
    return `${value >= 5 ? value.toFixed(0) : value.toFixed(2)}`;
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

export const GrufKnobGran = ({estacio, parameterName, top, left, label}) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-knob-gran" style={{top: top, left: left}}>
            <Knob 
            value={real2Norm(parameterValue, parameterDescription)}
            min={0.0}
            max={1.0}
            step={0.01}
            size={60}
            onChange={throttle((evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.value, parameterDescription)), getCurrentSession().continuousControlThrottleTime)} 
            valueTemplate={""}
            valueColor={cssVariables.white} 
            rangeColor={cssVariables.grey} 
            //valueTemplate={valueToText(parameterValue)}
            />
            <div>{label || parameterDescription.label}</div>
        </div>
    )
};

// TODO: paràmetre position provisional, mentre hi hagi knobs que siguin position:absolute
export const GrufKnobPetit = ({estacio, parameterName, top, left, label, position}) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-knob-petit" style={{top: top, left: left, position}}>
            <Knob 
            value={real2Norm(parameterValue, parameterDescription)}
            min={0.0}
            max={1.0}
            step={0.01}
            size={25}
            onChange={throttle((evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.value, parameterDescription)), getCurrentSession().continuousControlThrottleTime)} 
            valueTemplate={""}
            valueColor={cssVariables.white}
            rangeColor={cssVariables.grey}
            //valueTemplate={valueToText(parameterValue)}
            />
            <div>{label || parameterDescription.label}</div>
        </div>
    )
};

export const GrufKnobGranDiscret = ({ estacio, parameterName, top, left, label }) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription = estacio.getParameterDescription(parameterName);
    const parameterValue = estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio = estacio.nom;
    const options = parameterDescription.options;
    const optionCount = options.length;

    const currentOptionIndex = options.indexOf(parameterValue);

    return (
        <div className="gruf-knob-gran" style={{ top, left }}>
            <Knob
                value={currentOptionIndex}
                min={0}
                max={optionCount - 1}
                step={1}
                size={60}
                onChange={(evt) => {
                    const selectedIndex = evt.value;
                    const selectedOption = options[selectedIndex];
                    getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, selectedOption);
                }}
                valueTemplate=""
                valueColor={cssVariables.white}
                rangeColor={cssVariables.grey}
            />
            <div>{label || parameterDescription.label}</div>
        </div>
    );
};

export const GrufKnobPetitDiscret = ({ estacio, parameterName, top, left, label }) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription = estacio.getParameterDescription(parameterName);
    const parameterValue = estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio = estacio.nom;
    const options = parameterDescription.options;
    const optionCount = options.length;

    const currentOptionIndex = options.indexOf(parameterValue);

    return (
        <div className="gruf-knob-petit" style={{ top, left }}>
            <Knob
                value={currentOptionIndex}
                min={0}
                max={optionCount - 1}
                step={1}
                size={25}
                onChange={(evt) => {
                    const selectedIndex = evt.value;
                    const selectedOption = options[selectedIndex];
                    getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, selectedOption);
                }}
                valueTemplate=""
                valueColor={cssVariables.white}
                rangeColor={cssVariables.grey}
            />
            <div>{label || parameterDescription.label}</div>
        </div>
    );
};

export const GrufKnobGranGlobal = ({ parameterName, estacio, top, left, label }) => {
    
    var parameterValue;
    if (parameterName === 'swing') {
        subscribeToPartialStoreChanges(getAudioGraphInstance(), 'swing');
        parameterValue = getAudioGraphInstance().getSwing();
    } else if (parameterName === 'bpm') {
        subscribeToPartialStoreChanges(getAudioGraphInstance(), 'bpm');
        parameterValue = getAudioGraphInstance().getBpm();
    } else if (parameterName === 'volume') {
        subscribeToPartialStoreChanges(getCurrentSession(), 'live');
        parameterValue = getCurrentSession().getLiveGainsEstacions()[estacio.nom] || 0;
        
    }

    const handleKnobChange = (value) => {
        if (parameterName === 'swing') {
            getAudioGraphInstance().updateParametreAudioGraph('swing', value);
        } else if (parameterName === 'bpm') {
            getAudioGraphInstance().updateParametreAudioGraph('bpm', value);
        } else if (parameterName === 'volume') {
            const currentGains = getCurrentSession().getLiveGainsEstacions();
            currentGains[estacio.nom] = parseFloat(value, 10);
            getCurrentSession().liveSetGainsEstacions(currentGains);  
        }
    };

    return (
        <div className="gruf-knob-gran" style={{ top: top, left: left }}>
            <Knob
                value={parameterValue}
                min={parameterName === 'bpm' ? 40 : 0} 
                max={parameterName === 'bpm' ? 300 : 1}
                step={parameterName === 'bpm' ? 1 : 0.01}
                size={60}
                onChange={throttle((e) => handleKnobChange(e.value), getCurrentSession().continuousControlThrottleTime)}
                valueTemplate={""}
                valueColor={cssVariables.white}
                rangeColor={cssVariables.grey}            
            />
            <div>{label || parameterName}</div>
        </div>
    );
};

export const GrufEnum2Columns = ({estacio, parameterName, top, left}) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
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
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
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

export const GrufSlider = ({estacio, parameterName, top, left, width, labelLeft, labelRight}) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    const marks = []
    if (labelLeft !== undefined) {
        marks.push({
            value: 0,
            label: labelLeft
        });
    }
    if (labelRight !== undefined) {
        marks.push({
            value: 1,
            label: labelRight
        });
    }
    const style = {top: top, left: left};
    if (width !== undefined) { 
        style.width = width;
    }
    return (
        <div className="gruf-slider" style={style}>
            <Slider 
                value={real2Norm(parameterValue, parameterDescription)}
                step={0.01}
                min={0.0}
                max={1.0}
                marks={marks}
                onChange={(evt) => throttle(getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, norm2Real(evt.target.value, parameterDescription)), getCurrentSession().continuousControlThrottleTime)} 
            />
        </div>
    )
};

export const GrufSliderVertical = ({ estacio, parameterName, top, left, height, labelBottom, labelTop, fons }) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription = estacio.getParameterDescription(parameterName);
    const parameterValue = estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio = estacio.nom;
    const marks = []
    if (labelBottom !== undefined) {
        marks.push({
            value: 0,
            label: labelBottom
        });
    }
    if (labelTop !== undefined) {
        marks.push({
            value: 1,
            label: labelTop
        });
    }
    const style = { top: top, left: left };
    if (height !== undefined) {
        style.height = height;
    }
    let classeFons = "";
    if (fons === "linies") {
        classeFons = "gruf-slider-background-ratllat";
    }
    return (
        <div className={"gruf-slider-vertical " + classeFons} style={style}>
            <Slider
                orientation="vertical"
                value={real2Norm(parameterValue, parameterDescription)}
                step={0.01}
                min={0.0}
                max={1.0}
                marks={marks} 
                onChange={throttle((evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, norm2Real(evt.target.value, parameterDescription)), getCurrentSession().continuousControlThrottleTime)}
            />
        </div>
    )
};

export const GrufSliderDiscret = ({ estacio, parameterName, top, left, height }) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription = estacio.getParameterDescription(parameterName);
    const parameterValue = estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio = estacio.nom;
    const options = parameterDescription.options;
    const style = { top: top, left: left };
    //const num2String();
    if (height !== undefined) {
        style.height = height;
    }
    return (
        <div className={"gruf-slider-vertical"} style={style}>
            <Slider
                sx={{ height: 56}}
                orientation="vertical"
                value={options.indexOf(parameterValue)}
                step={1.0}
                min={0.0}
                max={options.length -1}
                marks 
                onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, options[evt.target.value])}
            />
        </div>
    )
};

export const GrufBpmCounter = ({ top, left }) => {
    subscribeToPartialStoreChanges(getAudioGraphInstance(), 'bpm');
    const currentBpm = parseInt(getAudioGraphInstance().getBpm(), 10);

    const handleBpmChange = (newBpm) => {
        getAudioGraphInstance().updateParametreAudioGraph('bpm', newBpm);
    };

    return (
        <div className="bpm-counter" style={{ top: top, left: left }}>
            <div className="inner-square">
                <InputNumber 
                    value={currentBpm} 
                    onValueChange={(e) => handleBpmChange(e.value)} 
                    min={40} 
                    max={300} 
                    showButtons={false} 
                    className="p-inputnumber"
                />
                <div className="bpm-buttons">
                    <div className="button decrement" onClick={() => handleBpmChange(currentBpm - 1)}></div>
                    <div className="button increment" onClick={() => handleBpmChange(currentBpm + 1)}></div>
                </div>
            </div>
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

export const GrufToggle = ({ estacio, parameterName, top, left, valueOn = 1, valueOff = 0, labelOn="On", labelOff="Off" }) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);

    // Primer obtenim el valor actual
    const parameterValue = estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const parameterValueOnOff = parameterValue === valueOn;

    const handleClick = () => {
        // En clicar, invertim el valor i l'actualitzem
        const newValue = !parameterValueOnOff;
        estacio.updateParametreEstacio(parameterName, newValue ? valueOn : valueOff);
    };

    return (
        <div className="gruf-toggle" style={{ top: top, left: left }}>
            <div
                className={`p-toggle ${parameterValueOnOff ? 'on' : 'off'}`}
                onClick={handleClick}
            >
                <div className={`circle-icon ${parameterValueOnOff ? 'selected' : ''}`}></div>
            </div>
            <div className="toggle-label toggle-label-off">{labelOff}</div>
            <div className="toggle-label toggle-label-on">{labelOn}</div>
        </div>
    );
};

export const GrufOnOffGrid = ({ estacio, parameterName, top, left }) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar playhead position

    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const numRows = parameterDescription.numRows;
    const numSteps =  estacio.getNumSteps();
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElementsPerRow = []
    for (let i = 0; i < numRows; i++) {
        const stepsElements = []
        for (let j = 0; j < numSteps; j++) {
            const filledClass = indexOfArrayMatchingObject(parameterValue, {'i': i, 'j': j}) > -1 ? 'selected' : '';
            const activeStep = (currentStep == j && (getAudioGraphInstance().isPlayingLive() || (getAudioGraphInstance().isPlayingArranjement() && estacio.getCurrentLivePreset() === estacio.arranjementPreset ))) ? 'active' : '';
            stepsElements.push(
            <div 
                key={i + "_" + j} // To avoid React warning
                className={'step ' + filledClass + ' ' + activeStep}
                onMouseDown={(evt) => {
                    let updatedParameterValue = [...parameterValue]
                    const index = indexOfArrayMatchingObject(parameterValue, {'i': i, 'j': j});
                    if (index > -1){
                        updatedParameterValue.splice(index, 1);
                    } else {
                        updatedParameterValue.push({'i': i, 'j': j})
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
                <button onMouseDown={(evt)=>
                    estacio.updateParametreEstacio(parameterDescription.nom, [])
                }>Clear</button>
                { parameterDescription.showRecButton && <label><input id={estacio.nom + '_' + parameterDescription.nom + '_REC'} type="checkbox"/>Rec</label> } 
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

export const GrufSelectorPresets = ({estacio, top, left, height="30px"}) => {
    return (
        <div className="gruf-selector-presets" style={{ top: top, left: left, height:height, lineHeight:height}}>
            {[...Array(estacio.numPresets).keys()].map(i => 
            <div key={"preset_" + i}
                className={(getCurrentSession().getLivePresetsEstacions()[estacio.nom] == i ? " selected": "")}
                onClick={(evt) => {getCurrentSession().liveSetPresetForEstacio(estacio.nom, i)}}>
                    {i + 1}
            </div>
            )}
        </div>
    )
}

export const GrufPianoRoll = ({ estacio, parameterName, top, left, width="500px", height="200px", monophonic=false, allowedNotes=[], colorNotes, colorNotesDissalowed, modeSampler, triggerNotes=true }) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar playhead position

    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const numSteps =  estacio.getNumSteps();
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const uniqueId = estacio.nom + "_" + parameterDescription.nom
    let lastEditedData = "";
    
    useEffect(() => {
        const jsElement = document.getElementById(uniqueId + "_id")
        if (jsElement.dataset.alreadyBinded === undefined){
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
    }

    // Available webaudio-pianoroll attributes: https://github.com/g200kg/webaudio-pianoroll
    return (
        <div className="gruf-piano-roll" style={{ top: top, left: left}}>
            <div style={{overflow:"scroll"}}>
                <gruf-pianoroll
                    id={uniqueId + "_id"}
                    editmode={monophonic ? "dragmono" : "dragpoly"}
                    secondclickdelete={true}
                    allowednotes={allowedNotes}
                    width={width.replace('px', '')}
                    height={height.replace('px', '') - 30} // subtract height of the clear/rec buttons below
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
                    colnotedissalowed={colorNotesDissalowed || "#333"}
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
            <div className="gruf-piano-roll-controls">
                <button onMouseDown={(evt)=> estacio.updateParametreEstacio(parameterDescription.nom, [])}>Clear</button>
                { parameterDescription.showRecButton && <input id={recordingElementId} type="checkbox" style={{display:"none"}}/> } 
                { parameterDescription.showRecButton && <button onMouseDown={(evt)=> toggleRecording(evt.target)}>Rec</button> } 
                <GrufSelectorPresets estacio={estacio} top={height.replace('px', '') - 8} left={width.replace('px', '') - 100} height="23px"/>
            </div>
        </div>
    )
};

export const GrufSelectorPatronsGrid = ({estacio, parameterName, top, left, width}) => {
    subscribeToEstacioParameterChanges(estacio, parameterName);
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
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

export const GrufSelectorTonalitat = ({ top, left }) => {
    subscribeToPartialStoreChanges(getAudioGraphInstance(), 'tonality');
    const tonalityOptions = [
        { label: 'C Major', value: 'cmajor' },
        { label: 'C Minor', value: 'cminor' },
        { label: 'C# Major', value: 'c#major' },
        { label: 'C# Minor', value: 'c#minor' },
        { label: 'D Major', value: 'dmajor' },
        { label: 'D Minor', value: 'dminor' },
        { label: 'E♭ Major', value: 'ebmajor' },
        { label: 'E♭ Minor', value: 'ebminor' },
        { label: 'E Major', value: 'emajor' },
        { label: 'E Minor', value: 'eminor' },
        { label: 'F Major', value: 'fmajor' },
        { label: 'F Minor', value: 'fminor' },
        { label: 'F# Major', value: 'f#major' },
        { label: 'F# Minor', value: 'f#minor' },
        { label: 'G Major', value: 'gmajor' },
        { label: 'G Minor', value: 'gminor' },
        { label: 'A♭ Major', value: 'abmajor' },
        { label: 'A♭ Minor', value: 'abminor' },
        { label: 'A Major', value: 'amajor' },
        { label: 'A Minor', value: 'aminor' },
        { label: 'B♭ Major', value: 'bbmajor' },
        { label: 'B♭ Minor', value: 'bbminor' },
        { label: 'B Major', value: 'bmajor' },
        { label: 'B Minor', value: 'bminor' }
    ];
    
    const currentTonality = getAudioGraphInstance().getTonality();

    const handleTonalityChange = (event) => {
        const selectedTonality = event.target.value;
        getAudioGraphInstance().updateParametreAudioGraph('tonality', selectedTonality);
    };

    return (
        <div className="tonality-selector" style={{ position: 'absolute', top: top, left: left }}>
            <Dropdown
                value={currentTonality}  
                options={tonalityOptions}  
                onChange={handleTonalityChange} 
                placeholder="Selecciona Tonalitat"  
                scrollHeight="200px"  
                className="small-font-dropdown"  
            />
        </div>
    );
};

export const GrufSelectorSonsSampler = ({estacio, top, left, width}) => {
    subscribeToEstacioParameterChanges(estacio, 'selecetdSoundName');
    const selectedSoundName = estacio.getParameterValue('selecetdSoundName', estacio.getCurrentLivePreset());
    const showTrashOption = getCurrentSession().getRecordedFiles().indexOf(selectedSoundName) > -1;
    const options = 
        [...getCurrentSession().getRecordedFiles().map(item => ({'label': item, 'value': item})),
        ...sampleLibrary.sampler.map(item => ({'label': item.name + ' (' + item.tonality + ')', 'value': item.name}))
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
                        estacio.updateParametreEstacio('selecetdSoundName', filteredOptionNames[selectedOptionIndex])
                    }
                }
            });
        })
    }

    return (
        <div className="gruf-selector-patrons-grid" style={{top: top, left: left, width:(showTrashOption ? parseInt(width.replace("px", "")) -20: width)}}>
            <Dropdown 
                value={selectedSoundName}
                onChange={(evt) => {
                    estacio.updateParametreEstacio('selecetdSoundName', evt.target.value)
                }} 
                options={options}
                placeholder="Cap"
            />
            {showTrashOption ? <button style={{width: "22px", verticalAlign: "bottom" }} onClick={() => {handleRemoveFileButton(selectedSoundName)}}><img src={appPrefix + "/static/src/img/trash.svg"}></img></button>: ''}
        </div>
    )
}

export const GrufADSRWidget = ({estacio, soundNumber="", height, top, left}) => {
    const attackParamName = `attack${soundNumber}`;
    const decayParamName = `decay${soundNumber}`;
    const sustainParamName = `sustain${soundNumber}`;
    const releaseParamName = `release${soundNumber}`;

    // TODO: en el futur, estaria be que tots el knobs tinguessin position="static"
    return (
        <div className="gruf-adsr-widget" style={{top, left, height}}>
            <ADSRGraph estacio={estacio} adsrParameterNames={[attackParamName, decayParamName, sustainParamName, releaseParamName]}/>
            <div className="adsr-knobs">
                <GrufKnobPetit estacio={estacio} parameterName={attackParamName} label='Attack' position="static"/>
                <GrufKnobPetit estacio={estacio} parameterName={decayParamName} label='Decay' position="static"/>
                <GrufKnobPetit estacio={estacio} parameterName={sustainParamName} label='Sustain' position="static"/>
                <GrufKnobPetit estacio={estacio} parameterName={releaseParamName} label='Release' position="static" />
            </div>
        </div>
    )
}

const ADSRGraph = ({estacio, adsrParameterNames}) => {
    for (let i = 0; i < adsrParameterNames.length; i++) {
        subscribeToEstacioParameterChanges(estacio, adsrParameterNames[i]);
    }

    const a = estacio.getParameterValue(adsrParameterNames[0], estacio.getCurrentLivePreset());
    const d = estacio.getParameterValue(adsrParameterNames[1], estacio.getCurrentLivePreset());
    const s = estacio.getParameterValue(adsrParameterNames[2], estacio.getCurrentLivePreset());
    const r = estacio.getParameterValue(adsrParameterNames[3], estacio.getCurrentLivePreset());

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
