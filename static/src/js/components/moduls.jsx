import { GrufKnob, GrufSlider, GrufToggle, GrufLegend, GrufEnum2Columns, GrufReverbTime, ADSRGraph } from "./widgets";
import React from "react";
import { capitalize } from "../utils";

export const GrufModulADSR = ({className, estacio, soundNumber="", height, availableParameters=["attack", "decay", "sustain", "release"]}) => {

    const knobs = availableParameters.map(parameter=> {
        return <GrufKnob mida="petit" parameterParent={estacio}
            parameterName={parameter + soundNumber} label={capitalize(parameter)} />
    })
    const attackParamName = `attack${soundNumber}`;
    const decayParamName = `decay${soundNumber}`;
    const sustainParamName = `sustain${soundNumber}`;
    const releaseParamName = `release${soundNumber}`;

    return (
        <div className={`gruf-adsr-widget ${className}`} style={{height}}>
            <ADSRGraph estacio={estacio} adsrParameterNames={[attackParamName, decayParamName, sustainParamName, releaseParamName]}/>
            <div className="adsr-knobs">
                {knobs}
            </div>
        </div>
    )
}

export const GrufModulEQ = ({className, estacio, top, left}) => {
    const position = (top || left) ? "absolute" : "relative"; // TODO: remove
    return (
        <fieldset className={`gruf-modul gruf-modul-eq ${className}`} style={{position, top, left}}>
            <GrufLegend text="EQ" />
            <GrufToggle className="self-start justify-self-end" estacio={estacio} parameterName="fxEqOnOff" />
            <div>
                <GrufKnob mida="gran" customWidth="50px" customHeight="50px" parameterParent={estacio} parameterName="fxLow"/>
                <GrufKnob mida="gran" customWidth="50px" customHeight="50px" parameterParent={estacio} parameterName="fxMid" />
                <GrufKnob mida="gran" customWidth="50px" customHeight="50px" parameterParent={estacio} parameterName="fxHigh" />
            </div>
        </fieldset>
    )
    
}

export const GrufModulDelay = ({className, estacio, top, left}) => {
    const position = (top || left) ? "absolute" : "static"; // TODO: remove
    return(
        <fieldset className={`gruf-modul gruf-modul-delay ${className}`} style={{position, top, left}}>
            <GrufLegend text="Delay" />
            <div>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelayWet" label="Send" /> 
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelayFeedback" label="Feedback" /> 
            </div>
            <fieldset className="items-center">
                <GrufLegend text="Durada" bare="true" />
                <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" />
            </fieldset>
    </fieldset>
    )
}

export const GrufModulReverb = ({className, estacio, style={}}) => {
    return(
        <fieldset className={`gruf-modul gruf-modul-reverb ${className}`} style={style}>
            <GrufLegend text="Reverb" />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxReverbWet" position="absolute" label="Send" />
            <fieldset>
                <GrufLegend text="Durada" style={{alignSelf: 'flex-start'}} bare="true"></GrufLegend>
                <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" />
            </fieldset>
        </fieldset>
    )
}