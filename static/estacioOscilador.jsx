// Definició estació
class EstacioOscilador {
    getPlantilla() {
        return {
            tipus: 'oscilador',
            uiWidget: 'EstacioOsciladorUI',
            parametres: {
                freq: 440 + Math.random() * 100,
                amplitud: 0.3 + Math.random() * 0.7,
                tipus: 'sinusoidal'
            }
        };
    }        
}
const fabricaEstacioOscilador = new EstacioOscilador();

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
    
    return e(
        'div',
        {className: 'estacio', id: nomEstacio},
        e('h1', null, nomEstacio),
        e('p', null, 'Tipus:', estacio.tipus),
        e('p', null, 'Osc freq: ', state.freq),
        e(
            'input',
            {'type': 'range', 'min': '100', 'max': '4000', 'value': state.freq, onInput: (evt) => currentSession.updateParametreEstacioInServer(nomEstacio, 'freq', evt.target.value)},
            null
        ),
        e('p', null, 'Osc amp: ', state.amplitud),
        e(
            'input',
            {'type': 'range', 'min': '0.0', 'max': '1.0', 'step': 0.05, 'value': state.amplitud, onInput: (evt) => currentSession.updateParametreEstacioInServer(nomEstacio, 'amplitud', evt.target.value)},
            null
        ),
        e('p', null, 'Osc tipus: ', state.tipus),
        e(
            'select',
            {'value': state.tipus, onChange: (evt) => currentSession.updateParametreEstacioInServer(nomEstacio, 'tipus', evt.target.value)},
            e('option', {value: 'sinusoidal'}, 'sinusoidal'),
            e('option', {value: 'quadrada'}, 'quadrada'),
        ),
    );
}
