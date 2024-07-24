import { useState, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { AudioTransportPlayStop } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { AudioMixerEstacions } from "../components/audioMixerEstacions";
import { Arranjament } from "../components/arranjament";
import { EntradaMidi, EntradaMidiMinimal } from "../components/entradaMidi";
import { AudioRecorder } from "../components/audioRecorder";
import { getURLParamValue, removeURLParam } from "../utils";

const Estacio = ({estacio, setEstacioSelected}) => {
    return (
        <div key={estacio.nom}>
            {createElement(estacio.getUserInterfaceComponent(), {estacio, setEstacioSelected})}
        </div>
    )
};


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


export const Sessio = () => {
    if (!estacioEstaDisponible(estacioSelectedURLParam)) { 
        onEstacioNoDisponible(estacioSelectedURLParam)
        estacioSelectedURLParam = undefined
    };
    const [estacioSelected, setEstacioSelected] = useState(estacioSelectedURLParam);  // Local state for component Sessio

    const assignaEstacio = (nomEstacio) => {
        // Si l'estació no està disponible, mostrar un missatge d'error
        if (!estacioEstaDisponible(nomEstacio)) {
            onEstacioNoDisponible(nomEstacio)
            setEstacioSelected(undefined);
        } else {
            setEstacioSelected(nomEstacio);
        }
    }
    
    if (estacioSelected === undefined) {
        return (
            <div className="sessio">
                <h2>GRUF "{ getCurrentSession().getNom() }" (ID: { getCurrentSession().getID() }{ getCurrentSession().localMode ? " - local": ""})</h2>
                <SessionConnectedUsers/>
                <AudioTransportPlayStop/>
                <br/>
                Tria estació:
                <ul>
                    {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <li key={nomEstacio}><a data-nom-estacio={nomEstacio} onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>{nomEstacio}</a></li>)}
                    <li><a data-nom-estacio="mixer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>Mixer</a></li>
                    <li><a data-nom-estacio="computer" onClick={(evt)=>{assignaEstacio(evt.target.dataset.nomEstacio)}}>Computer</a></li>
                </ul>
                <div>
                    <br/>
                    <a className="btn" href={appPrefix + "/"}>Surt del GRUF</a>
                </div>
            </div>
        )
    } else {
        return(
            <div className="sessio">
                <div className="header between">
                    <div className="titol">GRUF "{ getCurrentSession().getNom() }" (ID: { getCurrentSession().getID() }{ getCurrentSession().localMode ? " - local": ""})</div>
                    <div className="between">
                        {estacioSelected != "mixer" && estacioSelected != "computer" ? <EntradaMidiMinimal estacioSelected={estacioSelected}/>: ""}
                        <AudioTransportPlayStop/>
                    </div>
                </div>
                <div className="estacions">
                    {[...getCurrentSession().getNomsEstacions().filter((nomEstacio) => ((estacioSelected === nomEstacio)))].map((nomEstacio, i) => <Estacio key={nomEstacio} estacio={getCurrentSession().getEstacio(nomEstacio)} setEstacioSelected={setEstacioSelected}/>)}
                    {estacioSelected == "mixer" ? <AudioMixerEstacions setEstacioSelected={setEstacioSelected} />: ""}
                    {estacioSelected == "computer" ? <Arranjament setEstacioSelected={setEstacioSelected}/>: ""}
                </div>
                
                <div className="footer between">
                    <div><SessionConnectedUsers/></div>
                    <div><a className="btn btn-petit" href={appPrefix + "/"}>Surt del GRUF</a></div>
                </div>
            </div>
        )
    }
};