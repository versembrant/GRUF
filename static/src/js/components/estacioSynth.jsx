import { GrufKnob, GrufSeparatorLine, GrufButtonBorder, GrufSlider, GrufPianoRoll, NoteGenerator, GrufSelectorTonalitat, GrufNoteControls } from "./widgets";
import { GrufModulADSR, GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";
import waveform_sine from "../../img/waveform_sine.svg"
import waveform_square from "../../img/waveform_square.svg"
import waveform_triangle from "../../img/waveform_triangle.svg"
import waveform_saw from "../../img/waveform_saw.svg"

export const EstacioSynthUI = ({estacio, setEstacioSelected}) => {
    return (
        <EstacioSynthBaseUI estacio={estacio} setEstacioSelected={setEstacioSelected} colorNotesPiano="#d43b5d" />
    )
};

export const EstacioSynthBaseUI = ({estacio, setEstacioSelected, colorNotesPiano}) => {
    return (
        <div key={estacio.nom} className={`estacio estacio-${estacio.tipus}`}>
            <div className="estacio-main grid gap-10 p-4">
                <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
                <GrufButtonBorder className="col-start-4 row-start-1" text="Canvia estació" onClick={() => {setEstacioSelected(undefined)}} />

                <fieldset className="modul-border modul-bg flex flex-col justify-between col-start-1 row-start-1 row-span-2" style={{width: 220}}>
                    <fieldset className="flex justify-between">
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                        <GrufSeparatorLine />
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxDrive" />
                    </fieldset>
                <GrufSelectorTonalitat label={null}/>
                </fieldset>

                <fieldset className="modul-border modul-bg flex justify-between items-center col-start-1 row-start-3" style={{width: 220}}>
                    <fieldset className="flex justify-between items-center gap-10">
                        <div className="flex">
                            <GrufSlider orientation="vertical" estacio={estacio} parameterName="waveform" size="56px" noLabel="true" noOutput="true"/>
                            <div className="flex flex-col justify-between" style={{width: 20}}>
                                <img src={waveform_sine} alt="Forma d'ona sinusoidal" />
                                <img src={waveform_square} alt="Forma d'ona quadrada" />
                                <img src={waveform_triangle} alt="Forma d'ona triangular" />
                                <img src={waveform_saw} alt="Forma d'ona de dent de serra" />
                            </div>
                        </div>
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName="harmonicity" />
                    </fieldset>
                    <GrufSeparatorLine />
                    <fieldset className="flex flex-col justify-between items-center">
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName="hpf" />
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName="lpf" />
                    </fieldset>
                </fieldset>
                
                <GrufModulADSR className="col-start-2 row-start-1 row-span-3" estacio={estacio}/>

                <GrufModulEQ className="col-start-3 row-start-3" estacio={estacio} />
                <GrufModulDelay className="col-start-4 row-start-2 row-span-2"estacio={estacio} />
                <GrufModulReverb className="col-start-3 row-start-1 row-span-2"estacio={estacio} />


                <fieldset className="col-start-1 col-span-4 flex justify-between gap-10">
                    <GrufNoteControls className="flex flex-col gap-10 justify-between align-center" estacio={estacio} ExtraComponent={NoteGenerator} width="178px" parameterName={"notes"}/>
                    <GrufPianoRoll estacio={estacio} parameterName="notes" width="750px" colorNotes={colorNotesPiano} />
                </fieldset>
            </div>
        </div>
    )
};
