import { GrufKnob, GrufSelectorPresets, GrufLabelPetitVertical, GrufOnOffGridContainer, GrufBpmCounter, GrufButtonBorder, GrufButtonNoBorder, GrufSelectorPatronsGrid, GrufSeparatorLine } from "./widgets";
import { GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";
import { getAudioGraphInstance } from "../audioEngine";
import { grey } from "@mui/material/colors";

export const EstacioGrooveBoxUI = ({estacio, setEstacioSelected}) => {

    return (
        <div key={estacio.nom} className="estacio estacio-groovebox">
            <div    className="estacio-main grid gap-10 p-4" >
                <EntradaMidiTeclatQUERTYHidden estacio={estacio} />

                {/* Volum, Cutoff, Swing, i BPM Counter */}
                <fieldset className="modul-border modul-bg flex flex-col justify-between col-start-1 row-start-1 row-span-2" style={{width: 400, height: 120}}>
                    <fieldset className="flex justify-between">
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                        <GrufSeparatorLine />
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName="cutoff" label="Cutoff" />
                        <GrufSeparatorLine />
                        <GrufKnob mida="gran" parameterParent={getAudioGraphInstance()} parameterName="swing" label="Swing" />
                        <GrufSeparatorLine />
                        <GrufBpmCounter />
                    </fieldset>
                </fieldset>

                {/* Módul de Reverb */}
                <GrufModulReverb className="col-start-2 row-start-1 row-span-2" estacio={estacio} />

                {/* Botó de canviar estació */}
                <fieldset className="col-start-3 row-start-1" style={{width: 100, height: 50}}>
                <GrufButtonBorder text="Canvia estació" onClick={() => { setEstacioSelected(undefined) }}/>
                </fieldset>

                {/* Contenidor de controls: Selector de Patrons, Clear, Presets, Rec */}
                <fieldset className="modul-border modul-bg flex justify-between items-center col-start-1 row-start-3" style={{width: 400, height:150}}>
                    <fieldset className="grid justify-between items-center gap-10">
                        <GrufSelectorPatronsGrid className="col-start-1 row-start-1" estacio={estacio} parameterName="pattern" />
                        <div className="col-start-2 row-start-1" style={{ backgroundColor: "#e0e0e0", padding: "10px", borderRadius: "4px" }}>Clear</div>
                        <GrufSelectorPresets className="col-start-1 row-start-2" estacio={estacio} buttonSize="56px" />
                        <div className="col-start-2 row-start-2"style={{ backgroundColor: "#c0c0c0", padding: "10px", borderRadius: "4px" }}>Rec</div>
                    </fieldset>
                </fieldset>

                {/* Módul de EQ */}
                <GrufModulEQ className="col-start-2 row-start-3" estacio={estacio} style={{ gridArea: "EQ" }} />

                {/* Módul de Delay */}
                <GrufModulDelay className="col-start-3 row-start-2 row-span-2" estacio={estacio} />

                {/* Contenidor de GridOnOff */}

                <fieldset className="grid col-start-1 row-start-4 col-span-3" style={{ height: 350}}>

                    {/* Contenidor de TonVol */}
                    <fieldset className="col-start-1 row-start-1" style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "repeat(4, auto)", width:100, marginTop:20}}>
                        {["1", "2", "3", "4"].map(i => (
                            <>
                                <GrufKnob mida="petit" parameterParent={estacio} parameterName={`volume${i}`} label="Vol" />
                                <GrufKnob mida="petit" parameterParent={estacio} parameterName={`tone${i}`} label="Tone" />
                            </>
                        ))}
                    </fieldset>
                    {/* Grid OnOff */}
                    <fieldset className="col-start-2 row-start-1" style={{ height: 250 }}>
                        <GrufOnOffGridContainer  estacio={estacio} parameterName="pattern" />
                    </fieldset>
                    {/* Contenidor de ASSR */}
                    <fieldset className="col-start-3 row-start-1" style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, auto)", gap: "10px", marginTop:15}}>
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