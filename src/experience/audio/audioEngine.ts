import athleticsUrl from "../../assets/sounds/04-athletics-grounded-rise.wav?url";
import chineseUrl from "../../assets/sounds/03-chinese-porcelain.wav?url";
import completeUrl from "../../assets/sounds/01-complete-a-glass-lift.wav?url";
import cookingUrl from "../../assets/sounds/05-cooking-wood-ceramic.wav?url";
import financeUrl from "../../assets/sounds/06-finance-crisp-confirm.wav?url";
import focusUrl from "../../assets/sounds/08-focus-breath-bell.wav?url";
import levelUpUrl from "../../assets/sounds/09-level-up-prism.wav?url";
import libraryUrl from "../../assets/sounds/07-library-paper-bell.wav?url";

export type SoundCategory = "interface" | "action" | "celebration";

export type FeedbackCue =
  | "navigation" | "entry-confirmed" | "task-added" | "task-completed" | "task-reopened"
  | "task-updated" | "task-dismissed" | "task-restored"
  | "chinese-logged" | "workout-started" | "set-completed"
  | "workout-completed" | "personal-record" | "volleyball-logged"
  | "meal-planned" | "meal-cooked" | "grocery-checked"
  | "finance-account-added" | "finance-transaction" | "finance-income"
  | "finance-snapshot" | "library-saved" | "library-removed"
  | "focus-phase" | "level-up";

export type SoundPreferences = {
  volume: number;
  interfaceEnabled: boolean;
  actionEnabled: boolean;
  celebrationEnabled: boolean;
};

export type CueDefinition = {
  category: SoundCategory;
  cooldownMs: number;
  gain: number;
  priority: 1 | 2 | 3;
  assetUrl?: string;
  micro?: "tick" | "rise" | "fall" | "restore";
};

const micro = (kind: CueDefinition["micro"], category: SoundCategory = "action"): CueDefinition => ({
  category, cooldownMs: category === "interface" ? 100 : 55, gain: 0.34, priority: 1, micro: kind,
});

export const cueRegistry: Record<FeedbackCue, CueDefinition> = {
  navigation: micro("tick", "interface"),
  "entry-confirmed": { category: "interface", cooldownMs: 70, gain: 0.18, priority: 1, micro: "tick" },
  "task-added": micro("rise"),
  "task-completed": { category: "action", cooldownMs: 90, gain: 0.58, priority: 2, assetUrl: completeUrl },
  "task-reopened": micro("fall"),
  "task-updated": micro("tick"),
  "task-dismissed": micro("fall"),
  "task-restored": micro("restore"),
  "chinese-logged": { category: "action", cooldownMs: 110, gain: 0.5, priority: 2, assetUrl: chineseUrl },
  "workout-started": { category: "action", cooldownMs: 150, gain: 0.48, priority: 2, assetUrl: athleticsUrl },
  "set-completed": { category: "action", cooldownMs: 100, gain: 0.38, priority: 2, assetUrl: athleticsUrl },
  "workout-completed": { category: "celebration", cooldownMs: 300, gain: 0.55, priority: 3, assetUrl: athleticsUrl },
  "personal-record": { category: "celebration", cooldownMs: 500, gain: 0.62, priority: 3, assetUrl: levelUpUrl },
  "volleyball-logged": { category: "action", cooldownMs: 150, gain: 0.46, priority: 2, assetUrl: athleticsUrl },
  "meal-planned": micro("rise"),
  "meal-cooked": { category: "action", cooldownMs: 130, gain: 0.5, priority: 2, assetUrl: cookingUrl },
  "grocery-checked": micro("tick"),
  "finance-account-added": { category: "action", cooldownMs: 130, gain: 0.46, priority: 2, assetUrl: financeUrl },
  "finance-transaction": { category: "action", cooldownMs: 100, gain: 0.44, priority: 2, assetUrl: financeUrl },
  "finance-income": { category: "action", cooldownMs: 130, gain: 0.5, priority: 2, assetUrl: financeUrl },
  "finance-snapshot": { category: "celebration", cooldownMs: 250, gain: 0.52, priority: 3, assetUrl: financeUrl },
  "library-saved": { category: "action", cooldownMs: 120, gain: 0.46, priority: 2, assetUrl: libraryUrl },
  "library-removed": micro("fall"),
  "focus-phase": { category: "action", cooldownMs: 500, gain: 0.5, priority: 2, assetUrl: focusUrl },
  "level-up": { category: "celebration", cooldownMs: 1200, gain: 0.66, priority: 3, assetUrl: levelUpUrl },
};

const lastPlayed = new Map<FeedbackCue, number>();
const activeAudio = new Set<HTMLAudioElement>();
let audioContext: AudioContext | null = null;

function categoryEnabled(category: SoundCategory, preferences: SoundPreferences) {
  if (category === "interface") return preferences.interfaceEnabled;
  if (category === "celebration") return preferences.celebrationEnabled;
  return preferences.actionEnabled;
}

function playMicro(kind: NonNullable<CueDefinition["micro"]>, volume: number) {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ??= new AudioContextClass();
  const context = audioContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;
  const frequencies = {
    tick: [330, 355], rise: [410, 535], fall: [430, 320], restore: [350, 500],
  }[kind];
  oscillator.type = kind === "tick" ? "sine" : "triangle";
  oscillator.frequency.setValueAtTime(frequencies[0], start);
  oscillator.frequency.exponentialRampToValueAtTime(frequencies[1], start + 0.09);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.035), start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.13);
  if (context.state === "suspended") void context.resume().catch(() => undefined);
}

export function playFeedbackSound(
  cue: FeedbackCue,
  preferences: SoundPreferences,
  options: { preview?: boolean } = {},
) {
  if (typeof window === "undefined") return;
  const definition = cueRegistry[cue];
  if (!definition || (!options.preview && !categoryEnabled(definition.category, preferences))) return;
  const now = performance.now();
  if (!options.preview && now - (lastPlayed.get(cue) ?? -Infinity) < definition.cooldownMs) return;
  if (!options.preview && activeAudio.size >= 4 && definition.priority < 3) return;
  lastPlayed.set(cue, now);
  const volume = Math.max(0, Math.min(1, preferences.volume)) * definition.gain;
  try {
    if (definition.micro) {
      playMicro(definition.micro, volume);
      return;
    }
    const audio = new Audio(definition.assetUrl);
    audio.volume = volume;
    activeAudio.add(audio);
    const clean = () => activeAudio.delete(audio);
    audio.addEventListener("ended", clean, { once: true });
    audio.addEventListener("error", clean, { once: true });
    void audio.play().catch(clean);
  } catch {
    // Feedback is optional and must never block the action it follows.
  }
}
