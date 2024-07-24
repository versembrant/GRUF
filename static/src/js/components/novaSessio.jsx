import { estacionsDisponibles } from "../sessionManager";
import { useState } from "react";
import { Navbar, Footer } from "./frontpage";

function sample(array) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
  }

function generateTitle() {
    var name_prefixes = ["Master", "Mr.", "Professor", "Mrs.", "Princess", "Prince", "The Pauper's", "The", "Betsy", "Billy", "Johnny"];
    var primary_nouns = ["Crystal", "Bugle", "Dreamer", "Dream", "Castle", "Moss", "Mountain", "Pit", "Bigfoot", "Dream maker", "Oathbreaker", "Bard", "X'arahan'tu", "Magic", "Acorn", "Sun", "Son", "Stump", "Arm"];
    var adjectives = ["Lost", "Five", "Faded", "Ancient", "Blackened", "Den of", "Despairing", "Golden", "Many", "Merry", "Clever", "Wonderful", "Sullen", "Angry", "Little", "Cowardly", "Silver", "Lasting", "Heavy", "Festive", "Gleeful", "Enchanted", "Wise", "Wistful", "Dark", "Untold"];
    var secondary_nouns = ["Hearts", "Stones", "Diamond Dogs", "Painted Toes", "Songs", "Tales", "Lords", "Promise", "Screams", "Plagues", "Dreams", "Roads", "Curses", "Spells", "Gloam", "Lands", "Marsh", "Hearts", "Rules", "Swamp", "Tale", "Apex", "Beggar"];
    var name_prefix = sample(name_prefixes);
    var primary_noun = sample(primary_nouns);
    var adjective = sample(adjectives);
    var secondary_noun = sample(secondary_nouns);
    var title = "";
    if (Math.random() < 0.5) {
      title = `${name_prefix} ${primary_noun} and the ${adjective} ${secondary_noun}`;
    } else {
      title = `The ${adjective} ${secondary_noun} of ${name_prefix} ${primary_noun}`;
    }
    return title;
  }

export const NovaSessio = () => {
    const [selectedOption, setSelectedOption] = useState(Object.keys(estacionsDisponibles)[0]);
    const estacionsDefault = Object.keys(estacionsDisponibles);
    const [estacionsSelected, setEstacionsSelected] = useState(estacionsDefault);
    const [nomSessio, setNomSessio] = useState(generateTitle());

    const handleAddStation = (stationToAdd) => {
        setEstacionsSelected([...estacionsSelected, stationToAdd]);
    }

    const handleRemoveStation = (index) => {
        setEstacionsSelected(estacionsSelected.filter((station, i) => i !== index));
    }

    const handleSubmitForm = (evt) => {
        // Create session data object
        const sessionData = {}
        sessionData.creation_timestamp = new Date().getTime();
        sessionData.bpm = 120;
        sessionData.swing = 0;
        sessionData.modBars = 4;
        sessionData.arranjament = {'numSteps': 32, 'beatsPerStep': 16, 'clips': []}
        sessionData.live = {'gainsEstacions': {}, 'presetsEstacions': {}, 'effectParameters': {}}
        sessionData.estacions = {}
        estacionsSelected.forEach(estacioClassName => {
            const numEstacionsSameClassAlreadyExisting = Object.keys(sessionData.estacions).filter((nomEstacio) => sessionData.estacions[nomEstacio].tipus === estacioClassName).length;
            const nomEstacio = `${estacioClassName}${numEstacionsSameClassAlreadyExisting + 1}`;
            const estacio = new estacionsDisponibles[estacioClassName](nomEstacio);
            estacio.initialize();
            sessionData.estacions[nomEstacio] = estacio.getFullStateObject();
            sessionData.live.gainsEstacions[nomEstacio] = 1.0;
            sessionData.live.presetsEstacions[nomEstacio] = 0
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
            <Navbar/>
            <div className="nou-gruf">
                <h1>Nou GRUF</h1>
                <div>
                    Nom:<input
                        style={{width:"300px"}}
                        value={nomSessio}
                        onChange={e => setNomSessio(e.target.value)}
                    />
                </div>
                <div>
                    <br/>
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
                <div className="enrere">
                    <a className="btn btn-verd" onClick={handleSubmitForm}>Crear GRUF!</a>&nbsp;
                    <a href={appPrefix + "/"} className="btn">Torna enrere</a>
                </div>
            </div>
        </div>
    )
};