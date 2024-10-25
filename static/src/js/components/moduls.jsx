import { GrufKnob, GrufLegend, GrufEnum2Columns, ADSRGraph } from "./widgets";


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

export const GrufModulEQ = ({estacio, top, left}) => {
    return (
        <fieldset className="gruf-modul gruf-modul-eq" style={{position: "absolute", top, left}}>
            <GrufLegend text="EQ" />
            <div>
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxLow" position='relative'/>
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxMid" position='relative' />
                <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxHigh" position='relative' />
            </div>
        </fieldset>
    )
    
}

export const GrufModulDelay = ({estacio, top, left}) => {
    return(
        <fieldset className="gruf-modul gruf-modul-delay" style={{position: "absolute", top, left}}>
            <GrufLegend text="Delay" />
            <div>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelayWet" label="Send" position="relative" /> 
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelayFeedback" label="Feedback" position="relative" /> 
            </div>
            <fieldset>
                <GrufLegend text="Durada" />
                <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" />
            </fieldset>
    </fieldset>
    )
}