import { GrufKnob, GrufToggle, GrufLegend, GrufDelayFeedback, GrufReverbDecay, GrufDelayTime, ADSRGraph, GrufEnum2Columns } from "./widgets";
import { subscribeToParameterChanges } from "../utils"; // subscriptions
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
    subscribeToParameterChanges(estacio, "fxDelaySelect");
    const select = estacio.getParameterValue("fxDelaySelect");
    const position = (top || left) ? "absolute" : "static"; // TODO: remove
    
    return(
        <fieldset className={`gruf-modul gruf-modul-delay ${className}`} style={{position, top, left}}>
            <GrufLegend text="Delay" />
            <fieldset>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelaySend" label="Send" /> 
                <GrufEnum2Columns estacio={estacio} parameterName="fxDelaySelect" />
            </fieldset>
            <fieldset>
                <GrufDelayFeedback send={select} /> 
            </fieldset>
            <fieldset>
                <GrufLegend text="Durada" bare="true" />
                <GrufDelayTime send={select} />
            </fieldset>
    </fieldset>
    )
}

export const GrufModulReverb = ({className, estacio, style={}}) => {
    subscribeToParameterChanges(estacio, "fxReverbSelect");
    const select = estacio.getParameterValue("fxReverbSelect");
    return(
        <fieldset className={`gruf-modul gruf-modul-reverb ${className}`} style={style}>
            <GrufLegend text="Reverb" />
            <GrufKnob mida="gran" parameterParent={estacio} parameterName="fxReverbSend" position="absolute" label="Send" />
            <div className={'w-90'}>
                <GrufEnum2Columns estacio={estacio} parameterName="fxReverbSelect" />
            </div>
            <fieldset>
                <GrufLegend text="Durada" style={{alignSelf: 'flex-start'}} bare="true"></GrufLegend>
                <GrufReverbDecay send={select} />
            </fieldset>
        </fieldset>
    )
}