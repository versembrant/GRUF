import { getEstacioHelperInstance } from "../estacions";

const newSessionForm = document.getElementById('createSessionForm');
if (newSessionForm !== null){
    // Estem a la pàgina de creació de nova sessió
    const defaultSessionData = {
        estacions: {
            oscilador1: getEstacioHelperInstance('oscilador').getInitialState(), 
            sequenciador1: getEstacioHelperInstance('sequenciador').getInitialState(), 
        },
    }
    const dataInput = document.getElementsByName('data')[0];
    dataInput.value = JSON.stringify(defaultSessionData);    
}