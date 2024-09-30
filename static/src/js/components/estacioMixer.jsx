import { useEffect, useState, useRef } from "react";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { GrufButtonNoBorder, GrufLabelEstacio } from "../components/widgets";
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

export const GrufMasterPanKnob = () => {
    const masterPan = getAudioGraphInstance().getMasterPan();

    const handlePanChange = (newValue) => {
        getAudioGraphInstance().setMasterPan(newValue);
    };

    return (
        <div className="gruf-pan-knob">
            <Knob 
                value={masterPan}
                min={-1}
                max={1}
                step={0.01}
                onChange={(e) => handlePanChange(e.value)}
                size={50}
                valueColor="#FFFFFF"
                rangeColor="#AAAAAA"
                showValue={false}
            />
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "center", fontSize: "12px" }}> PAN </div>
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

export const GrufMasterGainSliderVertical = ({ top, left, height, fons }) => {
    const masterGain = getAudioGraphInstance().getMasterGain(); 
    const marks = [];

    const style = { top: top, left: left };
    if (height !== undefined) {
        style.height = height;
    }

    const handleGainChange = (evt, value) => {
        getAudioGraphInstance().setMasterGain(parseFloat(value, 10));
    };

    return (
        <div className="gruf-master-gain-slider-vertical" style={style}>
            <Slider
                orientation="vertical"
                value={masterGain}
                step={0.01}
                min={0.0}
                max={1.0}
                marks={marks}
                onChange={handleGainChange}
            />
        </div>
    );
};

export const GrufMasterMeter = () => {
    const leftMeterRef = useRef(null);
    const rightMeterRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const levelData = getAudioGraphInstance().getCurrentMasterLevelStereo();

            if (leftMeterRef.current && rightMeterRef.current) {
                // Canal esquerre
                const dbLeft = Math.max(-60, Math.min(levelData.left.db, 12));
                const heightLeft = ((dbLeft + 60) / 60) * 100;
                leftMeterRef.current.style.height = `${heightLeft}%`;


                // Canal dret
                const dbRight = Math.max(-60, Math.min(levelData.right.db, 12));
                const heightRight = ((dbRight + 60) / 60) * 100;
                rightMeterRef.current.style.height = `${heightRight}%`;

                let colorLeft, colorRight;
                if (dbLeft <= -2) {
                    const greenToYellow = Math.min(1, (dbLeft + 60) / 50);
                    const green = Math.round(255 * (1 - greenToYellow));
                    const red = Math.round(255 * greenToYellow);
                    colorLeft = `rgb(${red}, 255, 0)`;
                } else {
                    const yellowToRed = Math.min(1, (dbLeft + 10) / 16);
                    const red = 255;
                    const green = Math.round(255 * (1 - yellowToRed));
                    colorLeft = `rgb(${red}, ${green}, 0)`;
                }

                if (dbRight <= -2) {
                    const greenToYellow = Math.min(1, (dbRight + 60) / 50);
                    const green = Math.round(255 * (1 - greenToYellow));
                    const red = Math.round(255 * greenToYellow);
                    colorRight = `rgb(${red}, 255, 0)`;
                } else {
                    const yellowToRed = Math.min(1, (dbRight + 10) / 16);
                    const red = 255;
                    const green = Math.round(255 * (1 - yellowToRed));
                    colorRight = `rgb(${red}, ${green}, 0)`;
                }

                leftMeterRef.current.style.backgroundColor = colorLeft;
                rightMeterRef.current.style.backgroundColor = colorRight;
            }
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="master-stereo-meters">
            <div className="volume-meter">
                <div className="volume-level" ref={leftMeterRef}></div>
            </div>
            <div className="volume-meter">
                <div className="volume-level" ref={rightMeterRef}></div>
            </div>
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
                        const db = Math.max(-60, Math.min(levelData.db, 12)); // Limitar entre -60 y 12 dB
                        const height = ((db + 60) / 60) * 100; // Escalar entre 0 y 100%
    
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
                            <div key={nomEstacio} className="estacio-mixer-columna">
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
                    <div className="estacio-mixer-master-columna">
                        <GrufMasterPanKnob/>
                        <div className="slider-wrapper">
                        <GrufMasterGainSliderVertical top='500px' left='50px' height='400px'/>
                        <GrufMasterMeter />
                        </div>
                        <div className="master-label">Master</div>
                    </div>
                </div>
            </div>
        </div>
    );
};