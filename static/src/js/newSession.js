import {estacioOsciladorHelper} from './estacioOscilador.jsx';

const newSessionForm = document.getElementById('createSessionForm');
if (newSessionForm !== null){
    // Estem a la pàgina de creació de nova sessió
    const defaultSessionData = {
        estacions: {
            oscilador1: estacioOsciladorHelper.getInitialState(), 
            oscilador2: estacioOsciladorHelper.getInitialState(), 
        },
    }
    const dataInput = document.getElementsByName('data')[0];
    dataInput.value = JSON.stringify(defaultSessionData);    
}