const sampleRate = 44100;

function interleave(inputL, inputR) {
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

function encodeWAV(samples, mono) {
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


class AudioRecorder extends AudioWorkletProcessor {
    constructor() {
        super();
        this.recBufferL = [];
        this.recBufferR = [];
        this.recording = false;
        this.port.onmessage = this.handleMessage_.bind(this);
    }
    
    handleMessage_(evt) {
        if (evt.data.eventType === "startRecording") {
            this.recording = true;
        } else if (evt.data.eventType === "stopRecording") {
            this.recording = false;
            this.port.postMessage({
                eventType: 'data',
                recordingLength: (this.recBufferL.length / sampleRate),
                dataView: this.getAudioDataView(),
            });
            this.recBufferL = [];
            this.recBufferR = [];
        }
    }
    
    process(inputs, outputs, parameters) {
        if (!this.recording) {
            return true;
        }
        if (!inputs[0].length) {
            return true
        }
        const channelDataL = inputs[0][0];
        const channelDataR = inputs[0][1];
        for (let i = 0; i < channelDataL.length; i++) {
            this.recBufferL.push(channelDataL[i]);
            this.recBufferR.push(channelDataR[i]);
        }
        return true;
    }

    getAudioDataView() {
        const bufferL = Float32Array.from(this.recBufferL);
        const bufferR = Float32Array.from(this.recBufferR);
        const interleaved = interleave(bufferL, bufferR);
        const dataview = encodeWAV(interleaved);       
        return dataview;
    }
    
}

registerProcessor("recorder-worklet", AudioRecorder);