import { useState, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { AudioTransportPlayStop } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { EstacioMixerUI } from "../components/estacioMixer";
import { EstacioComputerUI } from "../components/estacioComputer";
import { EntradaMidi } from "../components/entradaMidi";
import { getURLParamValue, removeURLParam } from "../utils";
import { SessionWelcomeDialog } from "../components/sessionWelcomeDialog";
import logo_gruf from "../../img/logo_gruf.svg"
import { IkigaiMetronome } from "./widgets";
import { getAudioGraphInstance } from "../audioEngine";

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
// removeURLParam('e');

const SessioHeader = ({ estacioSelected, setEstacioSelected }) => {
    const [isMetronomeActive, setIsMetronomeActive] = useState(false);
    const bpm = getAudioGraphInstance().getBpm(); // Obtiene el BPM actual

    const toggleMetronome = () => {
    const newState = !isMetronomeActive;
    setIsMetronomeActive(newState);
    getAudioGraphInstance().setIsMetronomeEnabled(newState);
    };
    return(
        <div className="header flex justify-between items-center">
            <div className="titol ellipsis"><img src={logo_gruf} className="logo_gruf"/><span className="text-grey">#{ getCurrentSession().getID() }</span> { getCurrentSession().getNom() }</div>
            <div className="flex justify-between items-center" style={{gap: '4px'}}>
                {estacioSelected != undefined && estacioSelected != "Mixer" && estacioSelected != "Computer" ? <EntradaMidi estacio={getCurrentSession().getEstacio(estacioSelected)}/>: ""}
                <button
                    onClick={toggleMetronome}
                    className={`btn-petit btn-white ${isMetronomeActive ? "active" : ""}`}
                    >
                    <IkigaiMetronome isMetronomeActive={isMetronomeActive} bpm={bpm} />
                </button>
                <AudioTransportPlayStop playMode={estacioSelected === 'Computer' ? 'arranjament' : 'live'} />
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
            <div className="flex justify-between items-center">
                {getCurrentSession().localMode ?<GuardarSessionWidget /> : ""}
                {getCurrentSession().localMode ? "": <SessionConnectedUsers />}{masterMode ? <div style={{marginLeft:5}}>{"(M)"}</div>:""}
            </div>
            <div className={estacioTipus ? "logo-estacio-no-hover estacio-" + estacioTipus + "-logo": ""}></div>
            <div><a className="btn-petit no-border" href={appPrefix + "/"}>Surt del GRUF</a></div>
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
    const assignaEstacio = (nomEstacio) => {
        // Si l'estació no està disponible, mostrar un missatge d'error
        if (!estacioEstaDisponible(nomEstacio)) {
            onEstacioNoDisponible(nomEstacio)
            setEstacioSelected(undefined);
        } else {
            setEstacioSelected(nomEstacio);
        }
    }

    return(
        <div className="tria-estacions">
            <h3 style={{fontWeight: 400}}>Tria una estació:</h3>
            <div className="grid-estacions">
                {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <div key={nomEstacio} className={"grid-estacio-element" + " estacio-"+getCurrentSession().getEstacio(nomEstacio).tipus} data-nom-estacio={nomEstacio} onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}><img data-nom-estacio={nomEstacio} src={appPrefix + "/static/src/img/" + getCurrentSession().getEstacio(nomEstacio).tipus + "_miniature.jpg"} title={nomEstacio}/><div data-nom-estacio={nomEstacio}>{nomEstacio}</div></div>)}
                <div className="grid-estacio-element estacio-mixer" data-nom-estacio="mixer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>
                    <img data-nom-estacio="Mixer" src={appPrefix + "/static/src/img/mixer_miniature.jpg"} title="Mixer" />
                    <div data-nom-estacio="Mixer">Mixer</div>
                </div>
                <div className="grid-estacio-element estacio-computer" data-nom-estacio="computer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>
                    <img data-nom-estacio="Computer" src={appPrefix + "/static/src/img/computer_miniature.jpg"} title="Computer" />
                    <div data-nom-estacio="Computer">Computer</div>
                </div>
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
                    <SessioHeader estacioSelected={estacioSelected} setEstacioSelected={setEstacioSelected}/>
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