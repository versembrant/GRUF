// Definició estació
class EstacioOsciladorFactory {
    constructor(factoryName) {
        this.factoryName = factoryName
        this.defaultUiWidget = 'EstacioOsciladorUI'
    }    
    getParametersData() {
        return {
            freq: {type: 'float', min: '20.0', max: '4000.0', initial: 440},
            amplitud: {type: 'float', min: '0.0', max: '1.0', initial: 1.0},
            tipus: {type: 'enum', options: ['sinusoidal', 'quadrada', 'serra'], initial: 'sinusoidal'},
        }
    }
    // TODO: move these methods to abstract class
    getInitialParametersState(){
        const initialParametersState = {}
        this.getParameterNames().forEach(parameterName => {
            initialParametersState[parameterName] = this.getParametersData()[parameterName].initial;
        })
        return initialParametersState;
    }
    getParameterNames() {
        return Object.keys(this.getParametersData())
    }    
    getInitialState() {
        return {
            factoryName: this.factoryName,
            uiWidget: this.defaultUiWidget,
            parametres: this.getInitialParametersState(),
        };
    }        
}

const factoryEstacioOscilador = new EstacioOsciladorFactory('factoryEstacioOscilador');

// Component UI
function EstacioOsciladorUI({ nomEstacio }) {
    
    const estacio = currentSession.estacions[nomEstacio];
    const store = estacio.store;
    const [state, setState] = React.useState(store.getState());
    
    React.useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            setState(store.getState());
        });
        return () => unsubscribe();
    }, [setState]);

    const parametersData = factoryEstacioOscilador.getParametersData()
    
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
