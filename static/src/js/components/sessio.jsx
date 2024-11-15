import { useState, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { AudioTransportPlayStop } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { EstacioMixerUI } from "../components/estacioMixer";
import { EstacioComputerUI } from "../components/estacioComputer";
import { EntradaMidiMinimal } from "../components/entradaMidi";
import { getURLParamValue, removeURLParam } from "../utils";
import { SessionWelcomeDialog } from "../components/sessionWelcomeDialog";
import { GrufButtonBorder, GrufLogoEstacio } from "../components/widgets";
import logo_gruf from "../../img/logo_gruf.svg"

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
    return getCurrentSession().getNomsEstacions().includes(nomEstacio) || nomEstacio == "mixer" || nomEstacio == "computer" || nomEstacio == undefined;
}

const onEstacioNoDisponible = (nomEstacio) => {
    alert(`L'estació ${nomEstacio} no està disponible`)
    removeURLParam('e');
}

let estacioSelectedURLParam = getURLParamValue('e', undefined);
// removeURLParam('e');

const SessioHeader = ({ estacioSelected, setEstacioSelected }) => {
    const tipusEstacio = estacioSelected === undefined ? undefined : ['mixer', 'computer'].includes(estacioSelected) ? estacioSelected : getCurrentSession().getEstacio(estacioSelected).tipus;
    return(
        <div className="header flex justify-between items-center">
            <div className="titol ellipsis"><img src={logo_gruf} className="logo_gruf"/><span className="text-grey">#{ getCurrentSession().getID() }</span> { getCurrentSession().getNom() }</div>
            <div className="flex justify-between items-center">
                {estacioSelected != undefined && estacioSelected != "mixer" && estacioSelected != "computer" ? <EntradaMidiMinimal estacioSelected={estacioSelected}/>: ""}
                {estacioSelected === undefined || <GrufLogoEstacio tipusEstacio={tipusEstacio} setEstacioSelected={setEstacioSelected}/> }
                {estacioSelected === undefined || <GrufButtonBorder text="Canvia estació" onClick={() => {setEstacioSelected(undefined)}} />}
                <AudioTransportPlayStop/>
            </div>
        </div>
    )
}

const SessioFooter = () => {

    const masterMode = document.getElementsByTagName('session')[0].dataset.masterAudioEngine === 'true'

    return(
        <div className="footer flex justify-between items-center">
            <div className="flex justify-between items-center">
                {getCurrentSession().localMode ?<GuardarSessionWidget /> : ""}
                {getCurrentSession().localMode ? "": <SessionConnectedUsers />}{masterMode ? <div style={{marginLeft:5}}>{"(M)"}</div>:""}
            </div>
            <div><a className="btn-petit no-border" href={appPrefix + "/"}>Surt del GRUF</a></div>
        </div>
    )
}

const EstacioUI = ({ estacioSelected, setEstacioSelected }) => {
    return(
        <div className="estacions">
            {[...getCurrentSession().getNomsEstacions().filter((nomEstacio) => ((estacioSelected === nomEstacio)))].map((nomEstacio, i) => <Estacio key={nomEstacio} estacio={getCurrentSession().getEstacio(nomEstacio)} setEstacioSelected={setEstacioSelected}/>)}
            {estacioSelected == "mixer" ? <EstacioMixerUI setEstacioSelected={setEstacioSelected} showLevelMeters={true} />: ""}
            {estacioSelected == "computer" ? <EstacioComputerUI setEstacioSelected={setEstacioSelected}/>: ""}
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
                {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <div key={nomEstacio} className="grid-estacio-element" data-nom-estacio={nomEstacio} onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}><img data-nom-estacio={nomEstacio} src={appPrefix + "/static/src/img/" + getCurrentSession().getEstacio(nomEstacio).tipus + "_miniature.jpg"} title={nomEstacio}/><div data-nom-estacio={nomEstacio}>{nomEstacio}</div></div>)}
                <div className="grid-estacio-element" data-nom-estacio="mixer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>
                    <img data-nom-estacio="mixer" src={appPrefix + "/static/src/img/mixer_miniature.jpg"} title="Mixer" />
                    <div data-nom-estacio="mixer">Mixer</div>
                </div>
                <div className="grid-estacio-element" data-nom-estacio="computer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>
                    <img data-nom-estacio="computer" src={appPrefix + "/static/src/img/computer_miniature.jpg"} title="Computer" />
                    <div data-nom-estacio="computer">Computer</div>
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
    
    return (
        <div className="sessio-wrapper">
            <SessionWelcomeDialog sessionID={getCurrentSession().getID()} nomSessio={getCurrentSession().getNom()} />
            <div className="sessio">
                <SessioHeader estacioSelected={estacioSelected} setEstacioSelected={setEstacioSelected}/>
                {estacioSelected ? <EstacioUI estacioSelected={estacioSelected} setEstacioSelected={setEstacioSelected}/> : <SelectorEstacions setEstacioSelected={setEstacioSelected}/>}
                <SessioFooter />
            </div>
        </div>
    )
};