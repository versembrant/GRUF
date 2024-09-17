import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import { GrufKnobGran, GrufKnobPetit, GrufLabel, GrufEnum2Columns, GrufReverbTime, GrufSlider, GrufOnOffButton, GrufBpmCounter, GrufButtonNoBorder, GrufSelectorTonalitat, GrufPianoRoll } from "./widgets";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";


export const EstacioPianoUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            <GrufButtonNoBorder text="Canvia estació" top="42px" left="822px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufLabel text="EQ" top="7.3%" left="6%" />
            <GrufKnobGran estacio={estacio} parameterName="fxLow" top="12%" left="5.8%" />
            <GrufKnobGran estacio={estacio} parameterName="fxMid" top="12%" left="15.5%" />
            <GrufKnobGran estacio={estacio} parameterName="fxHigh" top="12%" left="25%" />
            <GrufLabel text="Reverb" top="7.4%" left="37%" />
            <GrufLabel text="Durada" top="12.5%" left="36.7%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="16.2%" left="36.7%" />
            <GrufKnobGran estacio={estacio} parameterName="fxReverbWet" top="6.3%" left="56.2%" label="Send" />
            <GrufLabel text="Timbre" top="7.2%" left="68.2%" />
            <GrufSlider estacio={estacio} parameterName="timbre" top="110px" left="694px" width="225px" labelLeft="Soft" labelRight="Hard"/>
            <GrufSelectorTonalitat top="50.3%" left="80.6%" />
            <GrufPianoRoll estacio={estacio} parameterName="notes" top="208px" left="35px" width="740px" height="475px" colorNotes="rgb(255, 134, 56)"/>
        </div>
    </div>)
};