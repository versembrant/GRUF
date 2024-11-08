import { useState } from "react";
import { GrufPianoRoll, GrufKnob, GrufButtonBorder, GrufPadGrid, GrufSlider, GrufSelectorSonsSampler, GrufSelectorLoopMode, GrufSeparatorLine, GrufNoteControls} from "./widgets";
import { GrufModulADSR, GrufModulEQ, GrufModulDelay, GrufModulReverb } from "./moduls";
import { EntradaMidiTeclatQUERTYHidden } from "./entradaMidi";

export const EstacioSamplerUI = ({estacio, setEstacioSelected}) => {

    const [selectedPad, setSelectedPad] = useState(0);

    const handlePadClick = (padIndex) => {
        setSelectedPad(padIndex);
    };

    return (
        <div key={estacio.nom} className="estacio estacio-sampler">
            <div className="estacio-main grid gap-10 p-4">
                <EntradaMidiTeclatQUERTYHidden estacio={estacio} />
                <GrufButtonBorder className="col-start-4 row-start-1" text="Canvia estació" onClick={() => {setEstacioSelected(undefined)}} />
                
                <fieldset className="modul-border modul-bg flex flex-col gap-10 justify-between col-start-1 row-start-1 row-span-2">
                    <div className="flex justify-between" >
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName='gain' label='Vol' />
                        <GrufSeparatorLine/>
                        <GrufKnob mida="gran" parameterParent={estacio} parameterName='cutoff' label='Cutoff' />
                    </div>
                    <GrufSelectorSonsSampler estacio={estacio} parameterName={`sound`} width='180px'/>  {/* sound${selectedPad + 1} if we wanted to control them individually, also need to change estacioSampler.js*/}
                </fieldset>

                <fieldset className="modul-border modul-bg flex flex-col gap-10 col-start-1 row-start-3">
                    <fieldset>
                        <GrufSlider estacio={estacio} parameterName={[`start${selectedPad + 1}`, `end${selectedPad + 1}`]} noLabel noOutput />
                        <fieldset className="flex justify-between text-12" aria-hidden>
                            <span>Start</span>
                            <span>End</span>
                        </fieldset>
                    </fieldset>
                    <fieldset className="flex justify-between">
                        {/* <GrufKnob mida="petit" parameterParent={estacio} parameterName={`volume${selectedPad + 1}`} label='Vol' /> */}
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName={`pan${selectedPad + 1}`} label='Pan' />
                        <GrufKnob mida="petit" parameterParent={estacio} parameterName={`pitch${selectedPad + 1}`} label='Pitch' />
                        <GrufSelectorLoopMode estacio={estacio} parameterName={`loopMode${selectedPad + 1}`} />
                    </fieldset>
                </fieldset>

                <GrufModulADSR className="col-start-2 row-start-1 row-span-3" estacio={estacio} soundNumber={selectedPad + 1}/>

                <GrufModulEQ className="col-start-3 row-start-3" estacio={estacio}/>
                <GrufModulDelay className="col-start-4 row-start-2 row-span-2" estacio={estacio}/>
                <GrufModulReverb className="col-start-3 row-start-1 row-span-2" estacio={estacio}/>

                <fieldset className="flex gap-10 col-start-1 col-span-4 row-start-4">
                    <GrufPadGrid estacio={estacio}  width="250px" height="333px" onPadClick={handlePadClick} currentSelectedPad={selectedPad} />
                    <GrufPianoRoll estacio={estacio} parameterName="notes" width="550px" height="335px" colorNotes="#00e2d3" modeSampler="true"/>
                    <GrufNoteControls className="modul-border flex flex-col gap-10 justify-between align-center" estacio={estacio} width="100px" parameterName={"notes"}/>
                </fieldset>
                
            </div>
        </div>
    )
};