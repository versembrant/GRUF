import { useState } from "react";
import { GrufPianoRoll, GrufKnob, GrufButtonNoBorder, GrufPadGrid, GrufSlider, GrufSelectorSonsSampler } from "./widgets";
import { GrufModulADSR, GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
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

                <GrufSlider orientation="vertical" estacio={estacio} parameterName="hpf" labelSize="14px" top="8.5%" left="29%" size="150px" fons="linies" />
                <GrufSlider orientation="vertical" estacio={estacio} parameterName="lpf" labelSize="14px" top="8.5%" left="33.8%" size="150px" fons="linies" />
                
                <GrufModulEQ estacio={estacio} top="25.4%" left="49.5%"/>
                <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
                <GrufModulReverb estacio={estacio} top="4.8%" left="49.4%" />

                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`volume${selectedPad + 1}`} top="50%" left="5%" label='Vol' />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`pan${selectedPad + 1}`} top="64.5%" left="5%" label='Pan' />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`pitch${selectedPad + 1}`} top="79%" left="5%" label='Pitch' />

                <GrufModulADSR estacio={estacio} soundNumber={selectedPad + 1} top="4.8%" left="3.7%" height="197px"/>

                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`start${selectedPad + 1}`} top="7.3%" left="41.3%" label='Start' />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName={`end${selectedPad + 1}`} top="21%" left="41.3%" label='End' />

                <GrufSelectorSonsSampler estacio={estacio} top="268px" left="60px" width="220" />

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