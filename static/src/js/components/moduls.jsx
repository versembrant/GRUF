import { GrufKnob, GrufSlider, ADSRGraph } from "./widgets";


// TODO: position: relative should be default for knobs
export const GrufModulADSR = ({estacio, soundNumber="", height, top, left}) => {
    const attackParamName = `attack${soundNumber}`;
    const decayParamName = `decay${soundNumber}`;
    const sustainParamName = `sustain${soundNumber}`;
    const releaseParamName = `release${soundNumber}`;

    return (
        <div className="gruf-adsr-widget" style={{top, left, height}}>
            <ADSRGraph estacio={estacio} adsrParameterNames={[attackParamName, decayParamName, sustainParamName, releaseParamName]}/>
            <div className="adsr-knobs">
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={attackParamName} position='relative' label='Attack'/>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={decayParamName} position='relative' label='Decay'/>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={sustainParamName} position='relative' label='Sustain'/>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={releaseParamName} position='relative' label='Release'/>
            </div>
        </div>
    )
}