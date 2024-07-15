import { createElement, useState, useEffect } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import { GrufKnobGran, GrufKnobPetit, GrufLabel, GrufEnum2Columns, GrufReverbTime, GrufSelectButton } from "./widgets";


export const EstacioPianoUI = ({estacio}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal

    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main">
            <GrufLabel text="Eq" top="6.8%" left="6%" />
            <GrufKnobGran estacio={estacio} parameterName="fxLow" top="88px" left="59px" />
            <GrufKnobGran estacio={estacio} parameterName="fxMid" top="75px" left="125px" />
            <GrufKnobGran estacio={estacio} parameterName="fxHigh" top="75px" left="210px" />
            <GrufEnum2Columns estacio={estacio} parameterName="fxDelayTime" top="50%" left="50%" />
            <GrufReverbTime estacio={estacio} parameterName="fxReverbDecay" top="60%" left="70%" />
            <GrufSelectButton estacio={estacio} parameterName="fxDelayWet" top="70%" left="80%" />
        </div>
        <div className="estacio-bottom-bar">
            {estacio.tipus}
        </div>
    </div>)
};