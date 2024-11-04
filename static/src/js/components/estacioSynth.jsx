import { GrufKnob, GrufSeparatorLine, GrufButtonNoBorder, GrufSlider, GrufPianoRoll, GrufSelectorTonalitat, GrufNoteControls } from "./widgets";
import { GrufModulADSR, GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";
import waveform_sine from "../../img/waveform_sine.svg"
import waveform_square from "../../img/waveform_square.svg"
import waveform_triangle from "../../img/waveform_triangle.svg"
import waveform_saw from "../../img/waveform_saw.svg"


export const EstacioSynthUI = ({estacio, setEstacioSelected}) => {
    return (
        <div key={estacio.nom} className="estacio estacio-synth">
            <EstacioSynthBaseUI estacio={estacio} setEstacioSelected={setEstacioSelected} colorNotesPiano="#d43b5d" />
        </div>
    )
};

export const EstacioSynthBaseUI = ({estacio, setEstacioSelected, colorNotesPiano}) => {
    return (
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />

            <fieldset className="modul-border modul-bg flex flex-col justify-between" style={{position: "absolute", top: "4.7%", left: "3.6%", width: 220}}>
                <fieldset className="flex justify-between">
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                    <GrufSeparatorLine />
                    <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxDrive" />
                </fieldset>
            <GrufSelectorTonalitat label={null}/>
            </fieldset>

            <fieldset className="modul-border modul-bg flex justify-between items-center" style={{position: "absolute", top: "28.2%", left: "3.6%", width: 220}}>
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
            
            <GrufModulADSR estacio={estacio} top="4.8%" left="26.8%" height="276px"/>

            <GrufModulEQ estacio={estacio} top="25.4%" left="49.5%"/>
            <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
            <GrufModulReverb estacio={estacio} top="4.8%" left="49.4%" />


            <GrufPianoRoll estacio={estacio} parameterName="notes" top="325px" left="35px" width="750px" height="343px" colorNotes={colorNotesPiano} />
            <GrufNoteControls estacio={estacio}/>
        </div>
    )
};
