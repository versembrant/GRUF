import { useState, useRef, useEffect } from "react";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { real2Norm, norm2Real, indexOfArrayMatchingObject, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom } from "../utils";
import { Knob } from 'primereact/knob';
import { Button } from 'primereact/button';
import Slider from '@mui/material/Slider';
import { InputNumber } from 'primereact/inputnumber';
import isequal from 'lodash.isequal'
import * as Tone from 'tone';
import { Dropdown } from 'primereact/dropdown';


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

export const GrufButtonNoBorder = ({text, top, left, onClick}) => {
    return (
        <button className="gruf-button-no-border" onClick={onClick} style={{top: top, left: left}}>
            {text}
        </button>
    )
}

export const GrufKnobGran = ({estacio, parameterName, top, left, label}) => {
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
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.value, parameterDescription))} 
            valueTemplate={""}
            valueColor={cssVariables.white} 
            rangeColor={cssVariables.grey} 
            //valueTemplate={valueToText(parameterValue)}
            />
            <div>{label || parameterDescription.label}</div>
        </div>
    )
};

export const GrufKnobPetit = ({estacio, parameterName, top, left, label}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-knob-petit" style={{top: top, left: left}}>
            <Knob 
            value={real2Norm(parameterValue, parameterDescription)}
            min={0.0}
            max={1.0}
            step={0.01}
            size={25}
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.value, parameterDescription))} 
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
    const [parameterValue, setParameterValue] = useState(0); 

    useEffect(() => {
        if (parameterName === 'swing') {
            setParameterValue(getAudioGraphInstance().getSwing());
        } else if (parameterName === 'bpm') {
            setParameterValue(getAudioGraphInstance().getBpm());
        } else if (parameterName === 'volume') {
            setParameterValue(getCurrentSession().getLiveGainsEstacions()[estacio.nom] || 0);
        }
    }, [parameterName, estacio]);

    const handleKnobChange = (value) => {
        setParameterValue(value);

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
                onChange={(e) => handleKnobChange(e.value)}
                valueTemplate={""}
                valueColor={cssVariables.white}
                rangeColor={cssVariables.grey}            
            />
            <div>{label || parameterName}</div>
        </div>
    );
};

export const GrufEnum2Columns = ({estacio, parameterName, top, left}) => {
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
                onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, norm2Real(evt.target.value, parameterDescription))} 
            />
        </div>
    )
};

export const GrufSliderVertical = ({ estacio, parameterName, top, left, height, labelBottom, labelTop, fons }) => {
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
                onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, norm2Real(evt.target.value, parameterDescription))}
            />
        </div>
    )
};

export const GrufBpmCounter = ({ top, left }) => {
    const currentBpm = parseInt(getAudioGraphInstance().getBpm(), 10);

    const handleBpmChange = (newBpm) => {
        getAudioGraphInstance().setBpm(newBpm);
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

    const playSample = (playerIndex) => {
        if (!getAudioGraphInstance().graphIsBuilt()){
            return;
        }
        const estacio = getCurrentSession().getEstacio(nomEstacio);
        if (estacio && estacio.playSoundFromPlayer) {
            estacio.playSoundFromPlayer(playerIndex, Tone.now());
        }
    }; 

    const stopSample = (playerIndex) => {
        if (!getAudioGraphInstance().graphIsBuilt()){
            return;
        }
        const estacio = getCurrentSession().getEstacio(nomEstacio);
        if (estacio && estacio.playSoundFromPlayer) {
            estacio.stopSoundFromPlayer(playerIndex, Tone.now());
        }
    }; 

    return (
        <div className="gruf-pad">
            <Button
                className={ (isClicked ? 'selected': '') + ' ' + (isSelected ? 'pad-selected': '') } 
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

export const GrufOnOffButton = ({ estacio, parameterName, top, left, valueOn = 1, valueOff = 0, labelOn="On", labelOff="Off" }) => {
    // Primer obtenim el valor actual
    const parameterValue = estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const parameterValueOnOff = parameterValue === valueOn;

    const handleClick = () => {
        // En clicar, invertim el valor i l'actualitzem
        const newValue = !parameterValueOnOff;
        estacio.updateParametreEstacio(parameterName, newValue ? valueOn : valueOff);
    };

    return (
        <div className="gruf-select-button" style={{ top: top, left: left }}>
            <div
                className={`p-selectbutton ${parameterValueOnOff ? 'on' : 'off'}`}
                onClick={handleClick}
            >
                <div className={`circle-icon ${parameterValueOnOff ? 'selected' : ''}`}></div>
            </div>
            <div className="select-button-label select-button-label-on">{labelOn}</div>
            <div className="select-button-label select-button-label-off">{labelOff}</div>
        </div>
    );
};

export const GrufOnOffGrid = ({ estacio, parameterName, top, left }) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const numRows = parameterDescription.numRows;
    const numSteps =  getAudioGraphInstance().getNumSteps();
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
    
    return (
        <div className="gruf-on-off-grid" style={{ top: top, left: left}}>
            <div className="grid-default">
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

export const GrufPianoRoll = ({ estacio, parameterName, top, left, width="500px", height="200px", colorNotes, modeSampler }) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const numSteps =  getAudioGraphInstance().getNumSteps();
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
                <webaudio-pianoroll
                    id={uniqueId + "_id"}
                    width={width.replace('px', '')}
                    height={height.replace('px', '') - 30} // subtract height of the clear/rec buttons below
                    xrange={numSteps}
                    yrange={parameterDescription.rangDeNotesPermeses || 24}
                    yoffset={modeSampler === undefined ? getLowestNoteForYOffset(): 0}
                    xruler={0}
                    markstart={-10}  // make it dissapear
                    markend={-10}  // make it dissapear
                    //cursoroffset={2500}  // make it dissapear
                    yscroll={parameterDescription.hasOwnProperty('permetScrollVertical') ? parameterDescription.permetScrollVertical : 1}
                    colnote={colorNotes || "#f22"}
                    colnotesel={colorNotes || "#f22"}
                    collt={"rgb(200, 200, 200)"}
                    coldk={"rgb(176, 176, 176)"}
                    colgrid={"#999"}
                    colnoteborder={colorNotes || "#f22"}
                    colrulerbg={"#000"}
                    colrulerfg={"#fff"}
                    colrulerborder={"#000"}
                    kbwidth={modeSampler === undefined ? 65: 0}
                    yruler={modeSampler === undefined ? 18: 0}
                ></webaudio-pianoroll>
            </div>
            <div className="gruf-piano-roll-controls">
                <button onMouseDown={(evt)=> estacio.updateParametreEstacio(parameterDescription.nom, [])}>Clear</button>
                { parameterDescription.showRecButton && <input id={recordingElementId} type="checkbox" style={{display:"none"}}/> } 
                { parameterDescription.showRecButton && <button onMouseDown={(evt)=> toggleRecording(evt.target)}>Rec</button> } 
                <GrufSelectorPresets estacio={estacio} top={height.replace('px', '') - 22} left={width.replace('px', '') - 100} height="23px"/>
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

export const GrufDesplegable = ({estacio, parameterName, top, left, label}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-desplegable" style={{top: top, left: left}}>
            <Dropdown 
            value={getNomPatroOCap(parameterDescription, parameterValue)}
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, getPatroPredefinitAmbNom(parameterDescription, evt.target.value))} 
            //options={}
            placeholder="Cap"
            valueTemplate={""}
            />
            <div>{label || parameterDescription.label}</div>
        </div>
    )
};
