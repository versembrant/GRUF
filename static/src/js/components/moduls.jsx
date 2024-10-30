import { GrufKnob, GrufSlider, GrufToggle, GrufLegend, GrufEnum2Columns, GrufReverbTime, ADSRGraph } from "./widgets";


export const GrufModulADSR = ({estacio, soundNumber="", height, top, left}) => {
    const attackParamName = `attack${soundNumber}`;
    const decayParamName = `decay${soundNumber}`;
    const sustainParamName = `sustain${soundNumber}`;
    const releaseParamName = `release${soundNumber}`;

    return (
        <div className="gruf-adsr-widget" style={{top, left, height}}>
            <ADSRGraph estacio={estacio} adsrParameterNames={[attackParamName, decayParamName, sustainParamName, releaseParamName]}/>
            <div className="adsr-knobs">
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={attackParamName} label='Attack'/>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={decayParamName} label='Decay'/>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={sustainParamName} label='Sustain'/>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName={releaseParamName} label='Release'/>
            </div>
        </div>
    )
}

export const GrufModulEQ = ({estacio, top, left}) => {
    return (
        <fieldset className="gruf-modul gruf-modul-eq" style={{position: "absolute", top, left}}>
            <GrufLegend text="EQ" />
            <GrufToggle estacio={estacio} parameterName="fxEqOnOff" />
            <div>
                <GrufKnob mida="gran" customWidth="50px" customHeight="50px" parameterParent={estacio} parameterName="fxLow"/>
                <GrufKnob mida="gran" customWidth="50px" customHeight="50px" parameterParent={estacio} parameterName="fxMid" />
                <GrufKnob mida="gran" customWidth="50px" customHeight="50px" parameterParent={estacio} parameterName="fxHigh" />
            </div>
        </fieldset>
    )
    
}

export const GrufModulDelay = ({estacio, top, left}) => {
    return(
        <fieldset className="gruf-modul gruf-modul-delay" style={{position: "absolute", top, left}}>
            <GrufLegend text="Delay" />
            <div>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelayWet" label="Send" /> 
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelayFeedback" label="Feedback" /> 
            </div>
            <fieldset>
                <GrufLegend text="Durada" />
                <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" />
            </fieldset>
    </fieldset>
    )
}

export const GrufModulReverb = ({estacio, top, left}) => {
    return(
        <fieldset className="gruf-modul gruf-modul-reverb" style={{position: "absolute", top, left}}>
            <GrufLegend text="Reverb" />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxReverbWet" position="absolute" label="Send" />
            <fieldset>
                <GrufLegend text="Durada" bare="true"></GrufLegend>
                <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" />
            </fieldset>
        </fieldset>
    )
}