import { useState, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { AudioTransportControls, AudioTransportControlsMinimal } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { AudioMixerEstacions } from "../components/audioMixerEstacions";
import { Arranjament } from "../components/arranjament";
import { EntradaMidi } from "../components/entradaMidi";
import { AudioRecorder } from "../components/audioRecorder";

const Estacio = ({estacio}) => {
    return (
        <div key={estacio.nom} className="estacio">
            {createElement(estacio.getUserInterfaceComponent(), {estacio})}
        </div>
    )
};

export const Sessio = () => {
    const [estacioSelected, setEstacioSelected] = useState(undefined);  // Local state for component Sessio
    if (estacioSelected === undefined) {
        return (
            <div>
                <h1>GRUF "{ getCurrentSession().getNom() }" (ID: { getCurrentSession().getID() }{ getCurrentSession().localMode ? " - local": ""})</h1>
                <SessionConnectedUsers/>
                <AudioTransportControlsMinimal/>
                <br/>
                Tria estació:
                <ul>
                    {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <li key={nomEstacio}><a href="javascript:void(0);" data-nom-estacio={nomEstacio} onClick={(evt)=>{setEstacioSelected(evt.target.dataset.nomEstacio)}}>{nomEstacio}</a></li>)}
                    <li><a href="javascript:void(0);" data-nom-estacio="mixer" onClick={(evt)=>{setEstacioSelected(evt.target.dataset.nomEstacio)}}>Mixer</a></li>
                    <li><a href="javascript:void(0);" data-nom-estacio="computer" onClick={(evt)=>{setEstacioSelected(evt.target.dataset.nomEstacio)}}>Computer</a></li>
                </ul>
                <div>
                    <br/>
                    <a href={appPrefix + "/"}>Surt del GRUF</a>
                </div>
            </div>
        )
    } else {
        return(
            <div>
                <h1>GRUF "{ getCurrentSession().getNom() }" (ID: { getCurrentSession().getID() }{ getCurrentSession().localMode ? " - local": ""})</h1>                
                <SessionConnectedUsers/>
                <AudioTransportControlsMinimal/>
                <div>
                    <a href="javascript:void(0);" onClick={(evt) => {setEstacioSelected(undefined)}}>Canvia d'estació</a>
                </div>
                <br/>
                <div className="estacions">
                    {[...getCurrentSession().getNomsEstacions().filter((nomEstacio) => ((estacioSelected === nomEstacio)))].map((nomEstacio, i) => <Estacio key={nomEstacio} estacio={getCurrentSession().getEstacio(nomEstacio)}/>)}
                    {estacioSelected == "mixer" ? <div className="estacio"><AudioMixerEstacions/></div>: ""}
                    {estacioSelected == "computer" ? <div className="estacio"><Arranjament/></div>: ""}
                </div>
                {estacioSelected != "mixer" && estacioSelected != "computer" ? <EntradaMidi estacioSelected={estacioSelected}/>: ""}
                <div>
                    <br/>
                    <a href={appPrefix + "/"}>Surt del GRUF</a>
                </div>
            </div>
        )
    }
};