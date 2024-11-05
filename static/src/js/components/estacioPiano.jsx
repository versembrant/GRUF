import { GrufKnob, GrufSeparatorLine, GrufButtonBorder, GrufPianoRoll, GrufSelectorTonalitat, GrufNoteControls } from "./widgets";
import { GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";

export const EstacioPianoUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main grid gap-10 p-4">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            <GrufButtonBorder className="col-start-3 row-start-1" text="Canvia estació" onClick={() => {setEstacioSelected(undefined)}} />

            <fieldset className="modul-border flex justify-between items-center gap-10 col-start-1 row-start-1 row-span-2" style={{width:"443px", height:"120px"}}>
                <fieldset className="flex flex-1 justify-between items-center gap-10">
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                    <GrufSeparatorLine />
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="timbre"  label = 'Timbre' />
                </fieldset>
                <GrufSeparatorLine />
                <GrufSelectorTonalitat className="flex-1"/>
            </fieldset>   
            
            <GrufModulEQ className="col-start-2 row-start-3" estacio={estacio} />
            <GrufModulDelay className="col-start-3 row-start-2 row-span-2" estacio={estacio} />
            <GrufModulReverb className="col-start-2 row-start-1 row-span-2" estacio={estacio} />

            <GrufPianoRoll className="col-start-1 row-start-4 col-span-3" estacio={estacio} parameterName="notes" width="920px" height="343px" colorNotes="rgb(255, 134, 56)"/>
            <GrufNoteControls className="col-start-1 row-start-3" estacio={estacio}/>
        </div>
    </div>)
};