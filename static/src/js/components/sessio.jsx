import { useState, createElement } from "react";
import { getCurrentSession, getNomEstacioFromTipus, estacionsDisponibles } from "../sessionManager";
import { AudioTransportPlayStop } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { EstacioMixerUI } from "../components/estacioMixer";
import { EstacioComputerUI } from "../components/estacioComputer";
import { EntradaMidi } from "../components/entradaMidi";
import { getURLParamValue, removeURLParam, subscribeToPartialStoreChanges } from "../utils";
import { SessionWelcomeDialog } from "../components/sessionWelcomeDialog";
import logo_gruf from "../../img/logo_gruf.svg"
import { IkigaiMetronome } from "./widgets";
import { getAudioGraphInstance } from "../audioEngine";
import { EditaSessioDialog } from "./editaSessioDialog";
import { EliminaSessioDialog } from "./eliminaSessioDialog" 
import { SessionAudioRecorder } from "./sessionAudioRecorder";

const Estacio = ({estacio, setEstacioSelected}) => {
    return createElement(estacio.getUserInterfaceComponent(), {estacio, setEstacioSelected})
};

const GuardarSessionWidget = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    return (<div>
       {isSaving || justSaved ? <span className={isSaving ? "text-grey": "text-green"}>{isSaving ? "Guardant canvis...": "Canvis guardats!"}</span>: 
        <button className="btn-petit no-border" style={{paddingLeft: 0}}  onClick={()=>{
            setIsSaving(true);
            getCurrentSession().saveDataInServerUsingPostRequest(() => {
                setIsSaving(false);
                setJustSaved(true);
                setTimeout(() => {
                    setJustSaved(false);
                }, 2000);
            });
            }}>Guarda canvis al servidor</button>}
    </div>)
}

const estacioEstaDisponible = (nomEstacio) => {
    // TODO: afegir una comprovació (potser amb el servidor) per veure si l'usuari pot accedir a l'estació
    return getCurrentSession().getNomsEstacions().includes(nomEstacio) || nomEstacio == "Mixer" || nomEstacio == "Computer" || nomEstacio == undefined;
}

const onEstacioNoDisponible = (nomEstacio) => {
    alert(`L'estació ${nomEstacio} no està disponible`)
    removeURLParam('e');
}

let estacioSelectedURLParam = getURLParamValue('e', undefined);

const SessioHeader = ({ estacioSelected }) => {
    const [isMetronomeActive, setIsMetronomeActive] = useState(false);

    subscribeToPartialStoreChanges(getCurrentSession(), "name");

    const toggleMetronome = () => {
    const newState = !isMetronomeActive;
    setIsMetronomeActive(newState);
    getAudioGraphInstance().setIsMetronomeEnabled(newState);
    };
    return(
        <div className="header flex justify-between items-center">
            <div className="titol ellipsis"><img src={logo_gruf} className="logo_gruf"/><span className="text-grey">#{ getCurrentSession().getID() }</span> { getCurrentSession().getNom() }{getCurrentSession().adminMode ? <EditaSessioDialog/>: ""}{getCurrentSession().adminMode ? <EliminaSessioDialog/>: ""}</div>
            <div className="flex justify-between items-center" style={{gap: '4px'}}>
                {estacioSelected != undefined && estacioSelected != "Mixer" && estacioSelected != "Computer" ? <EntradaMidi estacio={getCurrentSession().getEstacio(estacioSelected)}/>: ""}
                {estacioSelected != undefined && estacioSelected != "Mixer" && estacioSelected != "Computer" && getCurrentSession().getEstacio(estacioSelected).showPanicButton === true ? <button className="btn-white btn-petit" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={() => getAudioGraphInstance().panic(estacioSelected)} title="Atura totes les notes que hagin quedat sonant">Pànic</button>:""}
                <button
                    onClick={toggleMetronome}
                    className={`btn-petit btn-white ${isMetronomeActive ? "active" : ""}`}
                    title="Activa/desactiva el metrònom"
                    >
                    <IkigaiMetronome isMetronomeActive={isMetronomeActive} bpm={getAudioGraphInstance().getBpm()} />
                </button>
                <AudioTransportPlayStop playMode="live" />
                <SessionAudioRecorder />
            </div>
        </div>
    )
}

const SessioFooter = ({estacioSelected}) => {

    const masterMode = document.getElementsByTagName('session')[0].dataset.masterAudioEngine === 'true'

    const estacio = estacioSelected ? getCurrentSession().getEstacio(estacioSelected) : undefined;
    let estacioTipus = estacio ? estacio.tipus : undefined;
    if (estacioSelected === "Mixer") {
        estacioTipus = "mixer";
    } else if (estacioSelected === "Computer") {
        estacioTipus = "computer";
    }

    return(
        <div className="footer flex justify-between items-center">
            <div style={{width: 300}} className="flex items-center">
                {getCurrentSession().adminMode ? <div className="marcaAdmin" title="Ets administrador d'aquesta sessió">{"A"}</div> : ""}
                {(masterMode && !getCurrentSession().localMode) ? <div className="marcaMaster" title="L'àudio d'aquesta sessió és en mode Master">{"M"}</div>:""}
                {getCurrentSession().localMode ? <div className="marcaLocal" title="Aquesta sessió està carregada en mode Local">{"L"}</div> : ""}
                {getCurrentSession().localMode ? "": <SessionConnectedUsers />}
                {(getCurrentSession().localMode && getCurrentSession().saveToServerEnabled ) ? <GuardarSessionWidget /> : ""} 
            </div>
            <div style={{width: 300}} className={estacioTipus ? "logo-estacio-no-hover estacio-" + estacioTipus + "-logo": ""}></div>
            <div style={{width: 300, textAlign: "right"}}>
                <a className="btn-petit no-border" href={appPrefix + "/"}>Surt del GRUF</a>
            </div>
        </div>
    )
}

const EstacioUI = ({ estacioSelected, setEstacioSelected }) => {
    return(
        <div className="estacions">
            {[...getCurrentSession().getNomsEstacions().filter((nomEstacio) => ((estacioSelected === nomEstacio)))].map((nomEstacio, i) => <Estacio key={nomEstacio} estacio={getCurrentSession().getEstacio(nomEstacio)} setEstacioSelected={setEstacioSelected}/>)}
            {estacioSelected == "Mixer" ? <EstacioMixerUI setEstacioSelected={setEstacioSelected} showLevelMeters={true} />: ""}
            {estacioSelected == "Computer" ? <EstacioComputerUI setEstacioSelected={setEstacioSelected}/>: ""}
        </div>
    )
}

const SelectorEstacions = ({ setEstacioSelected }) => {
    subscribeToPartialStoreChanges(getCurrentSession(), "random_number");  // Utilitzat per si hem de forçar redraw d'aquesta part de la UI quan es canvien instruments

    const assignaEstacio = (nomEstacio) => {
        // Si l'estació no està disponible, mostrar un missatge d'error
        if (!estacioEstaDisponible(nomEstacio)) {
            onEstacioNoDisponible(nomEstacio)
            setEstacioSelected(undefined);
        } else {
            setEstacioSelected(nomEstacio);
        }
    }

    const handleAfegeixEstacio = (tipus) => {
        // Troba l'estacio del mateix tipus que ja existeix i extreu el seu número del nom
        let biggestNumber = 0;
        getCurrentSession().getNomsEstacions().forEach((nomEstacio) => {
            const estacio = getCurrentSession().getEstacio(nomEstacio);
            if (estacio.tipus === tipus) {
                // Number is the last part of the name after the last space
                const lastSpaceIndex = nomEstacio.lastIndexOf(" ");
                const number = parseInt(nomEstacio.substring(lastSpaceIndex + 1));
                if (number > biggestNumber) {
                    biggestNumber = number;
                }
            }
        });
        const nomEstacio = getNomEstacioFromTipus(tipus, biggestNumber + 1);
        const estacio = new estacionsDisponibles[tipus](nomEstacio);
        estacio.initialize();
        getCurrentSession().afegeixEstacio(nomEstacio, estacio.getFullStateObject(), true)
    }

    return(
        <div className="tria-estacions">
            <h3 style={{fontWeight: 400}}>Tria un instrument:</h3>
            <div className="grid-estacions">
                {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => 
                    <div key={nomEstacio} className={"grid-estacio-element" + " estacio-"+getCurrentSession().getEstacio(nomEstacio).tipus} data-nom-estacio={nomEstacio} onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>
                        <img data-nom-estacio={nomEstacio} src={appPrefix + "/static/src/img/" + getCurrentSession().getEstacio(nomEstacio).tipus + "_miniature.jpg"} title={nomEstacio}/>
                        <div data-nom-estacio={nomEstacio}>{nomEstacio}{getCurrentSession().changeInstrumentsEnabled ? <span onClick={(evt)=>{evt.stopPropagation(); getCurrentSession().eliminaEstacio(nomEstacio, true)}}><img src={appPrefix + "/static/src/img/trash.svg"} style={{height:20, width: 20, cursor:"pointer", verticalAlign: "middle", marginLeft: 10}}/></span> : ""}</div>
                    </div>)}
                <div className="grid-estacio-element estacio-mixer" data-nom-estacio="mixer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>
                    <img data-nom-estacio="Mixer" src={appPrefix + "/static/src/img/mixer_miniature.jpg"} title="Mixer" />
                    <div data-nom-estacio="Mixer">Mixer</div>
                </div>
                <div className="grid-estacio-element estacio-computer" data-nom-estacio="computer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>
                    <img data-nom-estacio="Computer" src={appPrefix + "/static/src/img/computer_miniature.jpg"} title="Computer" />
                    <div data-nom-estacio="Computer">Computer</div>
                </div>
                {(getCurrentSession().changeInstrumentsEnabled && getCurrentSession().getNomsEstacions().length < 10) ? <div className="grid-estacio-element grid-estacio-element-add" onClick={() => handleAfegeixEstacio("synth")}>+ Afegir instrument</div> : ""}
            </div>
        </div>
    )
}

export const Sessio = () => {
    if (!estacioEstaDisponible(estacioSelectedURLParam)) { 
        onEstacioNoDisponible(estacioSelectedURLParam)
        estacioSelectedURLParam = undefined
    };
    const [estacioSelected, setEstacioSelected] = useState(estacioSelectedURLParam);  // Local state for component Sessio

    let showMainUI = true;
    if (location.href.indexOf("minimalui=1") != -1) {
        showMainUI = false;
    }

    const mainUI = estacioSelected ? <EstacioUI estacioSelected={estacioSelected} setEstacioSelected={setEstacioSelected}/> : <SelectorEstacions setEstacioSelected={setEstacioSelected}/>
    
    return (
        <div className="sessio-wrapper">
            <SessionWelcomeDialog sessionID={getCurrentSession().getID()} nomSessio={getCurrentSession().getNom()} />
            <div>
                <div className="sessio">
                    <SessioHeader estacioSelected={estacioSelected} />
                    {showMainUI ? mainUI: ""}
                    <SessioFooter estacioSelected={estacioSelected} />
                </div>
                <div className="sessio-logos">
                    <img src="/static/dist/landing/images/logo_versembrant_blanc.svg" alt="logo versembrant"/>
                    <img src="/static/dist/landing/images/logo_gene_blanc.svg" alt="logo generalitat"/>
                </div>
            </div>
        </div>
    )
};