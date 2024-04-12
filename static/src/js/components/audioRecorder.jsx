import * as Tone from 'tone';
import { useState } from 'react';
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { clamp } from '../utils';
import { subscribeToStoreChanges } from "../utils";

const recorder = new Tone.Recorder();
const meter = new Tone.Meter();
const mic = new Tone.UserMedia();
mic.connect(recorder);
mic.connect(meter);
let meterInterval = null;
let startedRecordingTime = undefined;
let recording = undefined;

export const AudioRecorder = () => {

    subscribeToStoreChanges(getCurrentSession());
    
    const handleRecButton = async () => {  
        await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
        let micOpened = false;
        mic.open().then(() => {
            // promise resolves when input is available
            micOpened = true;
            // print the incoming mic levels in decibels
            meterInterval = setInterval(() => {
                const valueForMeter = clamp(meter.getValue(), -100, 0);
                document.getElementById("inputMeterInner").style.width = `${valueForMeter + 100}%`;
            }, 100);

            // Start recording
            startedRecordingTime = Tone.now();
            recorder.start();

            setRecButtonDisabled(true);
            setStopButtonDisabled(false);
            
        }).catch(e => {
            // promise is rejected when the user doesn't have or allow mic access
            micOpened = false;
        });
    }

    const handleStopButton = async () => {
        setRecButtonDisabled(false);
        setStopButtonDisabled(true);
        window.clearInterval(meterInterval);
        document.getElementById("inputMeterInner").style.width = `${0}%`;
        recording = await recorder.stop();
        const duration = Tone.now() - startedRecordingTime;
        if (duration > 0.0) {
            document.getElementById("recordingLength").innerText = `Recording length: ${duration.toFixed(2)} seconds`;
            setSendButtonDisabled(false);
        }
    }

    const handleSendToServerButton = () => {
        const uploadFileUrl = appPrefix + '/upload_file/' + getCurrentSession().getID() + '/';
        const extension = recorder.mimeType.split('/')[1].split(';')[0];
        const filename = 'file_' + new Date().toISOString().replaceAll(':', '-') + '.' + extension;
        var fd = new FormData();
        fd.append('file', recording, filename);
        fetch(uploadFileUrl, { 
            method: "POST", 
            body: fd,
        }) 
        .then(response => {
            response.json().then(data => {
                if (!data.error){
                    document.getElementById("serverFileURL").innerHTML = 'Sent to server!: <a href="' + data.url + '" target="_blank">' + data.url + '</a>';
                    setTimeout(() => {
                        document.getElementById("serverFileURL").innerHTML = "";
                        document.getElementById("recordingLength").innerText = "";
                        setSendButtonDisabled(true);
                    }, 5000);

                    if (getCurrentSession().localMode) {
                        // In local mode, simulate receiving a parameter update with the updated list of avialable files
                        getCurrentSession().receiveUpdateParametreSessioFromServer('recorded_files', data.recorded_files)
                    }

                } else {
                    document.getElementById("serverFileURL").innerHTML = 'Error uploading file: ' + data.message;
                    setTimeout(() => {
                        document.getElementById("serverFileURL").innerHTML = "";
                        document.getElementById("recordingLength").innerText = "";
                        setSendButtonDisabled(true);
                    }, 5000);
                }    
            });        
        }) 
        .catch(err => {
            document.getElementById("serverFileURL").innerHTML = 'Error uploading file';
            setTimeout(() => {
                document.getElementById("serverFileURL").innerHTML = "";
                document.getElementById("recordingLength").innerText = "";
                setSendButtonDisabled(true);
            }, 5000);
        });  
    }

    const handleRemoveFileButton = (evt) => {
        filename = evt.target.dataset.filename;
        const deleteFileUrl = appPrefix + '/delete_file/' + getCurrentSession().getID() + '/';
        var fd = new FormData();
        fd.append('filename', filename);
        fetch(deleteFileUrl, { 
            method: "POST", 
            body: fd,
        })
        .then(response => {
            response.json().then(data => {
                if (!data.error){
                    // In local mode, simulate receiving a parameter update with the updated list of avialable files
                    getCurrentSession().receiveUpdateParametreSessioFromServer('recorded_files', data.recorded_files)
                }
            });
        })
    }

    const [isRecButtonDisabled, setRecButtonDisabled] = useState(false);
    const [isStopButtonDisabled, setStopButtonDisabled] = useState(true);
    const [isSendButtonDisabled, setSendButtonDisabled] = useState(true);

    return (
        <div>
            <h2>MIC Recorder</h2>
            <div>
                <button id="startRecording" onClick={handleRecButton} disabled={isRecButtonDisabled}>Record</button>
                <button id="stopRecording" onClick={handleStopButton} disabled={isStopButtonDisabled}>Stop recording</button>
            </div>
            <div style={{width:'100%', height: '20px', backgroundColor:'black'}}>
                <div id="inputMeterInner" style={{width:'0%', height: '100%', backgroundColor:'green'}}></div>
            </div>
            <div>
                <span id="recordingLength"></span>
                <button id="sendToServerButton" disabled={isSendButtonDisabled} onClick={handleSendToServerButton}>Send to server</button>
                <span id="serverFileURL"></span>
            </div>
            <div>{ getCurrentSession().getRecordedFiles().length } recorded files
            <ul>
                { getCurrentSession().getRecordedFiles().map((file, index) => {
                    return <li key={index}><a href={"/bruixit/static/uploads/" + getCurrentSession().getID() + "/" + file} target="_blank">{ window.location.href.split("/bruixit/")[0] + "/bruixit/static/uploads/" + getCurrentSession().getID() + "/" + file}</a> <button data-filename={file} onClick={handleRemoveFileButton}>Delete</button></li>
                })}
            </ul>
            </div>
            
        </div>
    )
};