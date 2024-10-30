import { GrufKnob, GrufSelectorPresets, GrufLabelPetitVertical, GrufOnOffGrid, GrufBpmCounter, GrufButtonNoBorder, GrufSelectorPatronsGrid } from "./widgets";
import { GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";
import { getAudioGraphInstance } from "../audioEngine";

export const EstacioGrooveBoxUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-groovebox">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />

            <fieldset className="gruf-widgetgroup widgetgroup-upleft" style={{position: "absolute", top:"4.8%", left:"3.7%", width:"443px", height:"120px"}}>
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="cutoff"  label = 'Cutoff' />
                <GrufKnob mida="gran" parameterParent={getAudioGraphInstance()} parameterName="swing" label = 'Swing' />
                <GrufBpmCounter />
            </fieldset>
    
            <GrufModulEQ estacio={estacio} top="25.4%" left="49.5%"/>
            <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
            <GrufModulReverb estacio={estacio} top="4.8%" left="49.4%" />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="volume1" top="48.5%" left="5%" label = 'Vol' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="tone1" top="48.5%" left="9%" label = 'Tone' />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="volume2" top="61.0%" left="5%" label = 'Vol' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="tone2" top="61.0%" left="9%" label = 'Tone' />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="volume3" top="72.5%" left="5%" label = 'Vol' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="tone3" top="72.5%" left="9%" label = 'Tone' />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="volume4" top="85.0%" left="5%" label = 'Vol' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="tone4" top="85.0%" left="9%" label = 'Tone' />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="attack1" top="48.5%" left="77%" label = 'Attack' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="release1" top="48.5%" left="82%" label = 'Release' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="reverbSend1" top="48.5%" left="87.5%" label = 'Reverb' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="swing1" top="48.5%" left="93%" label = 'Swing' />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="attack2" top="61%" left="77%" label = 'Attack' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="release2" top="61%" left="82%" label = 'Release' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="reverbSend2" top="61%" left="87.5%" label = 'Reverb' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="swing2" top="61%" left="93%" label = 'Swing' />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="attack3" top="72.5%" left="77%" label = 'Attack' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="release3" top="72.5%" left="82%" label = 'Release' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="reverbSend3" top="72.5%" left="87.5%" label = 'Reverb' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="swing3" top="72.5%" left="93%" label = 'Swing' />

            <GrufKnob mida="petit" parameterParent={estacio} parameterName="attack4" top="85%" left="77%" label = 'Attack' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="release4" top="85%" left="82%" label = 'Release' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="reverbSend4" top="85%" left="87.5%" label = 'Reverb' />
            <GrufKnob mida="petit" parameterParent={estacio} parameterName="swing4" top="85%" left="93%" label = 'Swing' />

            <GrufLabelPetitVertical text="OpHat" top="50.7%" left="13.6%" />
            <GrufLabelPetitVertical text="CHat" top="63.3%" left="14%" />
            <GrufLabelPetitVertical text="Snare" top="75%" left="13.8%" />
            <GrufLabelPetitVertical text="Kick" top="87.5%" left="14.3%" />

            <GrufSelectorPresets estacio={estacio} top="243px" left="345px" height="42px" />
            <GrufOnOffGrid estacio={estacio} parameterName="pattern" top="337px" left="182.5px"  />    

            <GrufSelectorPatronsGrid estacio={estacio} parameterName="pattern" top="256px" left="70px" width="210px" />       
        </div>
    </div>)
};