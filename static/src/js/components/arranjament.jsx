import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";


export const Arranjament = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    handleAddClips = () => {
        const nomsEstacions = getCurrentSession().getNomsEstacions();
        const clipsToAdd = []
        clipsToAdd.push({
            estacio: nomsEstacions[0],
            preset: 0,
            beatInici: 0,
            duradaBeats: 32,
        });
        clipsToAdd.push({
            estacio: nomsEstacions[0],
            preset: 1,
            beatInici: 32,
            duradaBeats: 44,
        });
        clipsToAdd.push({
            estacio: nomsEstacions[1],
            preset: 0,
            beatInici: 0,
            duradaBeats: 32,
        });
    
        clipsToAdd.push({
            estacio: nomsEstacions[1],
            preset: 1,
            beatInici: 32,
            duradaBeats: 44,
        });
        getCurrentSession().arranjamentAfegirClips(clipsToAdd);
    }

    handleEditarClips = () => {
        const modifiedClips = [];
        getCurrentSession().getArranjamentClips().forEach(clip => {
            const newClipData = Object.assign({}, clip);
            newClipData.beatInici = clip.beatInici + 1;
            modifiedClips.push(newClipData)
        })
        getCurrentSession().arranjamentAfegirClips(modifiedClips);
    }

    handleClearClips = () => {
        const clipIDs = getCurrentSession().getArranjamentClips().map(clip => clip.id);
        getCurrentSession().arranjamentEliminarClips(clipIDs);
    }

    return (
        <div className="arranjament">
            {JSON.stringify(getCurrentSession().getArranjamentClips())}
            <button onClick={handleAddClips}>Afegir clips</button>
            <button onClick={handleEditarClips}>Editar clips</button>
            <button onClick={handleClearClips}>Eliminar cips</button>
        </div>
    )
};