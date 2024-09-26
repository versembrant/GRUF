import { useEffect, useState, useRef } from "react";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { GrufButtonNoBorder, GrufLabelEstacio } from "../components/widgets";
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';
import { Knob } from 'primereact/knob';

export const GrufPanKnob = ({ estacio }) => {
    const [panValue, setPanValue] = useState(0); 

    useEffect(() => {
        const initialPan = getAudioGraphInstance().getPanForEstacio(estacio.nom);
        setPanValue(initialPan);
    }, [estacio]);

    const handlePanChange = (newValue) => {
        setPanValue(newValue); 
        getAudioGraphInstance().setPanForEstacio(estacio.nom, newValue); 
    };

    return (
        <div className="gruf-pan-knob">
            <Knob 
                value={panValue}
                min={-1} 
                max={1} 
                step={0.01} 
                onChange={(e) => handlePanChange(e.value)}
                size={50}
                valueColor="#FFFFFF"
                rangeColor="#AAAAAA"
                showValue={false}
            />
            <div style={{display:"flex", justifyItems:"center", justifyContent:'center', fontSize: '12px', border: '5px'}}>PAN</div>
        </div>
    );
};

export const GrufMuteCheckbox = ({ estacio }) => {
    const parameterValue = getCurrentSession().getLiveMutesEstacions()[estacio.nom];

    const handleMuteToggle = (evt) => {
        const currentMutes = getCurrentSession().getLiveMutesEstacions();
        currentMutes[estacio.nom] = evt.target.checked;
        getCurrentSession().liveSetMutesEstacions(currentMutes);
    };

    return (
        <label className="gruf-mute-checkbox">
            <input
                type="checkbox"
                checked={parameterValue}
                onChange={handleMuteToggle}
                className="gruf-mute-checkbox__input" 
            />
            <span className="gruf-mute-checkbox__visual">M</span> 
        </label>
    );
};

export const GrufSoloCheckbox = ({ estacio }) => {
    const parameterValue = getCurrentSession().getLiveSolosEstacions()[estacio.nom];

    const handleSoloToggle = (evt) => {
        const currentSolos = getCurrentSession().getLiveSolosEstacions();
        currentSolos[estacio.nom] = evt.target.checked;
        getCurrentSession().liveSetSolosEstacions(currentSolos);
    };

    return (
        <label className="gruf-solo-checkbox">
            <input
                type="checkbox"
                checked={parameterValue}
                onChange={handleSoloToggle}
                className="gruf-solo-checkbox__input" 
            />
            <span className="gruf-solo-checkbox__visual">S</span> 
        </label>
    );
};

export const GrufGainSlider = ({ estacio }) => {
    const parameterValue = getCurrentSession().getLiveGainsEstacions()[estacio.nom];
    return (
        <div>
            <input 
                type="range"
                min="0.0" 
                max="1.0"
                step="0.1"
                value={parameterValue}
                name={estacio.nom}
                onInput={(evt) => {
                    const currentGains = getCurrentSession().getLiveGainsEstacions();
                    currentGains[estacio.nom] = parseFloat(evt.target.value, 10);
                    getCurrentSession().liveSetGainsEstacions(currentGains);
                }}
            />
            {estacio.nom}
        </div>
    );
};

export const GrufGainSliderVertical = ({ estacio, top, left, height, fons }) => {
    const nomEstacio = estacio.nom; 
    const parameterValue = getCurrentSession().getLiveGainsEstacions()[nomEstacio]; 
    const marks = [];

    const style = { top: top, left: left };
    if (height !== undefined) {
        style.height = height;
    }

    let classeFons = "";
    if (fons === "linies") {
        classeFons = "gruf-slider-background-ratllat";
    }

    const handleGainChange = (evt, value) => {
        const currentGains = getCurrentSession().getLiveGainsEstacions();
        currentGains[nomEstacio] = parseFloat(value, 10);
        getCurrentSession().liveSetGainsEstacions(currentGains);
    };

    return (
        <div className={"gruf-gain-slider-vertical " + classeFons} style={style}>
            <Slider
                orientation="vertical"
                value={parameterValue}
                step={0.01}
                min={0.0}
                max={1.0}
                marks={marks}
                onChange={handleGainChange}
            />
        </div>
    );
};

export const EstacioMixerUI = ({ setEstacioSelected, showLevelMeters }) => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    const metersRef = useRef({});

    useEffect(() => {
        if (showLevelMeters) {
            document.levelMeterInterval = setInterval(() => {
                getCurrentSession().getNomsEstacions().forEach((nomEstacio) => {
                    const levelData = getAudioGraphInstance().getCurrentLevelEstacio(nomEstacio);
                    const meterLevelDiv = metersRef.current[nomEstacio]; // Acceso al div .volume-level
    
                    if (meterLevelDiv) {
                        const minDB = -60;
                        const maxDB = 6;
                        const db = Math.max(minDB, Math.min(levelData.db, maxDB)); // Limitar entre -60 i 0 dB

                        const height = ((db - minDB) / (maxDB - minDB) * 100); // Escalar entre 0 i 100%
    
                        meterLevelDiv.style.height = `${height}%`;
    
                        let color;
                        if (db <= -2) {
                            const greenToYellow = Math.min(1, (db + 60) / 50);
                            const green = Math.round(255 * (1 - greenToYellow));
                            const red = Math.round(255 * greenToYellow);
                            color = `rgb(${red}, 255, 0)`; 
                        } else {
                            const yellowToRed = Math.min(1, (db + 10) / 16);
                            const red = 255;
                            const green = Math.round(255 * (1 - yellowToRed));
                            color = `rgb(${red}, ${green}, 0)`; 
                        }
    
                        meterLevelDiv.style.backgroundColor = color;
                    }
                });
            }, 100);
    
            return () => {
                clearInterval(document.levelMeterInterval);
            };
        }
    }, [showLevelMeters]);

    return (
        <div key="mixer1" className="estacio estacio-mixer" id="mixerObject">
            <div className="estacio-main">
                <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => { setEstacioSelected(undefined); }} />
                <div className="estacio-mixer-container">
                    {getCurrentSession().getNomsEstacions().map((nomEstacio) => {
                        const estacio = getCurrentSession().getEstacio(nomEstacio);
                        return (
                            <div key={nomEstacio} className={"estacio-columna " + " estacio-" + estacio.tipus + " mixer-border"}>
                                <GrufPanKnob estacio={estacio} />
                                
                                <div className="slider-wrapper">
                                    <GrufGainSliderVertical estacio={estacio} top='500px' left='50px' height='400px'/>
                                    <div
                                        id={`meter-${nomEstacio}`}
                                        className="volume-meter"
                                        ref={(el) => (metersRef.current[nomEstacio] = el)}
                                    >
                                        <div className="volume-level" />
                                    </div>
                                </div>

                                <div className="mute-solo-container">
                                    <GrufMuteCheckbox estacio={estacio} />
                                    <GrufSoloCheckbox estacio={estacio} />
                                </div>
                                <GrufLabelEstacio className= 'nom-estacio-container'estacio={estacio}/>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};