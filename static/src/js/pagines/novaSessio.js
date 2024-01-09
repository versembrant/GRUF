import { getEstacioHelperInstance } from "../estacions";

const defaultSessionData = {
    estacions: {
        oscilador1: getEstacioHelperInstance('oscilador').getInitialState(), 
        sequenciador1: getEstacioHelperInstance('sequenciador').getInitialState(), 
    },
}
const dataInput = document.getElementsByName('data')[0];
dataInput.value = JSON.stringify(defaultSessionData);    
