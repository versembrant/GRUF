import { EstacioSynthBaseUI } from "./estacioSynth";

export const EstacioBaixUI = ({estacio, setEstacioSelected}) => {
    return (
        <div key={estacio.nom} className="estacio estacio-synth_bass">
            <EstacioSynthBaseUI estacio={estacio} setEstacioSelected={setEstacioSelected} colorNotesPiano="#d98adc" />
        </div>
    )
};