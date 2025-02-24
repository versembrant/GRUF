import { GrufKnob, GrufToggle, GrufLegend, GrufDelayFeedback, GrufReverbDecay, GrufDelayTime, ADSRGraph, GrufEnum2Columns } from "./widgets";
import { subscribeToParameterChanges } from "../utils"; // subscriptions
import React from "react";
import { capitalize } from "../utils";

export const GrufModulADSR = ({className, estacio, soundNumber="", height, availableParameters=["attack", "decay", "sustain", "release"], includeVolume=false}) => {

    const knobs = availableParameters.map(parameter=> {
        return <GrufKnob key={parameter} mida="petit" parameterParent={estacio}
            parameterName={parameter + soundNumber} label={capitalize(parameter)} />
    })

    const attackParamName = `attack${soundNumber}`;
    const decayParamName = `decay${soundNumber}`;
    const sustainParamName = `sustain${soundNumber}`;
    const releaseParamName = `release${soundNumber}`;

    let volumeParamName = undefined;
    if (includeVolume) {
        volumeParamName = `volume${soundNumber}`;
        knobs.push(<GrufKnob key="volume" mida="petit" parameterParent={estacio}
            parameterName={volumeParamName} label="Volume" />)
    }

    return (
        <div className={`gruf-adsr-widget ${className}`} style={{height}}>
            <ADSRGraph estacio={estacio} dynamicHighlight={false} adsrParameterNames={[attackParamName, decayParamName, sustainParamName, releaseParamName]} volumeParamName={volumeParamName}/>
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
                <GrufEnum2Columns estacio={estacio} parameterName="fxDelaySelect" />
            </fieldset>
            <fieldset style={{flexDirection: "row"}}>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxDelaySend" label="Send" /> 
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
            <div style={{position: "absolute", top: 15, right: 17}}>
                <GrufEnum2Columns estacio={estacio} parameterName="fxReverbSelect" />
            </div>
            <div style={{position: "absolute", top: 35, right: 5}}>
                <GrufKnob mida="petit" parameterParent={estacio} parameterName="fxReverbSend" position="absolute" label="Send" />
            </div>
            <fieldset>
                <GrufLegend text="Durada" style={{alignSelf: 'flex-start'}} bare="true"></GrufLegend>
                <GrufReverbDecay send={select} />
            </fieldset>
        </fieldset>
    )
}