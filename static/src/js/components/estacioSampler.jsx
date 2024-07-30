import { createElement, useState, useEffect } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import { GrufKnobGran, GrufKnobPetit, GrufLabel,GrufLabelPetit, GrufEnum2Columns, GrufReverbTime, GrufPad, PadGrid, GrufOnOffButton } from "./widgets";


export const EstacioSamplerUI = ({estacio}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-sampler">
        <div className="estacio-main">
            <GrufLabel text="EQ" top="29.6%" left="51.7%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxLow" top="34.5%" left="51.9%" label = 'Low' />
            <GrufKnobPetit estacio={estacio} parameterName="fxMid" top="34.5%" left="56.9%" label = 'Mid' /> 
            <GrufKnobPetit estacio={estacio} parameterName="fxHigh" top="34.5%" left="61.9%" label = 'High' />
            <GrufLabel text="Reverb" top="7.3%" left="51.7%" />
            <GrufKnobPetit estacio={estacio} parameterName="fxReverbWet" top="6.6%" left="72.8%" label = 'Send' />
            <GrufLabel text="Durada" top="12.3%" left="51.7%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="15.0%" left="51.7%" />
            <GrufLabel text="Durada" top="29.6%" left="70.3%" />
            <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="34.2%" left="69.4%" />
            <GrufLabel text="Delay" top="14.1%" left="82.5%" />
            <GrufOnOffButton estacio={estacio} parameterName="fxDelayWet" top="19.5%" left="81.8%" />
            <GrufLabelPetit text="Mix" top="38.5%" left="84.2%" />
            <GrufLabelPetit text="Feedback" top="38.5%" left="88.0%" />
            <PadGrid top="71%" left="69%" />
            <GrufKnobGran estacio={estacio} parameterName="volume1" top="50%" left="5%" label = 'Vol' />
            <GrufKnobGran estacio={estacio} parameterName="pan1" top="64.5%" left="5%" label = 'Pan' />
            <GrufKnobGran estacio={estacio} parameterName="pitch1" top="79%" left="5%" label = 'Pitch' />

            <GrufKnobPetit estacio={estacio} parameterName="attack1" top="24%" left="5%" label = 'Attack' />
            <GrufKnobPetit estacio={estacio} parameterName="decay1" top="24%" left="10%" label = 'Decay' />
            <GrufKnobPetit estacio={estacio} parameterName="sustain1" top="24%" left="15%" label = 'Sustain' />
            <GrufKnobPetit estacio={estacio} parameterName="release1" top="24%" left="20%" label = 'Release' />

            <GrufKnobGran estacio={estacio} parameterName="start1" top="8%" left="41.3%" label = 'Start' />
            <GrufKnobGran estacio={estacio} parameterName="end1" top="21%" left="41.3%" label = 'End' />

        </div>
    </div>)
};