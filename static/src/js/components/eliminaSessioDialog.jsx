import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { getCurrentSession } from '../sessionManager';


export const EliminaSessioDialog = () => {

    const handleCancel = () => {
    }

    const handleOk = () => {
        window.location.href = appPrefix + "/delete_session/" + getCurrentSession().getID();
    }

    const showDialog = () => {
        confirmDialog({group: 'eliminaSessio'});
    };

    return (<div>
        <button className="btn-petit btn-vermell btn-lletra-80" style={{marginLeft:8}} onClick={showDialog}>
          Elimina
        </button>
        <ConfirmDialog
            group="eliminaSessio"
            content={({ hide }) => (
                <div>
                    <div className="icona">
                        <img src={appPrefix + "/static/src/img/logo_gruf_g.svg"}></img>
                    </div>
                    <div className="info">
                        <div className="titol">
                            Elimina la sessió <span className="text-grey">#{getCurrentSession().getID()}</span>
                        </div>
                        <div className="edita-sessio-dialog">
                            Segur que la vols eliminar?
                        </div>
                    </div>
                    <div className="buttons">
                        <button className="btn-white" onClick={(evt) => {
                            hide(evt);
                            handleCancel();
                        }}>Cancel·la</button>
                        <button className="btn-white" onClick={(evt) => {
                            hide(evt);
                            handleOk();
                        }}>Sí, elimina la sessió!</button>
                    </div>
                </div>
            )}
        />
    </div>)
}