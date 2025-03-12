import { subscribeToParameterChanges } from "../utils"; // subscriptions
import { getAudioGraphInstance } from "../audioEngine";
import { getCurrentSession } from "../sessionManager";

const bufferLen = 4096;
const sampleRate = 44100;
let recording = false;
let recBufferL = [];
let recBufferR = [];
let recLength = 0;
let recNode;
let nRecordings = 0;

export function initSessionAudioRecorder() {
    if (!window.audioContext.createScriptProcessor) {
        recNode = window.audioContext.createJavaScriptNode(bufferLen, 2, 2);
    } else {
        recNode = window.audioContext.createScriptProcessor(bufferLen, 2, 2);
    }

    recNode.onaudioprocess = (e) => {
        if (!recording) return;
        const channelDataL = e.inputBuffer.getChannelData(0);
        const channelDataR = e.inputBuffer.getChannelData(1);
        for (let i = 0; i < channelDataL.length; i += 1) {
          recBufferL.push(channelDataL[i]);
          recBufferR.push(channelDataR[i]);
        }
        recLength += channelDataL.length;
    };
    window.audioContext.gainNode.connect(recNode);
    recNode.connect(audioContext.destination);
}


export function mergeBuffers(recBuffers, recLength) {
    const result = new Float32Array(recLength);
    let offset = 0;
    for (let i = 0; i < recBuffers.length; i += 1) {
      result.set(recBuffers[i], offset);
      offset += recBuffers[i].length;
    }
    return result;
  }
  
  export function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
  
    let index = 0;
    let inputIndex = 0;
  
    while (index < length) {
      result[index += 1] = inputL[inputIndex];
      result[index += 1] = inputR[inputIndex];
      inputIndex += 1;
    }
    return result;
  }
  
  function floatTo16BitPCM(output, offset, input) {
    let offsetLocal = offset;
    for (let i = 0; i < input.length; i += 1) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offsetLocal, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offsetLocal += 2;
    }
  }
  
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  export function encodeWAV(samples, mono) {
    const buffer = new ArrayBuffer(44 + (samples.length * 2));
    const view = new DataView(buffer);
  
    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 32 + (samples.length * 2), true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, mono ? 1 : 2, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);
  
    floatTo16BitPCM(view, 44, samples);
  
    return view;
  }

function slugify(str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
    str = str.toLowerCase(); // convert string to lowercase
    str = str.replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
            .replace(/\s+/g, '-') // replace spaces with hyphens
            .replace(/-+/g, '-'); // remove consecutive hyphens
    return str;
}


export const SessionAudioRecorder = ({}) => {

    subscribeToParameterChanges(getAudioGraphInstance(), 'isRecordArmed');
    subscribeToParameterChanges(getAudioGraphInstance(), 'isRecordigSession');

    const handleStartRecording = () => {
        getAudioGraphInstance().startRecordingSession();
    }

    const handleStoptRecording = async () => {
        const date = new Date();
        const downloadFilename = `GRUF_${getCurrentSession().getID()}_${slugify(getCurrentSession().getNom())}_${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.webm`;
        await getAudioGraphInstance().stopRecordingSession(downloadFilename);

        /*
        // Process audio and download
        const bufferL = Float32Array.from(recBufferL);
        const bufferR = Float32Array.from(recBufferR);
        const interleaved = interleave(bufferL, bufferR);
        const dataview = encodeWAV(interleaved);
        const audioBlob = new Blob([dataview], { type: 'audio/wav' });
        const url = (window.URL || window.webkitURL).createObjectURL(audioBlob);
        const link = window.document.createElement('a');
        link.href = url;
        const date = new Date();
        const downloadFilename = `freesound_explorer_${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.wav`;
        link.download = downloadFilename;
        console.log(`Downloading '${downloadFilename}' (${Math.round((10 * recLength) / sampleRate) / 10} seconds long)...`)
        link.click();

        // Clear buffers etc
        recLength = 0;
        recBufferL = [];
        recBufferR = [];*/

    }

    const isRecording = getAudioGraphInstance().isRecording();
    const isRecordArmed = getAudioGraphInstance().isRecordArmed();

    let button;
    if (isRecording) {
      button = <button className="btn-white session-recording" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStoptRecording}>Atura la gravació</button>
    } else {
      if (isRecordArmed) {
        button = <button className="btn-white session-armed-recording" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStartRecording}>Esperant que començi l'àudio...</button>
      } else {
        button = <button className="btn-white" disabled={!getAudioGraphInstance().usesAudioEngine()} onClick={handleStartRecording}>Grava l'àudio</button>
      }
    }
    return <div>{button}</div>
}