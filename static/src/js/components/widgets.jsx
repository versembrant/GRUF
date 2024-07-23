import { createElement, useState, useEffect } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real, hasPatronsPredefinits, getNomPatroOCap, getPatroPredefinitAmbNom} from "../utils";
import isequal from 'lodash.isequal'

import { Knob } from 'primereact/knob';
import Slider from '@mui/material/Slider';
import { createTheme, ThemeProvider } from '@mui/material/styles';



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

export const GrufEnum2Columns = ({estacio, parameterName, top, left}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    const enumOptions=parameterDescription.options;
    return (
        <div className="gruf-enum-2-columns" style={{top: top, left: left}}>
            {enumOptions.map((option, index) => {
                return (
                    <button 
                        key={index} 
                        className={parameterValue == option ? 'selected' : ''} 
                        onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, option)}
                    >
                        {option}
                    </button>
                )
            })}
        </div>
    )
}

export const GrufReverbTime = ({estacio, parameterName, top, left}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    
    return (
        <div className="gruf-reverb-time" style={{top: top, left: left}}>
            <div>Curta</div><div><button
                style={{width: "20%"}}
                className={parameterValue == "1.0" ? 'selected' : ''} 
                onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, "1.0")}
            ></button></div>
            <div>Mitja</div><div><button
                style={{width: "50%"}}
                className={parameterValue == "5.0" ? 'selected' : ''} 
                onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, "5.0")}
            ></button></div>
            <div>Llarga</div><div><button
                style={{width: "100%"}}
                className={parameterValue == "12.0" ? 'selected' : ''} 
                onClick={() => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, "12.0")}
            ></button></div>
        </div>
    )
}

export const GrufSlider = ({estacio, parameterName, top, left}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    const theme = createTheme({
        palette: {
          primary: {
            main: '#fff',
          },
          secondary: {
            main: "#969697",
          },
        },
      });
    const marks = [
        {
            value: 0,
            label: <div className="marques-slider">soft</div>
        },
        {
            value: 1,
            label: <div className="marques-slider">hard</div>
        },
    ];
    return (
        <ThemeProvider theme={theme}>
        <div className="gruf-slider" style={{top: top, left: left}}>
            <Slider 
            sx={{
                height: 17,
                '& .MuiSlider-thumb': {
                borderRadius: '2px',
                height: 27,
                width: 10,
                },
                '& .MuiSlider-mark':{
                    height: '1px',
                    color: "#969697",
                }
              }}
            value={real2Norm(parameterValue, parameterDescription)}
            step={0.01}
            min={0.0}
            max={1.0}
            marks={marks}
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterName, norm2Real(evt.target.value, parameterDescription))} 
            //valueTemplate={valueToText(parameterValue)}
            />
        </div>
        </ThemeProvider>
    )
};

export const GrufSliderVertical = ({estacio, parameterName, top, left}) => {
    const parameterDescription=estacio.getParameterDescription(parameterName);
    const parameterValue=estacio.getParameterValue(parameterName, estacio.getCurrentLivePreset());
    const nomEstacio=estacio.nom;
    const theme = createTheme({
        palette: {
          primary: {
            main: '#fff',
          },
          secondary: {
            main: "#969697",
          },
        },
      });
    return (
        <ThemeProvider theme={theme}>
        <div className="gruf-slider-vertical" style={{top: top, left: left}}>
            <Slider 
            sx={{
                height: 17,
                '& .MuiSlider-thumb': {
                borderRadius: '2px',
                height: 30,
                width: 10,
                },
              }}
            value={real2Norm(parameterValue, parameterDescription)}
            step={100}
            min={1200}
            max={12000}
            onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.value, parameterDescription))} 
            // valueTemplate={""}
            //valueTemplate={valueToText(parameterValue)}
            />
            {/* <div>{parameterDescription.label}</div> */}
        </div>
        </ThemeProvider>
    )
};
