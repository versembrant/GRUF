import React, { useEffect } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { LabelUsuarisConnectats } from './sessionConnectedUsers';
import { buildAudioGraphIfNotBuilt } from "../utils";
import { getCurrentSession } from '../sessionManager';


export const EditaSessioDialog = () => {

    const handleCancel = () => {
    }

    const handleOk = () => {
        const nom = document.getElementById("editaSessioNom").value;
        getCurrentSession().updateParametreSessio("name", nom);
    }

    const showDialog = () => {
        confirmDialog({group: 'editSessio'});
    };

    return (<div>
        <button className="btn-petit btn-rosa btn-lletra-80" style={{marginLeft:8}} onClick={showDialog}>
          Edita
        </button>
        <ConfirmDialog
            group="editSessio"
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
                                Títol: <input id="editaSessioNom" name="name" defaultValue={getCurrentSession().getNom()} autoComplete="false" />
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
                        }}>Guarda canvis</button>
                        
                    </div>
                </div>
            )}
        />
    </div>)
}