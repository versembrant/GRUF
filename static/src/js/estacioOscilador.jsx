import { EstacioHelperBase, estacionsHelpers } from "./estacionsUtils";
import React from "react";

const { createElement: e } = React; // Util used in other react components: e = React.createElement


// Definició estació
class EstacioOsciladorHelper extends EstacioHelperBase {
    constructor(helperName) {
        super(helperName);
        this.defaultUiWidget = 'EstacioOsciladorUI'
    }    
    getParametersData() {
        return {
            freq: {type: 'float', min: '20.0', max: '4000.0', initial: 440},
            amplitud: {type: 'float', min: '0.0', max: '1.0', initial: 1.0},
            tipus: {type: 'enum', options: ['sinusoidal', 'quadrada', 'serra'], initial: 'sinusoidal'},
        }
    }        
}

export const estacioOsciladorHelper = new EstacioOsciladorHelper('estacioOsciladorHelper');
estacionsHelpers['estacioOsciladorHelper'] = estacioOsciladorHelper;


// Component UI
export function EstacioOsciladorUI({ nomEstacio }) {
    
    const estacio = currentSession.estacions[nomEstacio];
    const store = estacio.store;
    const [state, setState] = React.useState(store.getState());
    
    React.useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            setState(store.getState());
        });
        return () => unsubscribe();
    }, [setState]);

    const parametersData = estacioOsciladorHelper.getParametersData()
    
    // TODO: move this to util function to creat react elements from enum options
    const tipusOpcionsElements = [] 
    parametersData.tipus.options.forEach(option => {
        tipusOpcionsElements.push(e('option', {value: option}, option),)
    });
    
    return e(
        'div',
        {className: 'estacio', id: nomEstacio},
        e('h1', null, nomEstacio),
        e('p', null, 'Tipus:', estacio.tipus),
        e('p', null, 'Osc freq: ', state.freq),
        e(
            'input',
            {'type': 'range', 'min': parametersData.freq.min, 'max': parametersData.freq.max, 'value': state.freq, onInput: (evt) => currentSession.updateParametreEstacioInServer(nomEstacio, 'freq', evt.target.value)},
            null
        ),
        e('p', null, 'Osc amp: ', state.amplitud),
        e(
            'input',
            {'type': 'range', 'min': parametersData.amplitud.min, 'max': parametersData.amplitud.max, 'step': 0.05, 'value': state.amplitud, onInput: (evt) => currentSession.updateParametreEstacioInServer(nomEstacio, 'amplitud', evt.target.value)},
            null
        ),
        e('p', null, 'Osc tipus: ', state.tipus),
        e(
            'select',
            {'value': state.tipus, onChange: (evt) => currentSession.updateParametreEstacioInServer(nomEstacio, 'tipus', evt.target.value)},
            ...tipusOpcionsElements
        ),
    );
}

