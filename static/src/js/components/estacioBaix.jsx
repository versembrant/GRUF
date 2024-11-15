import { EstacioSynthBaseUI } from "./estacioSynth";

export const EstacioBaixUI = ({estacio, setEstacioSelected}) => {
    return (
        <EstacioSynthBaseUI estacio={estacio} setEstacioSelected={setEstacioSelected} colorNotesPiano="#d98adc" />
    )
};