import { estacionsDisponibles } from "../sessionManager";
import { useState } from "react";
import { Navbar, Footer } from "./frontpage";
import { capitalizeFirstLetter } from "../utils";

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
        const sessionData = {}
        sessionData.creation_timestamp = new Date().getTime();
        sessionData.bpm = 120;
        sessionData.swing = 0;
        sessionData.modBars = 4;
        sessionData.arranjament = {'numSteps': 32, 'beatsPerStep': 16, 'clips': []}
        sessionData.live = {'gainsEstacions': {}, 'mutesEstacions': {}, 'solosEstacions': {}, 'presetsEstacions': {}, 'effectParameters': {}}
        sessionData.estacions = {}
        estacionsSelected.forEach(estacioClassName => {
            const numEstacionsSameClassAlreadyExisting = Object.keys(sessionData.estacions).filter((nomEstacio) => sessionData.estacions[nomEstacio].tipus === estacioClassName).length;
            const nomEstacio = `${capitalizeFirstLetter(estacioClassName.replaceAll("_", " "))} ${numEstacionsSameClassAlreadyExisting + 1}`;
            const estacio = new estacionsDisponibles[estacioClassName](nomEstacio);
            estacio.initialize();
            sessionData.estacions[nomEstacio] = estacio.getFullStateObject();
            sessionData.live.gainsEstacions[nomEstacio] = 1.0;
            sessionData.live.mutesEstacions[nomEstacio] = false;
            sessionData.live.solosEstacions[nomEstacio] = false;
            sessionData.live.presetsEstacions[nomEstacio] = 0
        })
        
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
            <div className="nova-sessio-container">
                <div className="nova-sessio-wrapper">
                    <div className="sessio-header">
                        <h1>Nou GRUF</h1>
                        <div className="input-title">
                            <input
                                value={nomSessio}
                                onChange={e => setNomSessio(e.target.value)}
                                placeholder="Nom de la Sessió"
                            />
                        </div>
                    </div>
                    <div className="estacions-list">
                        <h2>Estacions Triades:</h2>
                        <div className="selected-cards">
                            {estacionsSelected.map((tipusEstacio, i) => (
                                <div className="card" key={tipusEstacio + '_' + i}>
                                    <p>{tipusEstacio}</p>
                                    <button className="delete-btn" onClick={() => handleRemoveStation(i)}>X</button>
                                </div>
                            ))}
                        </div>
                        <div className="selector-add-row"> 
                        <select
                            value={selectedOption}
                            onChange={(evt) => setSelectedOption(evt.target.value)}>
                            {Object.keys(estacionsDisponibles).map(tipusEstacio => (
                                <option key={tipusEstacio} value={tipusEstacio}>{tipusEstacio}</option>
                            ))}
                        </select>
                        <button className="add-btn" onClick={() => handleAddStation(selectedOption)}>Afegir Estació</button>
                        </div>
                    </div>
                    <div className="footer-controls">
                        <button className="primary-btn" onClick={handleSubmitForm}>Crear GRUF!</button>
                        <a href={appPrefix + "/"} className="secondary-btn">Torna Enrere</a>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    )
};