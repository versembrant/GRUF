import * as Tone from 'tone';
import { useState } from 'react';
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";
import { clamp } from '../utils';
import { subscribeToStoreChanges } from "../utils";
import mic_icon from "../../img/microphone.svg";
import stop_icon from "../../img/stop_button.svg";

const recorder = new Tone.Recorder();
const meter = new Tone.Meter();
const mic = new Tone.UserMedia();
mic.connect(recorder);
mic.connect(meter);
let meterInterval = null;
let startedRecordingTime = undefined;
let recording = undefined;

export const AudioRecorder = ({setInputMeterPercent, onRecordUploadedCallback}) => {

    subscribeToStoreChanges(getCurrentSession());
    
    const handleRecButton = async () => {  
        await getAudioGraphInstance().startAudioContext();  // Initialize web audio context if not initialized yet
        let micOpened = false;
        mic.open().then(() => {
            // promise resolves when input is available
            micOpened = true;
            // print the incoming mic levels in decibels
            meterInterval = setInterval(() => {
                const minDB = -60;
                const maxDB = 0;
                const meterValue = clamp(meter.getValue(), minDB, maxDB);
                const meterPercent = (meterValue - minDB) / (maxDB - minDB) * 100;
                setInputMeterPercent(meterPercent);
            }, 10);

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
                    if (onRecordUploadedCallback) {
                        onRecordUploadedCallback(data);
                    }

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

    const handleStopAndUploadButton = async () => {
        await handleStopButton();
        handleSendToServerButton();
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

    const handleRecToggle = () => {
        if (!isRecButtonDisabled) handleRecButton();
        else handleStopAndUploadButton();
    }

    const [isRecButtonDisabled, setRecButtonDisabled] = useState(false);
    const [isStopButtonDisabled, setStopButtonDisabled] = useState(true);
    const [isSendButtonDisabled, setSendButtonDisabled] = useState(true);

    return (<div className="sampler-record-widget">
        <button className={`sampler-record-btn ${isRecButtonDisabled ? "recording" : ""}`} id="toggleRecording" onClick={handleRecToggle}>
            <img src={(!isRecButtonDisabled) ? mic_icon : stop_icon}/>
        </button>
        <div style={{display:"none"}}>
            <span id="recordingLength"></span>
            <span id="serverFileURL"></span>
        </div>
    </div>)
};