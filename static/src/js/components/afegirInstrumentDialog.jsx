import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { getCurrentSession, estacionsDisponibles, getNomEstacioFromTipus } from '../sessionManager';


export const AfegirInstrumentDialog = ({callback}) => {

    const handleCancel = () => {
    }

    const handleOk = () => {
        const tipusEscollit = document.getElementById("addInstrumentTipus").value;
        if (Object.keys(estacionsDisponibles).includes(tipusEscollit)) {
            callback(tipusEscollit);
        }
    }

    const showDialog = () => {
        confirmDialog({group: 'addInstrument'});
    };

    return (<div>
        <div className="grid-estacio-element grid-estacio-element-add" onClick={showDialog}>+ Afegir instrument</div>
        <ConfirmDialog
            group="addInstrument"
            content={({ hide }) => (
                <div>
                    <div className="icona">
                        <img src={appPrefix + "/static/src/img/logo_gruf_g.svg"}></img>
                    </div>
                    <div className="info">
                        <div className="titol">
                            Edita la sessió <span className="text-grey">#{getCurrentSession().getID()}</span>
                        </div>
                        <div className="edita-sessio-dialog">
                            <div className="input-title">
                                Afegeix un instrument: <select id="addInstrumentTipus" name="tipus" >
                                    {Object.keys(estacionsDisponibles).map((tipusEstacio, i) => {
                                        return <option key={tipusEstacio} value={tipusEstacio}>{getNomEstacioFromTipus(tipusEstacio, -1)}</option>
                                    })}
                                </select>
                            </div>   
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
                        }}>Afegeix instrument</button>
                        
                    </div>
                </div>
            )}
        />
    </div>)
}