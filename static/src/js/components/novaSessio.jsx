import { estacionsDisponibles } from "../sessionManager";
import { useState } from "react";
import { Navbar, Footer } from "./frontpage";
import { capitalizeFirstLetter } from "../utils";

function sample(array) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

function generateTitle() {
    const name_prefixes_masculine = ["Mestre", "Sr.", "Professor", "Príncep", "El del Poble", "Guillem", "Joan", 'Senyor'];
    const name_prefixes_feminine = ["Sra.", "Princesa", 'Professora', "La del Poble", "Bella", "Mestra", "Senyora"];

    const primary_nouns_masculine = ["Cristall", "Somni", "Somniador", "Castell", "Forat", "Peu Gran", "Creador de Somnis", "Tronc", "Braç"];
    const primary_nouns_feminine = ["Corneta", "Màgia", "Molsa", "Lluna", "Flor", "Muntanya", "Història", "Creadora de Somnis", 'Pluja', 'Boira', 'Tempesta'];

    const secondary_nouns_masculine = ["Cors", "Gossos", "Dits", "Homes", "Crits", "Encantaments", "Camins", "Indrets", "Mosaics", "Primats"];
    const secondary_nouns_feminine = ["Cançons", "Pedres", "Històries", "Promeses", "Plagues", "Plantes", "Boires", "Llàgrimes", "Veus", "Terres"];

    const adjectives_plural_masculine = ["Perduts", "Antics", "Daurats", "Enfosquits", "Enfadats", "Feliços", "Festius", "Encantats", "Savis", "Somiadors", "Foscos"];
    const adjectives_plural_feminine = ["Perdudes", "Antigues", "Daurades", "Enfosquides", "Enfadades", "Felices", "Festives", "Encantades", "Sàvies", "Somiadores", "Fosques"];

    let primary_noun, gender_primary;
    if (Math.random() < 0.5) {
        primary_noun = sample(primary_nouns_masculine);
        gender_primary = 'masculine';
    } else {
        primary_noun = sample(primary_nouns_feminine);
        gender_primary = 'feminine';
    }

    let name_prefix;
    if (gender_primary === 'masculine') {
        name_prefix = sample(name_prefixes_masculine);
    } else {
        name_prefix = sample(name_prefixes_feminine);
    }

    let secondary_noun, gender_secondary;
    if (Math.random() < 0.5) {
        secondary_noun = sample(secondary_nouns_masculine);
        gender_secondary = 'masculine';
    } else {
        secondary_noun = sample(secondary_nouns_feminine);
        gender_secondary = 'feminine';
    }

    let adjective;
    if (gender_secondary === 'masculine') {
        adjective = sample(adjectives_plural_masculine);
    } else {
        adjective = sample(adjectives_plural_feminine);
    }

    let title;
    if (Math.random() < 0.5) {
        if (gender_secondary === 'masculine') {
            title = `${name_prefix} ${primary_noun} i els ${secondary_noun} ${adjective}`;
        } else {
            title = `${name_prefix} ${primary_noun} i les ${secondary_noun} ${adjective}`;
        }
    } else {
        if (gender_secondary === 'masculine' && gender_primary === 'masculine') {
            title = `Els ${secondary_noun} ${adjective} del ${name_prefix} ${primary_noun}`;
        } else if (gender_secondary === 'feminine' && gender_primary === 'feminine') {
            title = `Les ${secondary_noun} ${adjective} de la ${name_prefix} ${primary_noun}`;
        } else if (gender_secondary === 'masculine' && gender_primary === 'feminine') {
            title = `Els ${secondary_noun} ${adjective} de la ${name_prefix} ${primary_noun}`;
        } else {
            title = `Les ${secondary_noun} ${adjective} del ${name_prefix} ${primary_noun}`;
        }
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