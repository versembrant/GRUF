import { useEffect } from "react";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";
import { AudioEffectsControlPanel} from  "./fxControlPanel"
import { GrufButtonNoBorder } from "../components/widgets";
import Checkbox from '@mui/material/Checkbox';


export const MuteCheckbox = ({ estacio }) => {
    const parameterValue=getCurrentSession().getLiveMutesEstacions()[estacio.nom];
    return (<div><Checkbox 
        sx={{
            color: "#fff",
            '&.Mui-checked': {
                color: "#fff",
            },
        }}
        checked={parameterValue}
        onChange={(evt) => {
            const currentMutes = getCurrentSession().getLiveMutesEstacions();
            currentMutes[estacio.nom] = evt.target.checked;
            getCurrentSession().liveSetMutesEstacions(currentMutes);
        }}
    />M</div>)
}

export const SoloCheckbox = ({ estacio }) => {
    const parameterValue=getCurrentSession().getLiveSolosEstacions()[estacio.nom];
    return (<div><Checkbox 
        sx={{
            color: "#fff",
            '&.Mui-checked': {
                color: "#fff",
            },
        }}
        checked={parameterValue}
        onChange={(evt) => {
            const currentSolos = getCurrentSession().getLiveSolosEstacions();
            currentSolos[estacio.nom] = evt.target.checked;
            getCurrentSession().liveSetSolosEstacions(currentSolos);
        }}
    />S</div>)
}

export const GainSlider = ({ estacio }) => {
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
            {getCurrentSession().getNomsEstacions().map(function(nomEstacio, i){
                const estacio = getCurrentSession().getEstacio(nomEstacio);
                return (
                <div key={nomEstacio}>
                    <GainSlider estacio={estacio} />
                    <MuteCheckbox estacio={estacio} />
                    <SoloCheckbox estacio={estacio} />
                    
                </div>);
            })}
            <AudioEffectsControlPanel/>
        </div>
    </div>)
};