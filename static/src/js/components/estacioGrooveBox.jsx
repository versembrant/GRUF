import { GrufKnob, GrufSelectorPresets, GrufLabelPetitVertical, GrufOnOffGridContainer, GrufBpmCounter, GrufButtonBorder, GrufButtonNoBorder, GrufSelectorPatronsGrid, GrufSeparatorLine } from "./widgets";
import { GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";
import { getAudioGraphInstance } from "../audioEngine";
import { grey } from "@mui/material/colors";

export const EstacioGrooveBoxUI = ({estacio, setEstacioSelected}) => {

    return (<div key={estacio.nom} className="estacio estacio-groovebox">
        <div className="estacio-main">
            <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
            <GrufButtonBorder text="Canvia estació" top="3.8%" left="82.2%" onClick={() => {setEstacioSelected(undefined)}} />

            <fieldset className="modul-border flex justify-between items-center gap-10" style={{position: "absolute", top:"3.8%", left:"2.7%", width:"443px", height:"120px"}}>
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="gain" label="Vol" />
                <GrufSeparatorLine />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="cutoff"  label = 'Cutoff' />
                <GrufSeparatorLine />
                <GrufKnob mida="gran" parameterParent={getAudioGraphInstance()} parameterName="swing" label = 'Swing' />
                <GrufSeparatorLine />
                <GrufBpmCounter />
            </fieldset>

            <div 
                    className="modul-border gap-10"
                    style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                        gridTemplateRows: "1fr 1fr", 
                        gap: "10px",
                        position: "absolute", 
                        top: "22%", 
                        left: "2.7%", 
                        width: "443px", 
                        height: "150px" 
                    }}
                >
                    <div>
                        <GrufSelectorPatronsGrid estacio={estacio} parameterName="pattern" height='100%'width="250" />       
                    </div>
                    <div style={{ backgroundColor: "#e0e0e0", padding: "10px", borderRadius: "4px" }}>REC</div>
                    <div>
                        <GrufSelectorPresets estacio={estacio} buttonSize="56px" width='250px' />          
                    </div>
                    <div style={{ backgroundColor: "#c0c0c0", padding: "10px", borderRadius: "4px" }}>CLEAR</div>
            </div>
    
            <GrufModulEQ estacio={estacio} top="25.4%" left="50.5%"/>
            <GrufModulDelay estacio={estacio} top="11.5%" left="82.1%"/>
            <GrufModulReverb estacio={estacio} top="3.8%" left="50.4%" />

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

            <GrufOnOffGridContainer 
                estacio={estacio} 
                parameterName="pattern" 
                top="306px" 
                left="166.5px" 
            />
        </div>
    </div>)
};