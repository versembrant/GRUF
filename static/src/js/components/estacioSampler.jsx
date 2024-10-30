import { useState } from "react";
import { GrufPianoRoll, GrufKnob, GrufButtonNoBorder, GrufPadGrid, GrufSlider, GrufSelectorSonsSampler, GrufSelectorLoopMode} from "./widgets";
import { GrufModulADSR, GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";

export const EstacioSamplerUI = ({estacio, setEstacioSelected}) => {

    const [selectedPad, setSelectedPad] = useState(0);

    const handlePadClick = (padIndex) => {
        setSelectedPad(padIndex);
    };

    return (
        <div key={estacio.nom} className="estacio estacio-sampler">
            <div className="estacio-main">
                <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
                
                <GrufButtonNoBorder text="Canvia estació" top="44px" left="826px" onClick={() => {setEstacioSelected(undefined)}} />
                
                <div className="modul-border modul-bg" style={{position: "absolute", top: "4.7%", left: "3.6%", width: 220}}>
                    <div className="flex justify-between" >
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName='gain' label='Vol' />
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName='cutoff' label='Cutoff' />
                    </div>
                    <GrufSelectorSonsSampler estacio={estacio} parameterName={`sound`} />  {/* sound${selectedPad + 1} if we wanted to control them individually, also need to change estacioSampler.js*/}
                </div>

                <div className="modul-border modul-bg flex flex-col gap-10" style={{position: "absolute", top: "25.7%", left: "3.6%", width: 220}}>
                    <div className="flex justify-between">
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName={`start${selectedPad + 1}`} label='Start' />
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName={`end${selectedPad + 1}`} label='End' />
                    </div>
                    <div className="flex justify-between">
                        {/* <GrufKnob mida="petit" parameterParent={estacio} parameterName={`volume${selectedPad + 1}`} label='Vol' /> */}
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName={`pan${selectedPad + 1}`} label='Pan' />
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName={`pitch${selectedPad + 1}`} label='Pitch' />
                        <GrufSelectorLoopMode estacio={estacio} parameterName={`loopMode${selectedPad + 1}`} />
                    </div>
                </div>

                <GrufModulADSR estacio={estacio} soundNumber={selectedPad + 1} top="4.8%" left="26.8%" height="276px"/>

                <GrufModulEQ estacio={estacio} top="25.4%" left="49.5%"/>
                <GrufModulDelay estacio={estacio} top="11.5%" left="80.1%"/>
                <GrufModulReverb estacio={estacio} top="4.8%" left="49.4%" />

                <div className="flex gap-10" style={{position:"absolute", top:"327px", left:"38px"}}>
                    <GrufPadGrid estacio={estacio}  width="250px" height="333px" onPadClick={handlePadClick} currentSelectedPad={selectedPad} />
                    <GrufPianoRoll estacio={estacio} parameterName="notes" width="550px" height="335px" colorNotes="#00e2d3" modeSampler="true"/>
                </div>
                
            </div>
        </div>
    )
};