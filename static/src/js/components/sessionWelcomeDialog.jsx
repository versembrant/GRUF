import React, { useEffect } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { LabelUsuarisConnectats } from './sessionConnectedUsers';
import { buildAudioGraphIfNotBuilt } from "../utils";
import { getCurrentSession } from '../sessionManager';


export const SessionWelcomeDialog = ({sessionID, nomSessio}) => {

    useEffect(() => {
        if (!document.hasOwnProperty("welcomeDialogShown")){
            if (location.href.indexOf("audio=1") != -1) {
                // If url has audio=1, connect with audio without showing the modal
                document.welcomeDialogShown = true;
                connectaAmbAudio();
            } else if (location.href.indexOf("audio=0") != -1) {
                // If url has audio=1, connect with audio without showing the modal
                document.welcomeDialogShown = true;
                connectaSenseAudio();
            } else {
                showDialog();
            }
        }
     });

    const connectaAmbAudio = () => {
        buildAudioGraphIfNotBuilt();
    }

    const connectaSenseAudio = () => {
        getCurrentSession().setAudioOff()
    }

    const showDialog = () => {
        confirmDialog({group: 'headless'});
    };

    return (
        <ConfirmDialog
            group="headless"
            content={({ hide }) => (
                <div>
                    <div className="icona">
                        <img src={appPrefix + "/static/src/img/logo_gruf_g.svg"}></img>
                    </div>
                    <div className="info">
                        <div className="titol">
                            T'has afegit a la sessió <span className="text-grey">#{sessionID}</span> {nomSessio}
                        </div>
                        <div className="text-grey">
                            (<LabelUsuarisConnectats/>)
                        </div>
                    </div>
                    <div className="buttons">
                        <button className="btn-white" onClick={(evt) => {
                            hide(evt);
                            document.welcomeDialogShown = true;
                            connectaAmbAudio();
                        }}>Connecta amb àudio <img height="20px" src={appPrefix + "/static/src/img/loudspeaker_on.svg"}></img></button>
                        <button className="btn-white" onClick={(evt) => {
                            hide(evt);
                            document.welcomeDialogShown = true;
                            connectaSenseAudio();
                        }}>Connecta sense àudio <img height="20px" src={appPrefix + "/static/src/img/loudspeaker_off.svg"}></img></button>
                        
                    </div>
                </div>
            )}
        />
    )
}