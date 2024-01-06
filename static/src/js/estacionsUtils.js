import { createElement, useState, useEffect} from "react";
import { getCurrentSession } from "./sessionManager";


class EstacioHelperBase {

    constructor() {
        this.tipus = 'base'
        this.versio = '0.0'
        this.parameterNames = Object.keys(this.getParametersData())
    }

    getInitialParametersState(){
        const initialParametersState = {}
        this.parameterNames.forEach(parameterName => {
            initialParametersState[parameterName] = this.getParametersData()[parameterName].initial;
        })
        return initialParametersState;
    }

    getParameterNames() {
        return this.parameterNames
    }  

    getInitialState() {
        return {
            tipus: this.tipus,
            versio: this.versio,
            parametres: this.getInitialParametersState(),
        };
    }

    getUserInterface() {    
        return function DefaultEstacioUI({ nomEstacio, estacioObj }) {        

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
        
            const parametersData = estacioHelper.getParametersData()
            
            // TODO: move this to util function to creat react elements from enum options
            const tipusOpcionsElements = [] 
            parametersData.tipus.options.forEach(option => {
                tipusOpcionsElements.push(createElement('option', {value: option}, option),)
            });
            
            return createElement(
                'div',
                {className: 'estacio', id: nomEstacio},
                createElement('h1', null, nomEstacio),
                createElement('p', null, 'Tipus:', estacioObj.tipus),
                createElement('p', null, 'Osc freq: ', state.freq),
                createElement(
                    'input',
                    {'type': 'range', 'min': parametersData.freq.min, 'max': parametersData.freq.max, 'value': state.freq, onInput: (evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, 'freq', evt.target.value)},
                    null
                ),
                createElement('p', null, 'Osc amp: ', state.amplitud),
                createElement(
                    'input',
                    {'type': 'range', 'min': parametersData.amplitud.min, 'max': parametersData.amplitud.max, 'step': 0.05, 'value': state.amplitud, onInput: (evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, 'amplitud', evt.target.value)},
                    null
                ),
                createElement('p', null, 'Osc tipus: ', state.tipus),
                createElement(
                    'select',
                    {'value': state.tipus, onChange: (evt) => getCurrentSession().updateParametreEstacioInServer(nomEstacio, 'tipus', evt.target.value)},
                    ...tipusOpcionsElements
                ),
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
