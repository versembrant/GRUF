import { useState } from "react";
import { getCurrentSession } from "../sessionManager";
import { AudioTransportControls } from "../components/audioTransport";
import { SessionConnectedUsers } from "../components/sessionConnectedUsers";
import { AudioMixerEstacions } from "../components/audioMixerEstacions";
import { Sessio } from "../components/sessio";
import { Estacio } from './estacio';

export const Sessio = () => {
    const [estacioSelected, setEstacioSelected] = useState("all");  // Local state for component Sessio
    return(
        <div>
            <SessionConnectedUsers/>
            <AudioTransportControls/>
            <AudioMixerEstacions/>
            <div>
                Estació:
                <select
                    value={estacioSelected}
                    onChange={(evt) => setEstacioSelected(evt.target.value)}>
                    <option value="all">Totes</option>
                    {getCurrentSession().getNomsEstacions().map((nomEstacio, i) => <option value={nomEstacio} key={i}>{nomEstacio}</option>)}
                </select>
                <div className="estacions">
                    {[...getCurrentSession().getNomsEstacions().filter((nomEstacio) => ((estacioSelected === "all") || (estacioSelected === nomEstacio)))].map((nomEstacio, i) => <Estacio key={nomEstacio + '_' + i} nomEstacio={nomEstacio}/>)}
                </div>
            </div>
        </div>
    )
};