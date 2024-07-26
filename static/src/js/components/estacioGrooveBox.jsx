import { subscribeToStoreChanges } from "../utils";
import { getAudioGraphInstance } from '../audioEngine';
import { GrufKnobGran, GrufLabel, GrufEnum2Columns, GrufReverbTime, GrufOnOffButton, GrufBpmCounter, GrufButtonNoBorder } from "./widgets";


export const EstacioGrooveBoxUI = ({estacio, setEstacioSelected}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-grooveBox">
        <div className="estacio-main">
            
        </div>
    </div>)
};