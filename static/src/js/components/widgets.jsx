import { useState, useRef } from "react";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { real2Norm, norm2Real } from "../utils";
import { Knob } from 'primereact/knob';
import { Button } from 'primereact/button';
import Slider from '@mui/material/Slider';
import { InputNumber } from 'primereact/inputnumber';
import cssVariables from '../../styles/exports.module.scss';

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

export const GrufSlider = ({estacio, parameterName, top, left, width}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    const marks = [
        {
            value: 0,
            label: <div className="marques-slider">soft</div>
        },
        {
            value: 1,
            label: <div className="marques-slider">hard</div>
        },
    ];
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

export const GrufSliderVertical = ({estacio, parameterName, top, left}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-slider-vertical" style={{top: top, left: left}}>
            <Slider 
            sx={{
                height: 17,
              }}
            value={real2Norm(parameterValue, parameterDescription)}
            step={0.01}
            min={0.0}
            max={1.0}
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

export const GrufPad = ({ playerIndex }) => {
    const [isClicked, setIsClicked] = useState(false);
    const [isHeld, setIsHeld] = useState(false);
    const holdTimer = useRef(null);

    const handleMouseDown = () => {
        setIsClicked(true);
        holdTimer.current = setTimeout(() => {
            setIsHeld(true);
        }, 500); 
    };

    const handleMouseUp = () => {
        clearTimeout(holdTimer.current);
        setIsClicked(false);
        if (isHeld) {
            setIsHeld(false);
        } else {
            playSample(playerIndex);
        }
    };

    const playSample = (index) => {
        const estacio = getCurrentSession().getEstacio('EstacioSamper');
        if (estacio && estacio.playSoundFromPlayer) {
            estacio.playSoundFromPlayer(index, Tone.now());
        }
    };

    return (
        <div className="gruf-pad">
            <Button
                className={ isClicked ? 'selected': '' }
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    )
}

export const PadGrid = ({ top, left }) => {
    return (
        <div className="pad-grid" style={{ top: top, left: left }}>
            {Array.from({ length: 16 }).map((_, index) => (
                <GrufPad
                    key={index}
                    playerIndex={index}
                />
            ))}
        </div>
    );
};

export const GrufOnOffButton = ({ estacio, parameterName, top, left, valueOn=true, valueOff=false}) => {
    const parameterValue = estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const parameterValueOnOff = parameterValue === valueOn ? true : false;
    
    const handleClick = () => {
        const parameterInverted = !parameterValueOnOff;
        estacio.updateParametreEstacio(parameterName, parameterInverted ? valueOn : valueOff);
    };

    return (
        <div className="gruf-select-button" style={{ top: top, left: left}}>
            <div
                className={`p-selectbutton ${parameterValueOnOff ? 'on' : 'off'}`}
                onClick={handleClick}
            >
                <div className={`circle-icon ${parameterValueOnOff ? 'selected' : ''}`}></div>
            </div>
        </div>
    );
};

