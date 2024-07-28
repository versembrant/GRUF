import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from '../audioEngine';
import { GrufKnobGran, GrufKnobPetit, GrufLabel, GrufEnum2Columns, GrufReverbTime, GrufOnOffButton, GrufBpmCounter, GrufButtonNoBorder } from "./widgets";


export const MonoSynthUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio mono-synth">
        <div className="estacio-main">
        <GrufKnobPetit estacio={estacio} parameterName="attack" top="35%" left="5%" />
            <GrufKnobPetit estacio={estacio} parameterName="decay" top="35%" left="10%" />
            <GrufKnobPetit estacio={estacio} parameterName="sustain" top="35%" left="14.7%" />
            <GrufKnobPetit estacio={estacio} parameterName="release" top="35%" left="19.8%" />
            <GrufLabel text="EQ" top="29.3%" left="52%" />
            <GrufKnobGran estacio={estacio} parameterName="harmonicity" top="30%" left="28%" />
            <GrufKnobGran estacio={estacio} parameterName="portamento" top="7.8%" left="28%" />
            <GrufLabel text="Reverb" top="7.3%" left="52%" />
            <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="40%" left="60%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="15%" left="51.2%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxLow" top="35%" left="51.5%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxMid" top="35%" left="56.4%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxHigh" top="35%" left="60.9%" />
            <GrufOnOffButton estacio={estacio} parameterName="fxDelayWet" top="20%" left="81.7%" valueOn={0.5} valueOff={0.0} />
            <GrufLabel text="Durada" top="29.3%" left="70.3%" />
            <GrufLabel text="Delay" top="14%" left="82.3%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxReverbWet" top="7.1%" left="70%" />
        </div>
    </div>)
};