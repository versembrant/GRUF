import { GrufKnob, GrufSeparatorLine, GrufButtonNoBorder, GrufPianoRoll, GrufSelectorTonalitat, GrufNoteControls } from "./widgets";
import { GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";

export const EstacioPianoUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />

            <fieldset className="modul-border flex justify-between items-center gap-10" style={{position: "absolute", top:"4.8%", left:"3.7%", width:"443px", height:"120px"}}>
                <fieldset className="flex flex-1 justify-between items-center gap-10">
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                    <GrufSeparatorLine />
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="timbre"  label = 'Timbre' />
                </fieldset>
                <GrufSeparatorLine />
                <GrufSelectorTonalitat className="flex-1"/>
            </fieldset>   
            
            <GrufModulEQ estacio={estacio} top="25.4%" left="49.5%"/>
            <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
            <GrufModulReverb estacio={estacio} top="4.8%" left="49.4%" />

            <GrufPianoRoll estacio={estacio} parameterName="notes" top="325px" left="35px" width="920px" height="343px" colorNotes="rgb(255, 134, 56)"/>
            <GrufNoteControls estacio={estacio}/>
        </div>
    </div>)
};