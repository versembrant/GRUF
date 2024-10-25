import { GrufKnob, GrufLabel, GrufReverbTime, GrufSlider, GrufButtonNoBorder, GrufPianoRoll, GrufSelectorTonalitat } from "./widgets";
import { GrufModulEQ, GrufModulDelay } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";

export const EstacioPianoUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" top="80%" left="85%" label="Vol" />
            <GrufModulEQ estacio={estacio} top="4.8%" left="3.6%"/>
            <GrufLabel text="Reverb" top="7.5%" left="37%" />
            <GrufLabel text="Durada" top="12.5%" left="36.7%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="16.2%" left="36.7%" />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxReverbWet" top="6.3%" left="56.2%" label="Send" />
            <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
            <GrufLabel text="Timbre" top="7.2%" left="68.2%" />
            <GrufSlider estacio={estacio} parameterName="timbre" top="110px" left="694px" width="225px" markStart="Soft" markEnd="Hard" noLabel="true"  />
            <GrufSelectorTonalitat top="40.3%" left="81.4%" />
            <GrufPianoRoll estacio={estacio} parameterName="notes" top="208px" left="35px" width="740px" height="460px" colorNotes="rgb(255, 134, 56)"/>
        </div>
    </div>)
};