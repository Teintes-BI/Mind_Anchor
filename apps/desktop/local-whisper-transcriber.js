const DEFAULT_MODEL = "onnx-community/whisper-small";
const TARGET_SAMPLE_RATE = 16_000;

const decodeBase64 = (value) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, "");
  if (!normalized || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new Error("Local Whisper received invalid base64 audio.");
  }
  const bytes = Buffer.from(normalized, "base64");
  if (bytes.length === 0) throw new Error("Local Whisper received empty audio.");
  return bytes;
};

const decodePcm16Le = (bytes) => {
  if (bytes.length % 2 !== 0) throw new Error("PCM16LE audio must contain an even number of bytes.");
  const samples = new Float32Array(bytes.length / 2);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = bytes.readInt16LE(index * 2) / 32768;
  }
  return samples;
};

const findWavChunk = (bytes, name) => {
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkName = bytes.subarray(offset, offset + 4).toString("ascii");
    const chunkLength = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (dataOffset + chunkLength > bytes.length) break;
    if (chunkName === name) return { dataOffset, chunkLength };
    offset = dataOffset + chunkLength + (chunkLength % 2);
  }
  return null;
};

const resampleLinear = (samples, sourceRate) => {
  if (sourceRate === TARGET_SAMPLE_RATE) return samples;
  const targetLength = Math.max(1, Math.round((samples.length * TARGET_SAMPLE_RATE) / sourceRate));
  const result = new Float32Array(targetLength);
  const ratio = sourceRate / TARGET_SAMPLE_RATE;
  for (let index = 0; index < targetLength; index += 1) {
    const sourceIndex = index * ratio;
    const lower = Math.min(samples.length - 1, Math.floor(sourceIndex));
    const upper = Math.min(samples.length - 1, lower + 1);
    const weight = sourceIndex - lower;
    result[index] = samples[lower] * (1 - weight) + samples[upper] * weight;
  }
  return result;
};

const decodeWav = (bytes) => {
  if (bytes.length < 44 || bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WAVE") {
    throw new Error("Local Whisper received an invalid WAV file.");
  }
  const format = findWavChunk(bytes, "fmt ");
  const data = findWavChunk(bytes, "data");
  if (!format || format.chunkLength < 16 || !data) throw new Error("WAV file is missing PCM format or data chunks.");
  const audioFormat = bytes.readUInt16LE(format.dataOffset);
  const channels = bytes.readUInt16LE(format.dataOffset + 2);
  const sampleRate = bytes.readUInt32LE(format.dataOffset + 4);
  const bitsPerSample = bytes.readUInt16LE(format.dataOffset + 14);
  if (audioFormat !== 1 || channels !== 1 || bitsPerSample !== 16 || sampleRate <= 0) {
    throw new Error("Local Whisper supports mono PCM16 WAV audio only.");
  }
  return resampleLinear(
    decodePcm16Le(bytes.subarray(data.dataOffset, data.dataOffset + data.chunkLength)),
    sampleRate,
  );
};

export const decodePcm16LeBase64 = (base64Audio) => decodePcm16Le(decodeBase64(base64Audio));

const defaultPipelineFactory = async (...args) => {
  const { pipeline } = await import("@huggingface/transformers");
  return pipeline(...args);
};

export class LocalWhisperTranscriber {
  constructor({
    enabled = process.env.MINDANCHOR_LOCAL_WHISPER_ENABLED !== "0",
    modelName = process.env.MINDANCHOR_LOCAL_WHISPER_MODEL ?? DEFAULT_MODEL,
    pipelineFactory = defaultPipelineFactory,
  } = {}) {
    this.enabled = enabled;
    this.modelName = modelName;
    this.pipelineFactory = pipelineFactory;
    this.pipelinePromise = null;
  }

  async getPipeline() {
    if (!this.pipelinePromise) {
      this.pipelinePromise = Promise.resolve(
        this.pipelineFactory("automatic-speech-recognition", this.modelName),
      ).catch((error) => {
        this.pipelinePromise = null;
        throw error;
      });
    }
    return this.pipelinePromise;
  }

  async transcribe({ base64Audio, encoding = "audio/pcm16le" }) {
    if (!this.enabled) return null;
    const bytes = decodeBase64(base64Audio);
    const samples = encoding === "audio/wav" ? decodeWav(bytes) : decodePcm16Le(bytes);
    const recognizer = await this.getPipeline();
    const result = await recognizer(samples, { return_timestamps: false });
    const text = typeof result?.text === "string" ? result.text.trim() : "";
    if (!text) return null;
    return { text, modelName: this.modelName, source: "local_whisper" };
  }
}
