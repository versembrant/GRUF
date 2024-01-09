import { createElement, useState, useEffect} from "react";
import { getCurrentSession } from "./sessionManager";


const estacionsHelperInstances = {};

export const registerEstacioHelperInstance = (estacioHelperInstance) => {
    console.log('Registering estacio helper', estacioHelperInstance.tipus)
    estacionsHelperInstances[estacioHelperInstance.tipus] = estacioHelperInstance;
}

export const getEstacioHelperInstance = (tipus) => {
    return estacionsHelperInstances[tipus];
}


const creaUIWidgetPerParametre = (parameterData, nomEstacio, nomParametre, parametreValorState) => {

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
    } else if (parameterData.type === 'text') {
        return (
            createElement(
                'div',
                null,
                createElement('p', null, nomParametre + ': ', parametreValorState),
                createElement(
                    'input',
                    {'type': 'text', 'value': parametreValorState, onInput: (evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, nomParametre, evt.target.value)},
                    null
                )
            )
        );
    } else if (parameterData.type === 'steps') {
        const stepsElements = []
        const numSteps = parameterData.initial.length;
        for (let i = 0; i < numSteps; i++) {
            const filledClass = parametreValorState[i] == 1.0 ? 'filled' : '';
            stepsElements.push(createElement(
                    'div', 
                    {className: 'step ' + filledClass, onClick: (evt) => {
                        var updatedSteps = [...parametreValorState];
                        if (updatedSteps[i] == 1.0) {
                            updatedSteps[i] = 0.0;
                        } else {
                            updatedSteps[i] = 1.0;
                        }
                        getCurrentSession().updateParametreEstacioInServer(nomEstacio, nomParametre, updatedSteps)}
                    }, 
                    null
                )
            )
        }
        return createElement(
            'div',
            null,
            createElement('p', null, nomParametre + ': ', parametreValorState.join(',')),
            createElement('div', {className: 'steps'}, ...stepsElements)
        );
    } else {
        return createElement('div', null, 'Tipus de paràmetre no suportat');
    }
}


export class EstacioHelperBase {

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
                parametresElements.push(creaUIWidgetPerParametre(parameterData, nomEstacio, nom_parametre, state[nom_parametre]));
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

    getUserInterface() {
        return this.getDefaultUserInterface()
    }
    
}
