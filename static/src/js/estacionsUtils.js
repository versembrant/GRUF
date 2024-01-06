import { createElement, useState, useEffect} from "react";
import { getCurrentSession } from "./sessionManager";


const creaWidgetPerParametre = (parameterData, nomEstacio, nomParametre, parametreValorState) => {

    if (parameterData.type === 'float') {
        return (
            createElement(
                'div',
                null,
                createElement('p', null, nomParametre + ': ', parametreValorState),
                createElement(
                    'input',
                    {'type': 'range', 'min': parameterData.min, 'max': parameterData.max, 'step': parameterData.step || 0.05, 'value': parametreValorState, onInput: (evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, nomParametre, evt.target.value)},
                    null
                )
            )
        );
    } else if (parameterData.type === 'enum') {
        const opcionsElements = [] 
        parameterData.options.forEach(option => {
            opcionsElements.push(createElement('option', {value: option}, option),)
        });
        return (
            createElement(
                'div',
                null,
                createElement('p', null, nomParametre + ': ', parametreValorState),
                createElement(
                    'select',
                    {'value': parametreValorState, onChange: (evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, nomParametre, evt.target.value)},
                    ...opcionsElements
                )
            )
        );
    } else {
        return createElement('div', null, 'Tipus de paràmetre no suportat');
    }
}


class EstacioHelperBase {

    constructor() {
        this.tipus = 'base'
        this.versio = '0.0'
        this.parametersData = {}
    }

    getInitialParametersState(){
        const initialParametersState = {}
        this.getParameterNames().forEach(parameterName => {
            initialParametersState[parameterName] = this.getParametersData()[parameterName].initial;
        })
        return initialParametersState;
    }

    getParameterNames() {
        if (this.parameterNames === undefined) { this.parameterNames = Object.keys(this.getParametersData()) }
        return this.parameterNames
    }
    
    getParametersData() {
        return this.parametersData
    }

    getInitialState() {
        return {
            tipus: this.tipus,
            versio: this.versio,
            parametres: this.getInitialParametersState(),
        };
    }

    getDefaultUserInterface() {    
        return ({ nomEstacio, estacioObj }) => {
            const estacio = estacioObj;
            const estacioHelper = getEstacioHelperInstance(estacioObj.tipus);
            const store = estacio.store;
            const [state, setState] = useState(store.getState());
            
            useEffect(() => {
                const unsubscribe = store.subscribe(() => {
                    setState(store.getState());
                });
                return () => unsubscribe();
            }, [setState]);
        
            const parametresElements = [];
            estacioHelper.getParameterNames().forEach(nom_parametre => {
                const parameterData = estacioHelper.getParametersData()[nom_parametre];
                parametresElements.push(creaWidgetPerParametre(parameterData, nomEstacio, nom_parametre, state[nom_parametre]));
            });
            
            return createElement(
                'div',
                null,
                createElement('h2', null, nomEstacio),
                createElement('p', null, 'Tipus:', estacioObj.tipus),
                [...parametresElements]
            );
        }
    }
}

const estacionsHelperInstances = {};

const registerEstacioHelperInstance = (estacioHelperInstance) => {
    console.log('Registering estacio helper', estacioHelperInstance.tipus)
    estacionsHelperInstances[estacioHelperInstance.tipus] = estacioHelperInstance;
}

const getEstacioHelperInstance = (tipus) => {
    return estacionsHelperInstances[tipus];
}

export { EstacioHelperBase, registerEstacioHelperInstance, getEstacioHelperInstance }
