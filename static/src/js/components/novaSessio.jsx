import { estacionsDisponibles } from "../sessionManager";
import { useState } from "react";

export const NovaSessio = () => {
    const [selectedOption, setSelectedOption] = useState(Object.keys(estacionsDisponibles)[0]);
    const estacionsDefault = Object.keys(estacionsDisponibles);
    const [estacionsSelected, setEstacionsSelected] = useState(estacionsDefault);
    const [nomSessio, setNomSessio] = useState("");

    const handleAddStation = (stationToAdd) => {
        setEstacionsSelected([...estacionsSelected, stationToAdd]);
    }

    const handleRemoveStation = (index) => {
        setEstacionsSelected(estacionsSelected.filter((station, i) => i !== index));
    }

    const handleSubmitForm = (evt) => {
        // Create session data object
        const sessionData = {}
        sessionData.bpm = 120;
        sessionData.gainsEstacions = {}
        sessionData.estacions = {}
        estacionsSelected.forEach(estacioClassName => {
            const numEstacionsSameClassAlreadyExisting = Object.keys(sessionData.estacions).filter((nomEstacio) => sessionData.estacions[nomEstacio].tipus === estacioClassName).length;
            const nomEstacio = `${estacioClassName}${numEstacionsSameClassAlreadyExisting + 1}`;
            const estacio = new estacionsDisponibles[estacioClassName](nomEstacio);
            estacio.initialize();
            sessionData.estacions[nomEstacio] = estacio.getFullStateObject();
            sessionData.gainsEstacions[nomEstacio] = 1.0;
        })
        
        // Create HTML form with the data and submit it
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '.';
        form.style.display = 'none';
        const input = document.createElement('input');
        input.name = 'name'
        input.value = nomSessio;
        form.appendChild(input);
        const input2 = document.createElement('input');
        input2.name = 'data'
        input2.value = JSON.stringify(sessionData);
        form.appendChild(input2);        
        document.body.appendChild(form);
        form.submit();
    }

    return(
        <div>
            <h1>Nova sessió</h1>
            <a href="/">Torna a la llista de sessions</a>
            <div>
                Estacions triades:
                <ul>
                    {estacionsSelected.map((tipusEstacio, i) => <li key={tipusEstacio + '_' + i}>{tipusEstacio} - <button onClick={() => handleRemoveStation(i)}>eliminar</button></li>)}
                </ul>
                <select
                    value={selectedOption}
                    onChange={(evt) => setSelectedOption(evt.target.value)}>
                    {Object.keys(estacionsDisponibles).map(tipusEstacio => <option key={tipusEstacio} value={tipusEstacio}>{tipusEstacio}</option>)}
                </select>
                <button onClick={(evt) => handleAddStation(selectedOption)}>Afegeix estació</button>
            </div>
            <div>
                <input
                    value={nomSessio}
                    onChange={e => setNomSessio(e.target.value)}
                />
                <button onClick={handleSubmitForm} type="submit">Crear sessió</button>
            </div>
        </div>
    )
};