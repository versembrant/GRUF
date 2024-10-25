import { GrufKnob, GrufButtonNoBorder, GrufSlider, GrufPianoRoll, GrufSelectorTonalitat } from "./widgets";
import { GrufModulADSR, GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";

export const EstacioBaixUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-synth_bass">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
        
            <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" top="80%" left="85%" label="Vol" />
            <GrufModulADSR estacio={estacio} top="4.8%" left="3.7%" height="276px"/>
            
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="portamento" top="8%" left="28%" />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="harmonicity" top="30%" left="28%" />
            
            <GrufModulEQ estacio={estacio} top="25.4%" left="49.5%"/>
            
            <GrufSlider orientation="vertical" estacio={estacio} parameterName="hpf" labelSize="14px" top="8.5%" left="38.2%" size="100px" fons="linies" />
            <GrufSlider orientation="vertical" estacio={estacio} parameterName="lpf" labelSize="14px" top="8.5%" left="43%" size="100px" fons="linies" />

            <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
            <GrufModulReverb estacio={estacio} top="4.8%" left="49.4%" />
            
            <GrufPianoRoll estacio={estacio} parameterName="notes" top="325px" left="35px" width="750px" height="343px" colorNotes="#d98adc"/>
            <GrufSelectorTonalitat position="absolute" top="55.4%" left="81.4%" />
            <GrufSlider orientation="vertical" estacio={estacio} parameterName="waveform" top="30%" left="36.5%" size="56px" noLabel="true" noOutput="true"/>
        </div>
    </div>)
};