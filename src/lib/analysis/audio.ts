import { AudioSampleSink, type InputAudioTrack } from "mediabunny";
export const AUDIO_RATE = 16_000;
/** Bounded PCM window. Timestamp-based box resampling also downmixes channels.
 * No whole-file ArrayBuffer or whole-recording AudioBuffer is allocated. */
export async function readAudioWindow(
  track: InputAudioTrack,
  start: number,
  end: number,
) {
  const output = new Float32Array(Math.ceil((end - start) * AUDIO_RATE));
  const weights = new Float32Array(output.length);
  for await (const sample of new AudioSampleSink(track).samples(start, end)) {
    try {
      const mono = new Float32Array(sample.numberOfFrames);
      const plane = new Float32Array(sample.numberOfFrames);
      for (let channel = 0; channel < sample.numberOfChannels; channel++) {
        sample.copyTo(plane, { planeIndex: channel, format: "f32-planar" });
        for (let i = 0; i < mono.length; i++)
          mono[i] += plane[i] / sample.numberOfChannels;
      }
      const ratio = AUDIO_RATE / sample.sampleRate;
      const base = (sample.timestamp - start) * AUDIO_RATE;
      for (let i = 0; i < mono.length; i++) {
        const left = base + i * ratio,
          right = left + ratio;
        for (
          let j = Math.max(0, Math.floor(left));
          j < Math.min(output.length, Math.ceil(right));
          j++
        ) {
          const weight = Math.min(right, j + 1) - Math.max(left, j);
          output[j] += mono[i] * weight;
          weights[j] += weight;
        }
      }
    } finally {
      sample.close();
    }
  }
  for (let i = 0; i < output.length; i++)
    if (weights[i]) output[i] /= weights[i];
  return output;
}
export function rms(audio: Float32Array) {
  return Math.sqrt(
    audio.reduce((sum, x) => sum + x * x, 0) / Math.max(1, audio.length),
  );
}
