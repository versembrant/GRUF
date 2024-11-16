import { GrufKnob, GrufSeparatorLine, GrufButtonBorder, GrufPianoRoll, NoteGenerator, GrufSelectorTonalitat, GrufNoteControls, GrufLogoEstacio } from "./widgets";
import { GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";

export const EstacioPianoUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main grid gap-10 p-4">
            <GrufLogoEstacio className="col-start-3 row-start-1" tipusEstacio={estacio.tipus} setEstacioSelected={setEstacioSelected}/>

            <fieldset className="modul-border flex justify-between items-center gap-10 col-start-1 row-start-1 row-span-2">
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

            <GrufPianoRoll className="col-start-1 row-start-4 col-span-3" estacio={estacio} parameterName="notes" width="920px" height="327px" colorNotes="rgb(255, 134, 56)"/>
            <GrufNoteControls className="flex flex-col gap-10 flex-wrap col-start-1 row-start-3" maxHeight="200px" estacio={estacio} parameterName={"notes"} ExtraComponent={NoteGenerator}/>
        </div>
    </div>)
};