export type FeedbackCue =
  | "task-added"
  | "task-completed"
  | "task-reopened"
  | "task-updated"
  | "task-dismissed"
  | "task-restored"
  | "chinese-logged"
  | "workout-started"
  | "set-completed"
  | "workout-completed"
  | "personal-record"
  | "volleyball-logged"
  | "meal-planned"
  | "meal-cooked"
  | "grocery-checked"
  | "navigation";

type Tone = {
  frequency: number;
  endFrequency?: number;
  delay?: number;
  duration: number;
  volume: number;
  type: OscillatorType;
};

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (audioContext) return audioContext;
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) return null;

  audioContext = new AudioContextClass();

  return audioContext;
}

function playTone(context: AudioContext, tone: Tone) {
  const start = context.currentTime + (tone.delay ?? 0);
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = tone.type;
  oscillator.frequency.setValueAtTime(tone.frequency, start);

  if (tone.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      tone.endFrequency,
      start + tone.duration
    );
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(
    tone.volume,
    start + 0.012
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + tone.duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + tone.duration + 0.02);
}

function getCueTones(cue: FeedbackCue): Tone[] {
  if (cue === "navigation") {
    return [
      {
        frequency: 305,
        endFrequency: 352,
        duration: 0.075,
        volume: 0.008,
        type: "sine",
      },
    ];
  }

  if (cue === "chinese-logged") {
    return [
      {
        frequency: 523.25,
        endFrequency: 587.33,
        duration: 0.12,
        volume: 0.014,
        type: "sine",
      },
      {
        frequency: 783.99,
        endFrequency: 880,
        delay: 0.065,
        duration: 0.17,
        volume: 0.018,
        type: "triangle",
      },
    ];
  }

  if (cue === "workout-started") {
    return [
      { frequency: 196, endFrequency: 246.94, duration: 0.13, volume: 0.014, type: "triangle" },
      { frequency: 293.66, delay: 0.055, duration: 0.12, volume: 0.01, type: "sine" },
    ];
  }

  if (cue === "set-completed") {
    return [
      { frequency: 220, endFrequency: 329.63, duration: 0.09, volume: 0.013, type: "triangle" },
    ];
  }

  if (cue === "volleyball-logged") {
    return [
      { frequency: 246.94, endFrequency: 392, duration: 0.14, volume: 0.014, type: "sine" },
      { frequency: 523.25, delay: 0.07, duration: 0.12, volume: 0.012, type: "triangle" },
    ];
  }

  if (cue === "personal-record") {
    return [
      { frequency: 261.63, endFrequency: 392, duration: 0.15, volume: 0.016, type: "triangle" },
      { frequency: 523.25, delay: 0.07, duration: 0.18, volume: 0.018, type: "sine" },
      { frequency: 783.99, delay: 0.14, duration: 0.22, volume: 0.019, type: "sine" },
    ];
  }

  if (cue === "workout-completed") {
    return [
      { frequency: 246.94, endFrequency: 369.99, duration: 0.15, volume: 0.016, type: "triangle" },
      { frequency: 493.88, delay: 0.075, duration: 0.2, volume: 0.017, type: "sine" },
    ];
  }

  if (cue === "meal-planned") {
    return [
      { frequency: 293.66, endFrequency: 392, duration: 0.12, volume: 0.012, type: "sine" },
      { frequency: 493.88, delay: 0.055, duration: 0.13, volume: 0.011, type: "triangle" },
    ];
  }

  if (cue === "meal-cooked") {
    return [
      { frequency: 329.63, endFrequency: 440, duration: 0.15, volume: 0.015, type: "triangle" },
      { frequency: 659.25, delay: 0.07, duration: 0.18, volume: 0.016, type: "sine" },
    ];
  }

  if (cue === "grocery-checked") {
    return [
      { frequency: 410, endFrequency: 520, duration: 0.085, volume: 0.01, type: "sine" },
    ];
  }

  if (cue === "task-added" || cue === "task-updated") {
    return [
      {
        frequency: 430,
        endFrequency: 560,
        duration: 0.11,
        volume: 0.016,
        type: "triangle",
      },
    ];
  }

  if (cue === "task-reopened") {
    return [
      {
        frequency: 520,
        endFrequency: 390,
        duration: 0.14,
        volume: 0.012,
        type: "sine",
      },
    ];
  }

  if (cue === "task-dismissed") {
    return [
      {
        frequency: 410,
        endFrequency: 315,
        duration: 0.16,
        volume: 0.011,
        type: "sine",
      },
    ];
  }

  if (cue === "task-restored") {
    return [
      {
        frequency: 390,
        endFrequency: 545,
        duration: 0.16,
        volume: 0.015,
        type: "triangle",
      },
    ];
  }

  return [
    {
      frequency: 660,
      endFrequency: 760,
      duration: 0.13,
      volume: 0.018,
      type: "triangle",
    },
    {
      frequency: 990,
      endFrequency: 1180,
      delay: 0.075,
      duration: 0.19,
      volume: 0.024,
      type: "sine",
    },
  ];
}

function scheduleCue(context: AudioContext, cue: FeedbackCue) {
  getCueTones(cue).forEach((tone) => playTone(context, tone));
}

export function playFeedbackSound(cue: FeedbackCue) {
  try {
    const context = getAudioContext();

    if (!context) return;

    if (context.state === "suspended") {
      void context
        .resume()
        .then(() => scheduleCue(context, cue))
        .catch(() => undefined);
      return;
    }

    scheduleCue(context, cue);
  } catch {
    // Feedback is intentionally optional and must never block an action.
  }
}
