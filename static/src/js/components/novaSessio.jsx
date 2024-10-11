import { estacionsDisponibles } from "../sessionManager";
import { useState } from "react";
import { Navbar, Footer } from "./frontpage";
import { capitalizeFirstLetter, capitalize, sample } from "../utils";

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
    "cristall": { type: "noun", gender: "masculine", plural: "cristalls" },
    "somni": { type: "noun", gender: "masculine", plural: "somnis" },
    "corneta": { type: "noun", gender: "feminine", plural: "cornetes" },
    "lluna": { type: "noun", gender: "feminine", plural: "llunes" },
    "tronc": { type: "noun", gender: "masculine", plural: "troncs" },
    "braç": { type: "noun", gender: "masculine", plural: "braços" },
    "peu gran": { type: "noun", gender: "masculine", plural: "peus grans" },
    "forat": { type: "noun", gender: "masculine", plural: "forats" },
    "creador de somnis": { type: "noun", gender: "masculine", plural: "creadors de somnis" },
    "creadora de somnis": { type: "noun", gender: "feminine", plural: "creadores de somnis" },
    "castell": { type: "noun", gender: "masculine", plural: "castells" },
    "molsa": { type: "noun", gender: "feminine", plural: "molses" },
    "flor": { type: "noun", gender: "feminine", plural: "flors" },
    "muntanya": { type: "noun", gender: "feminine", plural: "muntanyes" },
    "història": { type: "noun", gender: "feminine", plural: "històries" },
    "pluja": { type: "noun", gender: "feminine", plural: "plujes" },
    "boira": { type: "noun", gender: "feminine", plural: "boires" },
    "tempesta": { type: "noun", gender: "feminine", plural: "tempestes" },
    "cor": { type: "noun", gender: "masculine", plural: "cors" },
    "gos": { type: "noun", gender: "masculine", plural: "gossos" },
    "cançó": { type: "noun", gender: "feminine", plural: "cançons" },
    "pedra": { type: "noun", gender: "feminine", plural: "pedres" },
    "perdut": { type: "adjective", gender: "masculine", plural: "perduts" },
    "perduda": { type: "adjective", gender: "feminine", plural: "perdudes" },
    "antic": { type: "adjective", gender: "masculine", plural: "antics" },
    "antigua": { type: "adjective", gender: "feminine", plural: "antigues" },
};

function sampleWordObjectByCriteria(criteria, objectCount=1) {
    const wordObjects = Object.entries(paraules)
    .filter(([singular, detalls]) => {
      return Object.entries(criteria).every(([criteri, valor]) => detalls[criteri] === valor);
    }).map(([singular, detalls]) => ({ ...detalls, singular }));

    return sample(wordObjects, objectCount);
}

function generateTitle() {
    const [primary_noun_object, secondary_noun_object] = sampleWordObjectByCriteria({ type: "noun" }, 2);

    const primary_noun = primary_noun_object.singular;
    const gender_primary = primary_noun_object.gender;

    const secondary_noun = secondary_noun_object.plural;
    const gender_secondary = secondary_noun_object.gender;

    const adjective = sampleWordObjectByCriteria({ type: "adjective", gender: gender_secondary }).plural;

    let title;
    const secondary_noun_determinant = gender_secondary === 'masculine' ? 'els' : 'les';
    if (Math.random() < 0.5) {
        const name_prefix = sampleWordObjectByCriteria({ type: "name_prefix", gender: gender_primary }).singular;
        title = [name_prefix, capitalize(primary_noun), 'i', secondary_noun_determinant, secondary_noun, adjective].join(" ");
    } else {
        const possessive_determinant = gender_primary === 'masculine' ? 'del' : 'de la';
        title = [capitalize(secondary_noun_determinant), secondary_noun, adjective, possessive_determinant, primary_noun].join(" ");
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
        sessionData.live = {'gainsEstacions': {}, 'pansEstacions': {}, 'mutesEstacions': {}, 'solosEstacions': {}, 'presetsEstacions': {}, 'effectParameters': {}}
        sessionData.estacions = {}
        estacionsSelected.forEach(estacioClassName => {
            const numEstacionsSameClassAlreadyExisting = Object.keys(sessionData.estacions).filter((nomEstacio) => sessionData.estacions[nomEstacio].tipus === estacioClassName).length;
            const nomEstacio = `${capitalizeFirstLetter(estacioClassName.replaceAll("_", " "))} ${numEstacionsSameClassAlreadyExisting + 1}`;
            const estacio = new estacionsDisponibles[estacioClassName](nomEstacio);
            estacio.initialize();
            sessionData.estacions[nomEstacio] = estacio.getFullStateObject();
            sessionData.live.gainsEstacions[nomEstacio] = 1.0;
            sessionData.live.pansEstacions[nomEstacio] = 0.0;
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