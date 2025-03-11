import { GrufKnob, GrufLogoEstacio, GrufCanviaInstrument, GrufOnOffGridContainer, GrufBpmCounter, GrufButtonBorder, GrufNoteControls, GrufSelectorPatronsGrid, GrufSeparatorLine, GrufLabelPetit } from "./widgets";
import { GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { getAudioGraphInstance } from "../audioEngine";
import { grey } from "@mui/material/colors";

export const EstacioGrooveBoxUI = ({estacio, setEstacioSelected}) => {

    return (
        <div key={estacio.nom} className="estacio estacio-groovebox">
            <div    className="estacio-main grid gap-10 p-4" >

                {/* Volum, Cutoff, Swing, i BPM Counter */}
                <fieldset className="modul-border modul-bg flex items-center justify-between col-start-1 row-start-1 row-span-2" style={{width: 430}}>
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                    <GrufSeparatorLine />
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="cutoff" label="Cutoff" />
                    <GrufSeparatorLine />
                    <GrufKnob mida="gran" parameterParent={getAudioGraphInstance()} parameterName="swing" label="Swing" />
                    <GrufSeparatorLine />
                    <GrufBpmCounter />
                </fieldset>

                {/* Módul de Reverb */}
                <GrufModulReverb className="col-start-2 row-start-1 row-span-2" estacio={estacio} style={{width: 320}}/>

                <GrufCanviaInstrument className="col-start-3 row-start-1" setEstacioSelected={setEstacioSelected}/>


                <GrufNoteControls className="flex flex-col gap-10 flex-wrap col-start-1 row-start-3" maxHeight="150px" estacio={estacio} ExtraComponent={GrufSelectorPatronsGrid} parameterName={"pattern"}/>

                {/* Módul de EQ */}
                <GrufModulEQ className="col-start-2 row-start-3" estacio={estacio} parameterName = {'pattern'} />

                {/* Módul de Delay */}
                <GrufModulDelay className="col-start-3 row-start-2 row-span-2" estacio={estacio} />

                {/* Contenidor de GridOnOff */}

                <fieldset className="grid col-start-1 row-start-4 col-span-3" style={{ height: 350}}>

                    {/* Contenidor de TonVol */}
                    <fieldset className="col-start-1 row-start-1" style={{display: "grid", gridTemplateColumns: "30px 1fr 1fr", gridTemplateRows: "repeat(4, auto)", width:130, alignItems:'center'}}>
                        {["1", "2", "3", "4"].map(i => (
                            <>
                                <div style={{fontSize:"70%", transform:"rotate(-90deg)", textAlign:"center"}}>{['Open hat', 'Closed hat', 'Snare', 'Kick'][parseInt(i, 10) - 1]}</div>
                                <GrufKnob mida="petit" parameterParent={estacio} parameterName={`volume${i}`} label="Vol" />
                                <GrufKnob mida="petit" parameterParent={estacio} parameterName={`tone${i}`} label="Tone" />
                            </>
                        ))}
                    </fieldset>
                    {/* Grid OnOff */}
                    <GrufOnOffGridContainer  className="col-start-2 row-start-1" style={{ height: 250 }} estacio={estacio} parameterName="pattern" />
                    {/* Contenidor de ASSR */}
                    <fieldset className="col-start-3 row-start-1" style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, auto)", gap: "10px", alignItems:'center'}}>
                    {["1", "2", "3", "4"].map(i => (
                        <>
                            <GrufKnob mida="petit" parameterParent={estacio} parameterName={`attack${i}`} label="Attack" />
                            <GrufKnob mida="petit" parameterParent={estacio} parameterName={`release${i}`} label="Release" />
                            <GrufKnob mida="petit" parameterParent={estacio} parameterName={`reverbSend${i}`} label="Reverb" />
                            <GrufKnob mida="petit" parameterParent={estacio} parameterName={`swing${i}`} label="Swing" />
                        </>
                    ))}
                    </fieldset>
                </fieldset>
            </div>
        </div>
    );
};