import * as Tone from 'tone';
import { useEffect, useState, useRef } from "react";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { GrufKnob, GrufButtonNoBorder, GrufLabelEstacio, GrufLogoEstacio, GrufCanviaInstrument } from "../components/widgets";
import Slider from '@mui/material/Slider';

export const GrufMuteCheckbox = ({ estacio, isIndirectMute, setIsDirectMute }) => {
    const parameterValue = getCurrentSession().getLiveMutesEstacions()[estacio.nom];
    useEffect(() => {
        setIsDirectMute(parameterValue);
    });

    const handleMuteToggle = (evt) => {
        const isDirectMute =  evt.target.checked;
        const currentMutes = getCurrentSession().getLiveMutesEstacions();
        currentMutes[estacio.nom] = isDirectMute;
        getCurrentSession().setLiveMutesEstacions(currentMutes);
        setIsDirectMute(parameterValue);
    };

    return (
        <label className="gruf-mute-checkbox">
            <input
                type="checkbox"
                checked={parameterValue}
                onChange={handleMuteToggle}
                className={`gruf-mute-checkbox__input ${isIndirectMute ? "indirect-mute" : ""}`}
            />
            <span className="gruf-mute-checkbox__visual">M</span> 
        </label>
    );
};

export const GrufSoloCheckbox = ({ estacio, changeSoloState }) => {
    const parameterValue = getCurrentSession().getLiveSolosEstacions()[estacio.nom];
    useEffect(() => {
        changeSoloState(parameterValue);
    });

    const handleSoloToggle = (evt) => {
        const isSolo = evt.target.checked;
        const currentSolos = getCurrentSession().getLiveSolosEstacions();
        currentSolos[estacio.nom] = isSolo;
        getCurrentSession().setLiveSolosEstacions(currentSolos);
        changeSoloState(isSolo);
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
                    getCurrentSession().setLiveGainsEstacions(currentGains);
                }}
            />
            {estacio.nom}
        </div>
    );
};

export const GrufGainSliderVertical = ({ top, left, height, estacio, isMasterGain, fxNom }) => {
    let parameterValue = 0.0;
    if (estacio) {
        parameterValue = getCurrentSession().getLiveGainsEstacions()[estacio.nom];
    } else if (isMasterGain) {
        parameterValue = getAudioGraphInstance().getMasterGain();
    } else if (fxNom) {
        parameterValue = getAudioGraphInstance().getFxReturnGain(fxNom);
    }

    const marks = [];
    const style = { top: top, left: left };
    if (height !== undefined) {
        style.height = height;
    }

    const lin01ValueToGainValue = (linValue01) => {
        return Math.pow(linValue01, 2) * 2;
    }

    const gainValueToLin01Value = (gainValue) => {
        return Math.pow(gainValue / 2, 1/2);
    }

    const handleGainChange = (evt, value) => {
        if (estacio) {
            const currentGains = getCurrentSession().getLiveGainsEstacions();
            currentGains[estacio.nom] = lin01ValueToGainValue(parseFloat(value, 10));
            getCurrentSession().setLiveGainsEstacions(currentGains);
        } else if (isMasterGain) {
            getAudioGraphInstance().setMasterGain(lin01ValueToGainValue(parseFloat(value, 10)));
        } else if (fxNom) {
            const gain = lin01ValueToGainValue(parseFloat(value, 10));
            if (fxNom === 'reverbA') getAudioGraphInstance().updateParametreAudioGraph('effectParameters', {...getAudioGraphInstance().getEffectParameters(), reverbAGain: gain});
            if (fxNom === 'reverbB') getAudioGraphInstance().updateParametreAudioGraph('effectParameters', {...getAudioGraphInstance().getEffectParameters(), reverbBGain: gain});
            if (fxNom === 'delayA') getAudioGraphInstance().updateParametreAudioGraph('effectParameters', {...getAudioGraphInstance().getEffectParameters(), delayAGain: gain});
            if (fxNom === 'delayB') getAudioGraphInstance().updateParametreAudioGraph('effectParameters', {...getAudioGraphInstance().getEffectParameters(), delayBGain: gain});
        }
    };

    return (
        <div className="gruf-gain-slider-vertical" style={style}>
            <Slider
                orientation="vertical"
                value={gainValueToLin01Value(parameterValue)}
                step={0.01}
                min={0.0}
                max={1.0}
                marks={marks}
                onChange={handleGainChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Tone.gainToDb(lin01ValueToGainValue(parseFloat(value, 10))).toFixed(1)} dB`.replace("Infinity", "∞")}
            />
        </div>
    );
};

export const GrufMasterMeter = ({showLevelMeters}) => {

    const [levelData, setLevelData] = useState([-Infinity, -Infinity]);

    useEffect(() => {
        if (!showLevelMeters) return;
        const interval = setInterval(() => {
            const newLevelData = getAudioGraphInstance().getCurrentMasterLevelStereo();
            setLevelData([newLevelData.left, newLevelData.right]);
        }, 100);
        return () => {
            clearInterval(interval);
        };
    }, [showLevelMeters]);

    const gainMeters = levelData.map((channelLevelData, i)=> <GrufGainMeter
        key={`meter-master-${i}`}
        isMute={false}
        levelData={channelLevelData}
    />);

    return (
        <div className="master-stereo-meters">
            {gainMeters}
        </div>
    );
};

const GrufGainMeter = ({isMute, levelData}) => {
    const minDB = -30;  // A baix de tot del meter seràn -30db (o menys), així el nivell s'alinea una mica millor amb el fader
    const maxDB = 6;
    const db = Math.max(minDB, Math.min(levelData.db, maxDB)); // Limitar entre minDB i maxDB
    const meterLevel = ((db - minDB) / (maxDB - minDB) * 100); // Escalar entre 0 i 100%

    return (
        <div
            className={`volume-meter ${isMute ? 'grayscale' : ""}`}
            style={{'--meter-level': `${meterLevel}%`}}
        >
            <div className="volume-level" />
        </div>
    )
}

export const EstacioMixerTrack = ({estacio, isAnySolo, reportSoloChange, showLevelMeters}) => {
    const [isSolo, setIsSolo] = useState(false);
    const [isDirectMute, setIsDirectMute] = useState(false);
    const [levelData, setLevelData] = useState(-Infinity);

    useEffect(() => {
        if (!showLevelMeters) return;
        const interval = setInterval(() => {
            const newLevelData = getAudioGraphInstance().getCurrentLevelEstacio(estacio.nom);
            setLevelData(newLevelData);
        }, 100);
        return () => {
            clearInterval(interval);
        };
    }, [showLevelMeters]);

    const changeSoloState = (newState) => {
        setIsSolo(newState);
        reportSoloChange();
    }

    const isIndirectMute = isAnySolo && !isSolo && !isDirectMute;
    const isMute = isDirectMute || isIndirectMute;
    return (
        <div key={estacio.nom} className={"estacio-mixer-columna " + " estacio-" + estacio.tipus + " mixer-border"}>
            <div className="track-controls">
                <GrufKnob mida='gran' parameterParent={estacio} parameterName='pan' noOutput="true" customWidth="50px" customHeight="50px"/>
                <div className="slider-wrapper">
                    <GrufGainSliderVertical estacio={estacio} top='500px' left='50px' height='400px'/>
                    <GrufGainMeter isMute={isMute} levelData={levelData}/>
                </div>
                <div className="mute-solo-container">
                    <GrufMuteCheckbox estacio={estacio} setIsDirectMute={setIsDirectMute} isIndirectMute={isIndirectMute}/>
                    <GrufSoloCheckbox estacio={estacio} changeSoloState={changeSoloState} />
                </div>
            </div>
            <GrufLabelEstacio className= 'label'estacio={estacio}/>
        </div>
    )
}

export const FxReturnFader = ({ label, fxNom, showLevelMeters }) => {
    const [levelData, setLevelData] = useState(-Infinity);

    useEffect(() => {
        if (!showLevelMeters) return;
        const interval = setInterval(() => {
            const newLevelData = getAudioGraphInstance().getCurrentLevelFxReturn(fxNom);
            setLevelData(newLevelData);
        }, 100);
        return () => {
            clearInterval(interval);
        };
    }, [showLevelMeters]);

    return (<div className="estacio-mixer-columna estacio-mixer-fx-columna">
        <div className="track-controls">
            <div className="slider-wrapper">
                <GrufGainSliderVertical top='500px' left='50px' height='400px' fxNom={fxNom}/>
                <GrufGainMeter isMute={false} levelData={levelData}/>
            </div>
        </div>
        <div className="label">{label}</div>
    </div>)
}

export const MasterFader = ({ showLevelMeters, showMasterPan }) => {
    return (<div className="estacio-mixer-columna estacio-mixer-master-columna">
        <div className="track-controls">
            {showMasterPan ? <GrufKnob mida="gran" parameterParent={getAudioGraphInstance()} parameterName="masterPan" noOutput="true" customWidth="50px" customHeight="50px"/> : ""}
            <div className="slider-wrapper" style={{marginTop: showMasterPan ? 0:78}}>
                <GrufGainSliderVertical top='500px' left='50px' height='400px' isMasterGain={true}/>
                <GrufMasterMeter showLevelMeters={showLevelMeters} />
            </div>
        </div>
        <div className="label">Master</div>
    </div>)
}


export const EstacioMixerUI = ({ setEstacioSelected, showLevelMeters }) => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    const [isAnySolo, setIsAnySolo] = useState(false);

    const reportSoloChange = () => {
        const isAnySolo = Object.values(getCurrentSession().getLiveSolosEstacions()).some(solo => solo === true);
        setIsAnySolo(isAnySolo);
    }

    return (
        <div key="mixer1" className="estacio estacio-mixer" id="mixerObject">
            <div className="estacio-main p-4">
                <div className="" style={{textAlign:'right'}}>
                    <GrufCanviaInstrument setEstacioSelected={setEstacioSelected}/>
                </div>
                <div className="flex flex-col justify-between">
                    <div className="estacio-mixer-tracks">
                        <div className="estacio-mixer-normal-tracks">
                        {getCurrentSession().getNomsEstacions().map((nomEstacio) => {
                            const estacio = getCurrentSession().getEstacio(nomEstacio);
                            return (
                                <EstacioMixerTrack
                                    key={nomEstacio}
                                    estacio={estacio}
                                    isAnySolo = {isAnySolo}
                                    reportSoloChange = {reportSoloChange}
                                    showLevelMeters = {showLevelMeters}
                                />
                            );
                        })}
                        </div>
                        <FxReturnFader label="Reverb A" fxNom="reverbA" showLevelMeters={showLevelMeters}/>
                        <FxReturnFader label="Reverb B" fxNom="reverbB" showLevelMeters={showLevelMeters}/>
                        <FxReturnFader label="Delay A" fxNom="delayA" showLevelMeters={showLevelMeters}/>
                        <FxReturnFader label="Delay B" fxNom="delayB" showLevelMeters={showLevelMeters}/>
                        <MasterFader showMasterPan={false} showLevelMeters={showLevelMeters}/>
                    </div>
                </div>
            </div>
        </div>
    );
};