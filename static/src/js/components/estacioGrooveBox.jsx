import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from '../audioEngine';
import { GrufKnobGran, GrufLabel, GrufLabelPetit,GrufLabelPetitVertical, GrufOnOffGrid, GrufEnum2Columns, GrufReverbTime, GrufOnOffButton, GrufBpmCounter, GrufButtonNoBorder, GrufKnobPetit, GrufLabelPetit, GrufSliderVertical } from "./widgets";

export const EstacioGrooveBoxUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-groovebox">
        <div className="estacio-main">
            <GrufButtonNoBorder text="Canvia estació" top="43px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufKnobGran estacio={estacio} parameterName="volume" top="8%" left="6.3%" label="Vol" />
            <GrufKnobGran estacio={estacio} parameterName="swing1" top="8%" left="17.8%" label = 'Swing' />
            <GrufKnobGran estacio={estacio} parameterName="swing2" top="8%" left="29.0%" label = 'Tempo' />
            <GrufBpmCounter estacio={estacio} top="8%" left="39.6%" />
            <GrufLabel text="bpm" top="17.3%" left="41%" />
            <GrufLabel text="Reverb" top="7.3%" left="51.7%" />
            <GrufLabel text="Durada" top="12.3%" left="51.7%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="15.0%" left="51.7%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxReverbWet" top="6.6%" left="72.8%" label = 'Send' />
            <GrufLabel text="Delay" top="14.1%" left="82.5%" />
            <GrufOnOffButton estacio={estacio} parameterName="fxDelayOnOff" top="19.5%" left="81.8%" />
            <GrufLabel text="EQ" top="29.6%" left="51.7%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxLow" top="34.5%" left="51.9%" label = 'Low' />
            <GrufKnobPetit estacio={estacio} parameterName="fxMid" top="34.5%" left="56.9%" label = 'Mid' /> 
            <GrufKnobPetit estacio={estacio} parameterName="fxHigh" top="34.5%" left="61.9%" label = 'High' />
            <GrufLabel text="Durada" top="29.6%" left="70.3%" />
            <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="34.2%" left="69.4%" />
            <GrufSliderVertical estacio={estacio} parameterName="fxDelayWet" top="26.5%" left="83.6%" width="225px"/> 
            <GrufSliderVertical estacio={estacio} parameterName="fxDelayFeedback" top="26.5%" left="88.9%" width="225px"/> 
            <GrufLabelPetit text="Mix" top="39.5%" left="84.2%" />
            <GrufLabelPetit text="Feedback" top="39.5%" left="88.0%" />
           
            <GrufKnobPetit estacio={estacio} parameterName="volume4" top="48.5%" left="5%" label = 'Vol' />
            <GrufKnobPetit estacio={estacio} parameterName="tone4" top="48.5%" left="9%" label = 'Tone' />

            <GrufKnobPetit estacio={estacio} parameterName="volume3" top="61.0%" left="5%" label = 'Vol' />
            <GrufKnobPetit estacio={estacio} parameterName="tone3" top="61.0%" left="9%" label = 'Tone' />

            <GrufKnobPetit estacio={estacio} parameterName="volume2" top="72.5%" left="5%" label = 'Vol' />
            <GrufKnobPetit estacio={estacio} parameterName="tone2" top="72.5%" left="9%" label = 'Tone' />

            <GrufKnobPetit estacio={estacio} parameterName="volume1" top="85.0%" left="5%" label = 'Vol' />
            <GrufKnobPetit estacio={estacio} parameterName="tone1" top="85.0%" left="9%" label = 'Tone' />

            <GrufKnobPetit estacio={estacio} parameterName="atack4" top="48.5%" left="77%" label = 'Attack' />
            <GrufKnobPetit estacio={estacio} parameterName="release4" top="48.5%" left="82%" label = 'Release' />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend4" top="48.5%" left="87.5%" label = 'Reverb' />
            <GrufKnobPetit estacio={estacio} parameterName="swing4" top="48.5%" left="93%" label = 'Swing' />

            <GrufKnobPetit estacio={estacio} parameterName="atack3" top="61%" left="77%" label = 'Attack' />
            <GrufKnobPetit estacio={estacio} parameterName="release3" top="61%" left="82%" label = 'Release' />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend3" top="61%" left="87.5%" label = 'Reverb' />
            <GrufKnobPetit estacio={estacio} parameterName="swing3" top="61%" left="93%" label = 'Swing' />

            <GrufKnobPetit estacio={estacio} parameterName="atack2" top="72.5%" left="77%" label = 'Attack' />
            <GrufKnobPetit estacio={estacio} parameterName="release2" top="72.5%" left="82%" label = 'Release' />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend2" top="72.5%" left="87.5%" label = 'Reverb' />
            <GrufKnobPetit estacio={estacio} parameterName="swing2" top="72.5%" left="93%" label = 'Swing' />

            <GrufKnobPetit estacio={estacio} parameterName="atack1" top="85%" left="77%" label = 'Attack' />
            <GrufKnobPetit estacio={estacio} parameterName="release1" top="85%" left="82%" label = 'Release' />
            <GrufKnobPetit estacio={estacio} parameterName="reverbSend1" top="85%" left="87.5%" label = 'Reverb' />
            <GrufKnobPetit estacio={estacio} parameterName="swing1" top="85%" left="93%" label = 'Swing' />

            <GrufLabelPetitVertical text="OpHat" top="50.7%" left="13.6%" />
            <GrufLabelPetitVertical text="CHat" top="63.3%" left="14%" />
            <GrufLabelPetitVertical text="Snare" top="75%" left="13.8%" />
            <GrufLabelPetitVertical text="Kick" top="87.5%" left="14.3%" />

            <GrufOnOffGrid estacio={estacio} parameterName="pattern" top="337px" left="180px" />            
        </div>
    </div>)
};