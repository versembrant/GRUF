import { useState } from "react";
import { subscribeToStoreChanges } from "../utils";
import { GrufPianoRoll, GrufKnobGran, GrufButtonNoBorder, GrufKnobGranDiscret, GrufKnobPetit, GrufLabel,GrufLabelPetit, GrufEnum2Columns, GrufReverbTime, GrufPadGrid, GrufOnOffButton, GrufSliderVertical, GrufSelectorSonsSampler, GrufADSRWidget } from "./widgets";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";
import { AudioRecorder } from "../components/audioRecorder";


export const EstacioSamplerUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació

    const [selectedPad, setSelectedPad] = useState(0);

    const handlePadClick = (padIndex) => {
        setSelectedPad(padIndex);
    };

    return (
        <div key={estacio.nom} className="estacio estacio-sampler">
            <div className="estacio-main">
                <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
                
                <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
                <GrufLabel text="EQ" top="29.6%" left="51.7%" />
                
                <GrufKnobPetit estacio={estacio} parameterName="fxLow" top="34.5%" left="51.9%" label='Low' />
                <GrufKnobPetit estacio={estacio} parameterName="fxMid" top="34.5%" left="56.9%" label='Mid' /> 
                <GrufKnobPetit estacio={estacio} parameterName="fxHigh" top="34.5%" left="61.9%" label='High' />

                <GrufSliderVertical estacio={estacio} parameterName="hpf" top="8.5%" left="29%" height="126px" fons="linies" />
                <GrufSliderVertical estacio={estacio} parameterName="lpf" top="8.5%" left="33.8%" height="126px" fons="linies" />
                <GrufLabel text="HPF" top="28.2%" left="29%" />
                <GrufLabel text="LPF" top="28.2%" left="33.8%" />
                
                <GrufLabel text="Reverb" top="7.3%" left="52%" />
                <GrufLabel text="Durada" top="12.7%" left="51.7%" />
                <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="117px" left="51.7%" />
                <GrufKnobGran estacio={estacio} parameterName="fxReverbWet" top="6.3%" left="71%" label="Send" />
                
                <GrufLabel text="Delay" top="14%" left="82.3%" />
                <GrufOnOffButton estacio={estacio} parameterName="fxDelayOnOff" top="19%" left="81.7%" valueOn={0.5} valueOff={0.0} />
                <GrufLabel text="Durada" top="29.6%" left="70.3%" />
                <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="34.2%" left="69.4%" />
                <GrufSliderVertical estacio={estacio} parameterName="fxDelayWet" top="28%" left="83.6%" labelBottom="0%" labelTop="100%" /> 
                <GrufSliderVertical estacio={estacio} parameterName="fxDelayFeedback" top="28%" left="88.9%" labelBottom="0%" labelTop="100%" /> 
                <GrufLabelPetit text="Mix" top="40.3%" left="84%" />
                <GrufLabelPetit text="Feedback" top="40.3%" left="87.6%" />

                <GrufKnobGran estacio={estacio} parameterName={`volume${selectedPad + 1}`} top="50%" left="5%" label='Vol' />
                <GrufKnobGran estacio={estacio} parameterName={`pan${selectedPad + 1}`} top="64.5%" left="5%" label='Pan' />
                <GrufKnobGranDiscret estacio={estacio} parameterName={`pitch${selectedPad + 1}`} top="79%" left="5%" label='Pitch' />

                <GrufADSRWidget estacio={estacio} soundNumber={selectedPad + 1} top="4.8%" left="3.7%" height="197px"/>

                <GrufKnobGran estacio={estacio} parameterName={`start${selectedPad + 1}`} top="7.3%" left="41.3%" label='Start' />
                <GrufKnobGran estacio={estacio} parameterName={`end${selectedPad + 1}`} top="21%" left="41.3%" label='End' />

                <GrufSelectorSonsSampler estacio={estacio} top="268px" left="60px" width="220" />

                <GrufPadGrid estacio={estacio} top="338px" left="155px" width="218px" height="312px" onPadClick={handlePadClick} currentSelectedPad={selectedPad} />
                <GrufPianoRoll estacio={estacio} parameterName="notes" top="328px" left="405px" width="550px" height="335px" colorNotes="#00e2d3" modeSampler="true"/>

                <div style={{position:"absolute", top:"263px", left:"295px"}}>
                    <AudioRecorder ui="minimal" onRecordUploadedCallback={(data) => {
                        console.log("Sound uploaded to server: ", data.url);
                        estacio.updateParametreEstacio('selecetdSoundName', data.url.split("/").slice(-1)[0])
                    }} />
                </div>
            </div>

        </div>
    )
};