import { useEffect } from "react";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges} from "../utils";
import { AudioEffectsControlPanel} from  "./fxControlPanel"
import { GrufButtonNoBorder, GrufLabelEstacio } from "../components/widgets";
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';


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
    const parameterValue=getCurrentSession().getLiveSolosEstacions()[estacio.nom];
    return (<div>
        <input 
            type="range"
            min="0.0" 
            max="1.0"
            step="0.1"
            value={getCurrentSession().getLiveGainsEstacions()[estacio.nom]}
            name={estacio.nom}
            onInput={(evt) => {
                const currentGains = getCurrentSession().getLiveGainsEstacions();
                currentGains[estacio.nom] = parseFloat(evt.target.value, 10);
                getCurrentSession().liveSetGainsEstacions(currentGains);
            }}
        />{estacio.nom}
    </div>)
}

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
                labelBottom = {nomEstacio}
            />
        </div>
    );
};

export const EstacioMixerUI = ({setEstacioSelected, showLevelMeters}) => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    useEffect(() => {
        if (showLevelMeters) {
            // Setup interval to update level meters
            document.levelMeterInterval = setInterval(() => {
                {getCurrentSession().getNomsEstacions().map(function(nomEstacio, i){
                    const levelData = getAudioGraphInstance().getCurrentLevelEstacio(nomEstacio);
                    // TODO: draw level data on screen
                })}
            }, 100);

            return () => {
                // cleanup function
                clearInterval(document.levelMeterInterval);        
            }
        }
    });


    return (<div key="mixer1" className="estacio estacio-mixer" id="mixerObject">
        <div className="estacio-main">
                <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
                <div className="estacio-mixer-container">
                    {getCurrentSession().getNomsEstacions().map(function(nomEstacio, i){
                        const estacio = getCurrentSession().getEstacio(nomEstacio);
                        return (
                        <div key={nomEstacio} className="estacio-columna">
                            <GrufGainSliderVertical estacio={estacio} top = '250px' left = '50px' height='450px' fons = 'linies'/>
                            <div className="mute-solo-container">
                                <GrufMuteCheckbox estacio={estacio} />
                                <GrufSoloCheckbox estacio={estacio} />
                            </div>
                            <GrufLabelEstacio estacio= {estacio} className='nom-estacio-container' />
                        </div>);

                    })}
                    {/* <AudioEffectsControlPanel/>  */}
                </div>
                
        </div>
    </div>)
};