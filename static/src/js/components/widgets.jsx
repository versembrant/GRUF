import { createElement, useState, useEffect } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import isequal from 'lodash.isequal'

import { Knob } from 'primereact/knob';


const valueToText = (value) => {
    return `${value >= 5 ? value.toFixed(0) : value.toFixed(2)}`;
}

export const GrufLabel = ({text, top, left}) => {
    return (
        <div className="gruf-label" style={{top: top, left: left}}>
            {text}
        </div>
    )
}

export const GrufKnobGran = ({estacio, parameterName, top, left}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-knob-gran" style={{top: top, left: left}}>
            <Knob 
            value={real2Norm(parameterValue, parameterDescription)}
            min={0.0}
            max={1.0}
            step={0.01}
            size={60}
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.value, parameterDescription))} 
            valueTemplate={""}
            valueColor="#fff" 
            rangeColor="#969697"
            //valueTemplate={valueToText(parameterValue)}
            />
            <div>{parameterDescription.label}</div>
        </div>
    )
};

export const GrufKnobPetit = ({estacio, parameterName, top, left}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    return (
        <div className="gruf-knob-petit" style={{top: top, left: left}}>
            <Knob 
            value={real2Norm(parameterValue, parameterDescription)}
            min={0.0}
            max={1.0}
            step={0.01}
            size={25}
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.value, parameterDescription))} 
            valueTemplate={""}
            valueColor="#fff" 
            rangeColor="#969697"
            //valueTemplate={valueToText(parameterValue)}
            />
            <div>{parameterDescription.label}</div>
        </div>
    )
};