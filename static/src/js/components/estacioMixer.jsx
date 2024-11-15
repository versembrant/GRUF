import { useEffect, useState, useRef } from "react";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { GrufKnob, GrufButtonNoBorder, GrufLabelEstacio, GrufLogoEstacio } from "../components/widgets";
import Slider from '@mui/material/Slider';

export const GrufMuteCheckbox = ({ estacio, isIndirectMute, setIsDirectMute }) => {
    const parameterValue = getCurrentSession().getLiveMutesEstacions()[estacio.nom];
    setIsDirectMute(parameterValue);

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
    changeSoloState(parameterValue);

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

export const GrufGainSliderVertical = ({ estacio, top, left, height }) => {
    const nomEstacio = estacio.nom; 
    const parameterValue = getCurrentSession().getLiveGainsEstacions()[nomEstacio]; 
    const marks = [];

    const style = { top: top, left: left };
    if (height !== undefined) {
        style.height = height;
    }

    const handleGainChange = (evt, value) => {
        const currentGains = getCurrentSession().getLiveGainsEstacions();
        currentGains[nomEstacio] = parseFloat(value, 10);
        getCurrentSession().setLiveGainsEstacions(currentGains);
    };

    return (
        <div className="gruf-gain-slider-vertical" style={style}>
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

export const GrufMasterGainSliderVertical = ({ top, left, height }) => {
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

const GrufGainMeter = ({isMute, id, levelData}) => {
    const minDB = -60;
    const maxDB = 6;
    const db = Math.max(minDB, Math.min(levelData.db, maxDB)); // Limitar entre minDB i maxDB
    const meterLevel = ((db - minDB) / (maxDB - minDB) * 100); // Escalar entre 0 i 100%

    return (
        <div
            id={id}
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
            <GrufKnob mida='gran' parameterParent={estacio} parameterName='pan' noOutput="true" customWidth="50px" customHeight="50px"/>

            <div className="slider-wrapper">
                <GrufGainSliderVertical estacio={estacio} top='500px' left='50px' height='400px'/>
                <GrufGainMeter
                    id={`meter-${estacio.nom}`}
                    isMute={isMute}
                    levelData={levelData}
                />
            </div>

            <div className="mute-solo-container">
                <GrufMuteCheckbox estacio={estacio} setIsDirectMute={setIsDirectMute} isIndirectMute={isIndirectMute}/>
                <GrufSoloCheckbox estacio={estacio} changeSoloState={changeSoloState} />
            </div>
            <GrufLabelEstacio className= 'nom-estacio-container'estacio={estacio}/>
        </div>
    )
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
            <div className="estacio-main">
                <GrufLogoEstacio tipusEstacio='mixer' setEstacioSelected={setEstacioSelected}/>
                <div className="estacio-mixer-container">
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
                    <div className="estacio-mixer-columna estacio-mixer-master-columna">
                        <GrufKnob mida="gran" parameterParent={getAudioGraphInstance()} parameterName="masterPan" noOutput="true" customWidth="50px" customHeight="50px"/>
                        <div className="slider-wrapper">
                        <GrufMasterGainSliderVertical top='500px' left='50px' height='400px'/>
                        <GrufMasterMeter showLevelMeters={showLevelMeters} />
                        </div>
                        <div className="master-label">Master</div>
                    </div>
                </div>
            </div>
        </div>
    );
};