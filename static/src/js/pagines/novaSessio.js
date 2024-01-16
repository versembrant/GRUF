import { estacionsDisponibles } from "../sessionManager";

const creaSessioAmbUnaEstacioDeCada = () => {
    const sessionData = {}
    sessionData.bpm = 120;
    sessionData.gainsEstacions = {}
    sessionData.estacions = {}
    Object.keys(estacionsDisponibles).forEach(estacioClassName => {
        const nomEstacio = `${estacioClassName}1`;
        const estacio = new estacionsDisponibles[estacioClassName](nomEstacio);
        estacio.initialize();
        sessionData.estacions[nomEstacio] = estacio.getFullStateObject();
        sessionData.gainsEstacions[nomEstacio] = 1.0;
    })
    return sessionData;
}

const dataInput = document.getElementsByName('data')[0];
dataInput.value = JSON.stringify(creaSessioAmbUnaEstacioDeCada());    
