import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { subscribeToStoreChanges } from "../utils";


export const Arranjament = () => {
    subscribeToStoreChanges(getAudioGraphInstance());
    subscribeToStoreChanges(getCurrentSession());

    handleAddClip = () => {
        const nomsEstacions = getCurrentSession().getNomsEstacions();
        getCurrentSession().arranjamentAfegirClip({
            estacio: nomsEstacions[0],
            preset: 0,
            beatInici: 0,
            duradaBeats: 32,
        });
        getCurrentSession().arranjamentAfegirClip({
            estacio: nomsEstacions[0],
            preset: 1,
            beatInici: 32,
            duradaBeats: 44,
        });
    }

    handleEditarClip = () => {
        getCurrentSession().getArranjament().clips.forEach(clip => {
            const newClipData = Object.assign({}, clip);
            newClipData.beatInici = clip.beatInici + 1;
            getCurrentSession().arranjamentEditarClip(clip.id, newClipData);
        
        })
    }

    handleClearClips = () => {
        getCurrentSession().getArranjament().clips.forEach(clip => {
            getCurrentSession().arranjamentEliminarClip(clip.id);
        
        }) 
    }

    return (
        <div className="arranjament">
            {JSON.stringify(getCurrentSession().getArranjament())}
            <button onClick={handleAddClip}>Afegir clip</button>
            <button onClick={handleEditarClip}>Editar clip</button>
            <button onClick={handleClearClips}>Eliminar cips</button>
        </div>
    )
};