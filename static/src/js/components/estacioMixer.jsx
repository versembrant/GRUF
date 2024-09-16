import { useEffect } from "react";
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges} from "../utils";
import { AudioEffectsControlPanel} from  "./fxControlPanel"
import { GrufButtonNoBorder, GrufMuteCheckbox, GrufSoloCheckbox, GrufGainSliderVertical, GrufSliderVertical, GrufLabelPetit, GrufLabelEstacio } from "../components/widgets";
import Checkbox from '@mui/material/Checkbox';


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
                            <GrufGainSliderVertical estacio={estacio} top = '250px' left = '50px' height='300px' fons = 'linies'/>
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