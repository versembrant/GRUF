import { useState, createElement } from "react";
import { getCurrentSession } from "../sessionManager";
import { AudioTransportControls } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { AudioMixerEstacions } from "../components/audioMixerEstacions";
import { Arranjament } from "../components/arranjament";
import { EntradaMidi } from "../components/entradaMidi";

const Estacio = ({estacio}) => {
    return (
        <div key={estacio.nom} className="estacio">
            {createElement(estacio.getUserInterfaceComponent(), {estacio})}
        </div>
    )
};

export const Sessio = () => {
    const [estacioSelected, setEstacioSelected] = useState("all");  // Local state for component Sessio
    return(
        <div>
            <h1>Sessió "{ getCurrentSession().getNom() }" (ID: { getCurrentSession().getID() }{ getCurrentSession().localMode ? " - local": ""})</h1>
            <a href={appPrefix + "/"}>Torna a la llista de sessions</a>
            <SessionConnectedUsers/>
            <AudioTransportControls/>
            <AudioMixerEstacions/>
            <div>
                Estació:
                <select
                    value={estacioSelected}
                    onChange={(evt) => setEstacioSelected(evt.target.value)}>
                    <option key={"all"} value="all">Totes</option>
                    {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <option key={nomEstacio} value={nomEstacio}>{nomEstacio}</option>)}
                </select>
                <div className="estacions">
                    {[...getCurrentSession().getNomsEstacions().filter((nomEstacio) => ((estacioSelected === "all") || (estacioSelected === nomEstacio)))].map((nomEstacio, i) => <Estacio key={nomEstacio} estacio={getCurrentSession().getEstacio(nomEstacio)}/>)}
                </div>
            </div>
            <Arranjament/>
            <EntradaMidi/>
        </div>
    )
};