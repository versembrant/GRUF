import { useState } from "react";
import { GrufPianoRoll, GrufKnob, GrufButtonNoBorder, GrufLabel, GrufLabelPetit, GrufEnum2Columns, GrufReverbTime, GrufPadGrid, GrufToggle, GrufSlider, GrufSelectorSonsSampler, GrufSelectorLoopMode, GrufADSRWidget } from "./widgets";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";
import { AudioRecorder } from "../components/audioRecorder";

export const EstacioSamplerUI = ({estacio, setEstacioSelected}) => {

    const [selectedPad, setSelectedPad] = useState(0);

    const handlePadClick = (padIndex) => {
        setSelectedPad(padIndex);
    };

    return (
        <div key={estacio.nom} className="estacio estacio-sampler">
            <div className="estacio-main">
                <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
                
                <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />
                <GrufLabel text="EQ" top="29.6%" left="51.7%" />
                
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxLow" top="34.5%" left="51.9%" label='Low' />
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxMid" top="34.5%" left="56.9%" label='Mid' /> 
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxHigh" top="34.5%" left="61.9%" label='High' />

                <GrufSlider orientation="vertical" estacio={estacio} parameterName="hpf" labelSize="14px" top="8.5%" left="29%" size="150px" fons="linies" />
                <GrufSlider orientation="vertical" estacio={estacio} parameterName="lpf" labelSize="14px" top="8.5%" left="33.8%" size="150px" fons="linies" />

                <GrufLabel text="Reverb" top="7.5%" left="51.6%" />
                <GrufLabel text="Durada" top="12.7%" left="51.7%" />
                <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="117px" left="51.7%" />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxReverbWet" top="6.3%" left="71%" label="Send" />
                
                <GrufLabel text="Delay" top="14.2%" left="82.3%" />
                <GrufToggle estacio={estacio} parameterName="fxDelayOnOff" top="19%" left="81.7%" valueOn={0.5} valueOff={0.0} />
                <GrufLabel text="Durada" top="29.6%" left="70.3%" />
                <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="34.2%" left="69.4%" />
                <GrufSlider orientation="vertical" estacio={estacio} parameterName="fxDelayWet" label="Mix" top="28%" left="83.6%" markStart="0%" markEnd="100%" /> 
                <GrufSlider orientation="vertical" estacio={estacio} parameterName="fxDelayFeedback" label="Feedback" top="28%" left="88.9%" markStart="0%" markEnd="100%" /> 

                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`volume${selectedPad + 1}`} top="50%" left="5%" label='Vol' />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`pan${selectedPad + 1}`} top="64.5%" left="5%" label='Pan' />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`pitch${selectedPad + 1}`} top="79%" left="5%" label='Pitch' />

                <GrufADSRWidget estacio={estacio} soundNumber={selectedPad + 1} top="4.8%" left="3.7%" height="197px"/>

                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`start${selectedPad + 1}`} top="7.3%" left="41.3%" label='Start' />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`end${selectedPad + 1}`} top="21%" left="41.3%" label='End' />

                <GrufSelectorLoopMode estacio={estacio} parameterName={`loopMode${selectedPad + 1}`} />

                 <GrufSelectorSonsSampler estacio={estacio} parameterName={`sound`} top="268px" left="60px" width="220" />  {/* sound${selectedPad + 1} if we wanted to control them individually, also need to change estacioSampler.js*/}

                <GrufPadGrid estacio={estacio} top="338px" left="155px" width="218px" height="312px" onPadClick={handlePadClick} currentSelectedPad={selectedPad} />
                <GrufPianoRoll estacio={estacio} parameterName="notes" top="328px" left="405px" width="550px" height="335px" colorNotes="#00e2d3" modeSampler="true"/>

                <div style={{position:"absolute", top:"263px", left:"295px"}}>
                    <AudioRecorder ui="minimal" onRecordUploadedCallback={(data) => {
                        console.log("Sound uploaded to server: ", data.url);
                        estacio.updateParametreEstacio('selectedSoundName', data.url.split("/").slice(-1)[0])
                    }} />
                </div>
            </div>

        </div>
    )
};