import { estacionsDisponibles } from "../sessionManager";
import { useState } from "react";
import { Navbar, Footer } from "./frontpage";
import { capitalizeFirstLetter } from "../utils";

function sample(array) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

const paraules = {
    "Mestre": { type: "name_prefix", gender: "masculine", number: "singular" },
    "Mestressa": { type: "name_prefix", gender: "feminine", number: "singular" },
    "Sr.": { type: "name_prefix", gender: "masculine", number: "singular" },
    "Sra.": { type: "name_prefix", gender: "feminine", number: "singular" },
    "Professor": { type: "name_prefix", gender: "masculine", number: "singular" },
    "Professora": { type: "name_prefix", gender: "feminine", number: "singular" },
    "Príncep": { type: "name_prefix", gender: "masculine", number: "singular" },
    "Princesa": { type: "name_prefix", gender: "feminine", number: "singular" },
    "El del Poble": { type: "name_prefix", gender: "masculine", number: "singular" },
    "La del Poble": { type: "name_prefix", gender: "feminine", number: "singular" },
    "Bella": { type: "name_prefix", gender: "feminine", number: "singular" },
    "Lord": { type: "name_prefix", gender: "masculine", number: "singular" },
    "Lady": { type: "name_prefix", gender: "feminine", number: "singular" },
    "L'estimat": { type: "name_prefix", gender: "masculine", number: "singular" },
    "L'estimada": { type: "name_prefix", gender: "feminine", number: "singular" },
    "Cristall": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Somni": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Corneta": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Lluna": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Tronc": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Braç": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Peu Gran": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Forat": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Creador de Somnis": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Castell": { type: "primary_noun", gender: "masculine", number: "singular" },
    "Molsa": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Flor": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Muntanya": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Història": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Creadora de Somnis": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Pluja": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Boira": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Tempesta": { type: "primary_noun", gender: "feminine", number: "singular" },
    "Cors": { type: "secondary_noun", gender: "masculine", number: "plural" },
    "Gossos": { type: "secondary_noun", gender: "masculine", number: "plural" },
    "Cançons": { type: "secondary_noun", gender: "feminine", number: "plural" },
    "Pedres": { type: "secondary_noun", gender: "feminine", number: "plural" },
    "Perduts": { type: "adjective", gender: "masculine", number: "plural" },
    "Antics": { type: "adjective", gender: "masculine", number: "plural" },
    "Perdudes": { type: "adjective", gender: "feminine", number: "plural" },
    "Antigues": { type: "adjective", gender: "feminine", number: "plural" },
};

function sampleWordsByCriteria(criteria) {
    const words = Object.keys(paraules).filter(key => {
        return Object.entries(criteria).every(([property, value]) => {
            return paraules[key][property] === value;
        });
    });
    return words[Math.floor(Math.random() * words.length)];
}

function generateTitle() {
    const gender_primary = Math.random() < 0.5 ? 'masculine' : 'feminine';
    const primary_noun = sampleWordsByCriteria({ type: "primary_noun", gender: gender_primary });
    const name_prefix = sampleWordsByCriteria({ type: "name_prefix", gender: gender_primary });

    const gender_secondary = Math.random() < 0.5 ? 'masculine' : 'feminine';
    const secondary_noun = sampleWordsByCriteria({ type: "secondary_noun", gender: gender_secondary, number: "plural" });
    const adjective = sampleWordsByCriteria({ type: "adjective", gender: gender_secondary, number: "plural" });

    let title;
    if (Math.random() < 0.5) {
        if (gender_secondary === 'masculine') {
            title = `${name_prefix} ${primary_noun} i els ${secondary_noun} ${adjective}`;
        } else {
            title = `${name_prefix} ${primary_noun} i les ${secondary_noun} ${adjective}`;
        }
    } else {
        if (gender_secondary === 'masculine' && gender_primary === 'masculine') {
            title = `Els ${secondary_noun} ${adjective} del ${primary_noun}`;
        } else if (gender_secondary === 'feminine' && gender_primary === 'feminine') {
            title = `Les ${secondary_noun} ${adjective} de la ${primary_noun}`;
        } else if (gender_secondary === 'masculine' && gender_primary === 'feminine') {
            title = `Els ${secondary_noun} ${adjective} de la ${primary_noun}`;
        } else {
            title = `Les ${secondary_noun} ${adjective} del ${primary_noun}`;
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