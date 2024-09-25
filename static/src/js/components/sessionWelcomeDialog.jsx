import React, { useEffect } from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { LabelUsuarisConnectats } from './sessionConnectedUsers';


export const SessionWelcomeDialog = ({sessionID, nomSessio}) => {

    useEffect(() => {
        // call api or anything
        if (!document.hasOwnProperty("welcomeDialogShown")){
            showDialog();
        }
        
     });

    const connectaAmbAudio = () => {
        console.log("Connecta amb audio")
    }

    const connectaSenseAudio = () => {
        console.log("Connecta sense audio")
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
                        <button className="btn" onClick={(evt) => {
                            hide(evt);
                            document.welcomeDialogShown = true;
                            connectaAmbAudio();
                        }}>Connecta amb àudio <img height="20px" src={appPrefix + "/static/src/img/loudspeaker_on.svg"}></img></button>
                        <button className="btn" onClick={(evt) => {
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