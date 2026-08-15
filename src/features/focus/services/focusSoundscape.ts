export type FocusSoundscape = "silent" | "rain" | "warm-noise";

let context: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;

function createContext() {
  if (context) return context;
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
}

export function stopFocusSoundscape() {
  try {
    source?.stop();
  } catch {
    // Optional ambience may already be stopped.
  }
  source?.disconnect();
  gain?.disconnect();
  source = null;
  gain = null;
}

export function playFocusSoundscape(soundscape: FocusSoundscape, volume = 0.35) {
  stopFocusSoundscape();
  if (soundscape === "silent") return;
  try {
    const audio = createContext();
    if (!audio) return;
    const length = audio.sampleRate * 3;
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = soundscape === "warm-noise"
        ? (previous + 0.018 * white) / 1.018
        : white * 0.72 + previous * 0.28;
      data[index] = previous;
    }
    source = audio.createBufferSource();
    gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = soundscape === "rain" ? "highpass" : "lowpass";
    filter.frequency.value = soundscape === "rain" ? 900 : 520;
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    gain.gain.value = (soundscape === "rain" ? 0.035 : 0.045) * (normalizedVolume / 0.35);
    source.buffer = buffer;
    source.loop = true;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    void audio.resume().then(() => source?.start()).catch(() => undefined);
  } catch {
    stopFocusSoundscape();
  }
}
