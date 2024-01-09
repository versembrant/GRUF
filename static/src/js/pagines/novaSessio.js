import { estacionsDisponibles } from "../sessionManager";

const estacioSequenciador = new estacionsDisponibles['sequenciador']();
estacioSequenciador.initialize()

const estacioOscilador = new estacionsDisponibles['oscilador']();
estacioOscilador.initialize()

const defaultSessionData = {
    estacions: {
        oscilador1: estacioOscilador.getStateForServer(), 
        sequenciador1: estacioSequenciador.getStateForServer(), 
    },
}
const dataInput = document.getElementsByName('data')[0];
dataInput.value = JSON.stringify(defaultSessionData);    
