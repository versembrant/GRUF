import { estacionsDisponibles } from "../sessionManager";
import { useState, useRef, useEffect } from "react";
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

function getNomEstacioFromTitle(estacioTipus, nExisting) {
    return `${capitalizeFirstLetter(estacioTipus.replaceAll("_", " "))} ${nExisting > -1 ? nExisting + 1: ""}`;
}

export const NovaSessio = () => {
    const defaultTitle = useRef(generateTitle());
    const estacionsDefault = Object.keys(estacionsDisponibles);
    const [estacionsSelected, setEstacionsSelected] = useState(estacionsDefault);
    const wasLastStationChangeAdd = useRef(false);
    
    const handleAddStation = (stationToAdd) => {
        setEstacionsSelected([...estacionsSelected, stationToAdd]);
        wasLastStationChangeAdd.current = true;
    }

    const handleRemoveStation = (index) => {
        setEstacionsSelected(estacionsSelected.filter((station, i) => i !== index));
        wasLastStationChangeAdd.current = false;
    }

    useEffect(()=> {
        if (!wasLastStationChangeAdd.current) return;
        const currentStationListEl = document.querySelector(".selected-cards");
        currentStationListEl.scrollTo(0, currentStationListEl.scrollHeight);
    }, [estacionsSelected])

    const handleSubmitForm = (evt) => {
        const sessionData = {}
        sessionData.creation_timestamp = new Date().getTime();
        sessionData.modBars = 4;
        sessionData.arranjament = {'numSteps': 32, 'beatsPerStep': 32, 'clips': []}
        sessionData.live = {'gainsEstacions': {}, 'pansEstacions': {}, 'mutesEstacions': {}, 'solosEstacions': {}, 'presetsEstacions': {}, 'effectParameters': {}}
        sessionData.estacions = {}
        estacionsSelected.forEach(estacioClassName => {
            const numEstacionsSameClassAlreadyExisting = Object.keys(sessionData.estacions).filter((nomEstacio) => sessionData.estacions[nomEstacio].tipus === estacioClassName).length;
            const nomEstacio = getNomEstacioFromTitle(estacioClassName, numEstacionsSameClassAlreadyExisting);
            const estacio = new estacionsDisponibles[estacioClassName](nomEstacio);
            estacio.initialize();
            sessionData.estacions[nomEstacio] = estacio.getFullStateObject();
            sessionData.live.gainsEstacions[nomEstacio] = 1.0;
            sessionData.live.pansEstacions[nomEstacio] = 0.0;
            sessionData.live.mutesEstacions[nomEstacio] = false;
            sessionData.live.solosEstacions[nomEstacio] = false;
            sessionData.live.presetsEstacions[nomEstacio] = 0
        })
        
        const form = document.querySelector('form');
        const name = document.querySelector('[name=name]');
        if (name.value === '') name.value = name.placeholder; // donem el títol per defecte si no s'ha introduït
        const data = document.createElement('input');
        data.setAttribute('type', 'hidden');
        data.name = 'data'
        data.value = JSON.stringify(sessionData);
        form.appendChild(data);
        form.submit();
    }

    return(
        <div>
            <Navbar/>
            <div className="nova-sessio-container">
                <form className="nova-sessio-wrapper" method="POST" action=".">
                    <div className="sessio-header">
                        <h1>Nou GRUF</h1>
                        <div className="input-title">
                            <input name="name" placeholder={defaultTitle.current} />
                        </div>                        
                    </div>
                    <div className="estacions-list">
                        <h3>Estacions Triades:</h3>
                        <div className="selected-cards">
                            {estacionsSelected.map((tipusEstacio, i) => (
                                <div className="card" key={tipusEstacio + '_' + i}>
                                    {getNomEstacioFromTitle(tipusEstacio, estacionsSelected.filter((tipus, j) => (tipus === tipusEstacio && j<=i)).length - 1)}
                                    {estacionsSelected.length > 1 &&
                                        <div className="delete-btn" onClick={() => handleRemoveStation(i)}><img src={appPrefix + "/static/src/img/trash.svg"}></img></div>
                                    }
                                </div>
                            ))}
                        </div>
                        {estacionsSelected.length < 10 ?
                            < EstacioAdder handleAddStation={handleAddStation}/> :
                            <div className="selector-add-row">Has arribat al límit d'estacions! Gaudeix de la teva mega-sessió ;)</div>}
                    </div>
                    <div className="notificacio-controls">
                            Al crear el GRUF, envia un correu amb les dades del GRUF a la següent adreça de correu electrònic (opcional):
                            <input
                                name="email"
                                placeholder="correu@electronic.cat"
                            />
                        </div>
                    <div className="footer-controls">
                        <button type="button" className="btn-verd--primary" onClick={handleSubmitForm}>Crear GRUF!</button>
                    </div>
                </form>
            </div>
            <Footer/>
        </div>
    )
};

const EstacioAdder = ({handleAddStation}) => {
    const [selectedOption, setSelectedOption] = useState(Object.keys(estacionsDisponibles)[0]);

    return (
        <div className="selector-add-row"> 
            <select
                value={selectedOption}
                onChange={(evt) => setSelectedOption(evt.target.value)}>
                {Object.keys(estacionsDisponibles).map(tipusEstacio => (
                    <option key={tipusEstacio} value={tipusEstacio}>{getNomEstacioFromTitle(tipusEstacio, -1)}</option>
                ))}
            </select>
            <button type="button" className="btn-gris" onClick={() => handleAddStation(selectedOption)}>Afegir Estació</button>
        </div>
    )
}