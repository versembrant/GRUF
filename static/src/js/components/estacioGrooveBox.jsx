import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from '../audioEngine';
import { GrufKnobGran, GrufLabel, GrufLabelPetit, GrufEnum2Columns, GrufReverbTime, GrufOnOffButton, GrufBpmCounter, GrufButtonNoBorder, GrufKnobPetit, GrufLabelPetit } from "./widgets";


export const EstacioGrooveBoxUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-groovebox">
        <div className="estacio-main">
            <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufKnobGran estacio={estacio} parameterName="volume1" top="7%" left="4.4%" label="test" />
            <GrufKnobGran estacio={estacio} parameterName="swing1" top="7%" left="17.8%" />
            <GrufKnobGran estacio={estacio} parameterName="swing2" top="7%" left="29.0%" />
            <GrufBpmCounter estacio={estacio} top="8.5%" left="39.6%" />
            <GrufLabel text="bpm" top="17.8%" left="41%" />
            <GrufLabel text="Reverb" top="7.3%" left="51.7%" />
            <GrufLabel text="Durada" top="12.3%" left="51.7%" />
            <GrufReverbTime estacio={estacio} parameterName="reverbSend2" top="15.0%" left="51.7%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend1" top="6.6%" left="72.8%" />
            <GrufLabel text="Send" top="11.1%" left="72.2%" />
            <GrufLabel text="Delay" top="14%" left="82.5%" />
            <GrufOnOffButton estacio={estacio} parameterName="reverbSend3" top="19.5%" left="81.7%" />
            <GrufLabel text="EQ" top="29.2%" left="51.7%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend1" top="34.5%" left="51.9%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend1" top="34.5%" left="56.9%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend1" top="34.5%" left="61.9%" />
            <GrufLabelPetit text="Low" top="38.5%" left="52.2%" />
            <GrufLabelPetit text="Mid" top="38.5%" left="57.2%" />
            <GrufLabelPetit text="High" top="38.5%" left="62.0%" />
            <GrufLabel text="Durada" top="29.2%" left="70.3%" />
            {/* <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="50%" left="50%" /> */} {/* Falta implementar Delay */}
            <GrufLabelPetit text="Mix" top="38.5%" left="84.2%" />
            <GrufLabelPetit text="Feedback" top="38.5%" left="88.0%" />
            
            <GrufKnobPetit estacio={estacio} parameterName="volume4" top="48.5%" left="5%" />
            <GrufKnobPetit estacio={estacio} parameterName="tone4" top="48.5%" left="9%" />
            <GrufLabelPetit text="Vol" top="53%" left="5.3%" />
            <GrufLabelPetit text="Tone" top="53%" left="9%" />

            <GrufKnobPetit estacio={estacio} parameterName="volume3" top="61.0%" left="5%" />
            <GrufKnobPetit estacio={estacio} parameterName="tone3" top="61.0%" left="9%" />
            <GrufLabelPetit text="Vol" top="65.5%" left="5.3%" />
            <GrufLabelPetit text="Tone" top="65.5%" left="9%" />

            <GrufKnobPetit estacio={estacio} parameterName="volume2" top="72.5%" left="5%" />
            <GrufKnobPetit estacio={estacio} parameterName="tone2" top="72.5%" left="9%" />
            <GrufLabelPetit text="Vol" top="77.0%" left="5.3%" />
            <GrufLabelPetit text="Tone" top="77.0%" left="9%" />

            <GrufKnobPetit estacio={estacio} parameterName="volume1" top="85.0%" left="5%" />
            <GrufKnobPetit estacio={estacio} parameterName="tone1" top="85.0%" left="9%" />
            <GrufLabelPetit text="Vol" top="89.5%" left="5.3%" />
            <GrufLabelPetit text="Tone" top="89.5%" left="9%" />

            <GrufKnobPetit estacio={estacio} parameterName="atack4" top="48.5%" left="77%" />
            <GrufKnobPetit estacio={estacio} parameterName="release4" top="48.5%" left="82%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend4" top="48.5%" left="87%" />
            <GrufKnobPetit estacio={estacio} parameterName="swing4" top="48.5%" left="92%" />
            <GrufLabelPetit text="Attack" top="53%" left="76.6%" />
            <GrufLabelPetit text="Release" top="53%" left="81.4%" />
            <GrufLabelPetit text="Reverb" top="53%" left="86.5%" />
            <GrufLabelPetit text="Swing" top="53%" left="91.8%" />

            <GrufKnobPetit estacio={estacio} parameterName="atack3" top="61%" left="77%" />
            <GrufKnobPetit estacio={estacio} parameterName="release3" top="61%" left="82%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend3" top="61%" left="87%" />
            <GrufKnobPetit estacio={estacio} parameterName="swing3" top="61%" left="92%" />
            <GrufLabelPetit text="Attack" top="65.5%" left="76.6%" />
            <GrufLabelPetit text="Release" top="65.5%" left="81.4%" />
            <GrufLabelPetit text="Reverb" top="65.5%" left="86.5%" />
            <GrufLabelPetit text="Swing" top="65.5%" left="91.8%" />

            <GrufKnobPetit estacio={estacio} parameterName="atack3" top="72.5%" left="77%" />
            <GrufKnobPetit estacio={estacio} parameterName="release3" top="72.5%" left="82%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend3" top="72.5%" left="87%" />
            <GrufKnobPetit estacio={estacio} parameterName="swing3" top="72.5%" left="92%" />
            <GrufLabelPetit text="Attack" top="77%" left="76.6%" />
            <GrufLabelPetit text="Release" top="77%" left="81.4%" />
            <GrufLabelPetit text="Reverb" top="77%" left="86.5%" />
            <GrufLabelPetit text="Swing" top="77%" left="91.8%" />

            <GrufKnobPetit estacio={estacio} parameterName="atack4" top="85%" left="77%" />
            <GrufKnobPetit estacio={estacio} parameterName="release4" top="85%" left="82%" />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend4" top="85%" left="87%" />
            <GrufKnobPetit estacio={estacio} parameterName="swing4" top="85%" left="92%" />
            <GrufLabelPetit text="Attack" top="89.5%" left="76.6%" />
            <GrufLabelPetit text="Release" top="89.5%" left="81.4%" />
            <GrufLabelPetit text="Reverb" top="89.5%" left="86.5%" />
            <GrufLabelPetit text="Swing" top="89.5%" left="91.8%" />
                        
        </div>
    </div>)
};