import { createElement, useState, useEffect } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import { GrufKnobGran, GrufKnobPetit, GrufLabel, GrufEnum2Columns, GrufReverbTime, GrufPad, PadGrid } from "./widgets";


export const EstacioSamplerUI = ({estacio}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-sampler">
        <div className="estacio-main">
            <GrufLabel text="EQ" top="7%" left="6%" />
            <GrufKnobGran estacio={estacio} parameterName="fxLow" top="12%" left="5.8%" />
            <GrufKnobGran estacio={estacio} parameterName="fxMid" top="12%" left="15.5%" />
            <GrufKnobGran estacio={estacio} parameterName="fxHigh" top="12%" left="25%" />
            <GrufLabel text="Reverb" top="7.3%" left="37%" />
            <GrufLabel text="Durada" top="11.5%" left="36.7%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="15.5%" left="36.7%" />
            <GrufKnobGran estacio={estacio} parameterName="fxReverbWet" top="6.7%" left="54.8%" />
            <GrufLabel text="Timbre" top="7.2%" left="68.2%" />
            <PadGrid top="60%" left="40%" />
        </div>
    </div>)
};