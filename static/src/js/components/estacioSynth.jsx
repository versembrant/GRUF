import { GrufKnob, GrufButtonNoBorder, GrufSlider, GrufPianoRoll, GrufSelectorTonalitat } from "./widgets";
import { GrufModulADSR, GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";

export const EstacioSynthUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-synth">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            
            <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" top="80%" left="85%" label="Vol" />
            <GrufModulADSR estacio={estacio} top="4.8%" left="3.7%" height="276px"/>
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxDrive" top="8%" left="28%" />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="harmonicity" top="30%" left="28%" />
            
            <GrufSlider orientation="vertical" estacio={estacio} parameterName="hpf" labelSize="14px" top="8.5%" left="38.2%" size="100px" />
            <GrufSlider orientation="vertical" estacio={estacio} parameterName="lpf" labelSize="14px" top="8.5%" left="43%" size="100px"/>
            
            <GrufModulEQ estacio={estacio} top="25.4%" left="49.5%"/>
            <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
            <GrufModulReverb estacio={estacio} top="4.8%" left="49.4%" />

            <GrufSelectorTonalitat position="absolute" top="50.3%" left="81.4%" />
       
            <GrufSlider orientation="vertical" estacio={estacio} parameterName="waveform" top="30%" left="36.5%" size="56px" noLabel="true" noOutput="true"/>
    
            <GrufPianoRoll estacio={estacio} parameterName="notes" top="325px" left="35px" width="750px" height="343px" colorNotes="#d43b5d" colorNotesDissalowed="#50121f" allowedNotes={[]}/>
        </div>
    </div>)
};