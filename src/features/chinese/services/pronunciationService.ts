function getSpeechSynthesis() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  return window.speechSynthesis;
}

function selectMandarinVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang.toLowerCase() === "zh-tw") ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("zh-tw")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"))
  );
}

export function canSpeakTraditionalChinese() {
  return Boolean(
    getSpeechSynthesis() &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

export interface PronunciationOptions {
  rate?: number;
  repeat?: number;
}

export function speakTraditionalChinese(
  text: string,
  { rate = 0.82, repeat = 1 }: PronunciationOptions = {}
) {
  const speech = getSpeechSynthesis();
  const phrase = text.trim();

  if (!speech || !phrase || typeof SpeechSynthesisUtterance === "undefined") {
    return false;
  }

  const voice = selectMandarinVoice(speech.getVoices());
  speech.cancel();

  const repetitions = Math.min(5, Math.max(1, Math.round(repeat)));
  for (let index = 0; index < repetitions; index += 1) {
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = voice?.lang ?? "zh-TW";
    utterance.voice = voice ?? null;
    utterance.rate = Math.min(1.25, Math.max(0.5, rate));
    utterance.pitch = 1;
    speech.speak(utterance);
  }

  return true;
}
