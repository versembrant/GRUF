import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import { GrufKnobGran, GrufKnobPetit, GrufLabel, GrufEnum2Columns, GrufReverbTime, GrufSlider, GrufOnOffButton, GrufBpmCounter, GrufButtonNoBorder } from "./widgets";


export const EstacioPianoUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main">
            <GrufLabel text="EQ" top="6.8%" left="6%" />
            <GrufLabel text="Timbre" top="6.8%" left="68.3%"/>
            <GrufLabel text="Eq" top="6.8%" left="6%" />
            <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufKnobGran estacio={estacio} parameterName="fxLow" top="88px" left="59px" />
            <GrufKnobGran estacio={estacio} parameterName="fxMid" top="75px" left="125px" />
            <GrufKnobGran estacio={estacio} parameterName="fxHigh" top="75px" left="210px" />
            <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="50%" left="50%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="60%" left="70%" />
            <GrufSlider estacio={estacio} parameterName="timbre" top="110px" left="694px" />
            <GrufBpmCounter estacio={estacio} top="6.8%" left="55%" />
            <GrufOnOffButton estacio={estacio} parameterName="fxDelayWet" top="70%" left="80%" valueOn={0.5} valueOff={0.0} />
        </div>
    </div>)
};