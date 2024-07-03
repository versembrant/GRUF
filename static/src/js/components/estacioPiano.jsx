import { createElement, useState, useEffect } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import { GrufKnobGran, GrufKnobPetit, GrufLabel } from "./widgets";


export const EstacioPianoUI = ({estacio}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal
    
    return (<div key={estacio.nom} className="estacio estacio-piano">
        <div className="estacio-main">
            <GrufLabel text="Reverb" top="43px" left="52px" />
            <GrufKnobGran estacio={estacio} parameterName="fxLow" top="75px" left="44px" />
            <GrufKnobGran estacio={estacio} parameterName="fxMid" top="75px" left="125px" />
            <GrufKnobGran estacio={estacio} parameterName="fxHigh" top="75px" left="210px" />
        </div>
        <div className="estacio-bottom-bar">
            {estacio.tipus}
        </div>
    </div>)
};