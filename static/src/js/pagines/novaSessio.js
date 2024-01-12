import { estacionsDisponibles } from "../sessionManager";

const creaSessioAmbUnaEstacioDeCada = () => {
    const sessionData = {}
    sessionData.bpm = 120;
    sessionData.gainsEstacions = {}
    sessionData.estacions = {}
    Object.keys(estacionsDisponibles).forEach(tipusEstacio => {
        const estacio = new estacionsDisponibles[tipusEstacio]();
        estacio.initialize()
        sessionData.estacions[`${tipusEstacio}1`] = estacio.getFullStateObject();
        sessionData.gainsEstacions[`${tipusEstacio}1`] = 1.0;
    })
    return sessionData;
}

const dataInput = document.getElementsByName('data')[0];
dataInput.value = JSON.stringify(creaSessioAmbUnaEstacioDeCada());    
