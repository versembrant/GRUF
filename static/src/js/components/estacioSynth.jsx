import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from '../audioEngine';
import { GrufKnobGran, GrufLabelPetit, GrufKnobPetit, GrufLabel, GrufEnum2Columns, GrufReverbTime, GrufToggle, GrufButtonNoBorder, GrufSliderVertical, GrufPianoRoll, GrufSliderDiscret, GrufADSRWidget } from "./widgets";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";


export const EstacioSynthUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-synth">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            
            <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufADSRWidget estacio={estacio} top="4.8%" left="3.7%"/>
            <GrufLabel text="EQ" top="29.3%" left="52%" />
            <GrufKnobGran estacio={estacio} parameterName="fxDrive" top="8%" left="28%" />
            <GrufKnobGran estacio={estacio} parameterName="harmonicity" top="30%" left="28%" />
            
            <GrufLabel text="Reverb" top="7.3%" left="52%" />
            <GrufLabel text="Durada" top="12.7%" left="51.7%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="117px" left="51.7%" />
            <GrufKnobGran estacio={estacio} parameterName="fxReverbWet" top="6.3%" left="71%" label="Send" />
            
            <GrufKnobPetit estacio={estacio} parameterName="fxLow" top="35%" left="51.5%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxMid" top="35%" left="56.4%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxHigh" top="35%" left="60.9%" />
            
            <GrufSliderVertical estacio={estacio} parameterName="hpf" top="8.5%" left="38.2%"  fons="linies" />
            <GrufSliderVertical estacio={estacio} parameterName="lpf" top="8.5%" left="43%"  fons="linies" />
            <GrufLabel text="HPF" top="21.8%" left="38.2%" />
            <GrufLabel text="LPF" top="21.8%" left="43%" />

            <GrufLabel text="Delay" top="14%" left="82.3%" />
            <GrufToggle estacio={estacio} parameterName="fxDelayOnOff" top="19%" left="81.7%" valueOn={0.5} valueOff={0.0} />
            <GrufLabel text="Durada" top="29.6%" left="70.3%" />
            <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="34.2%" left="69.4%" />
            <GrufSliderVertical estacio={estacio} parameterName="fxDelayWet" top="28%" left="83.6%" labelBottom="0%" labelTop="100%" /> 
            <GrufSliderVertical estacio={estacio} parameterName="fxDelayFeedback" top="28%" left="88.9%" labelBottom="0%" labelTop="100%" /> 
            <GrufLabelPetit text="Mix" top="40.3%" left="84%" />
            <GrufLabelPetit text="Feedback" top="40.3%" left="87.6%" />
            
            <GrufSliderDiscret estacio={estacio} parameterName="waveform" top="30%" left="36.5%"  />
            
            <GrufPianoRoll estacio={estacio} parameterName="notes" top="325px" left="35px" width="750px" height="358px" colorNotes="#d43b5d" colorNotesDissalowed="#50121f" allowedNotes={[]}/>
        </div>
    </div>)
};