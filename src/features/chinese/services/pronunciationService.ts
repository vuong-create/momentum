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

export function speakTraditionalChinese(text: string) {
  const speech = getSpeechSynthesis();
  const phrase = text.trim();

  if (!speech || !phrase || typeof SpeechSynthesisUtterance === "undefined") {
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(phrase);
  const voice = selectMandarinVoice(speech.getVoices());

  utterance.lang = voice?.lang ?? "zh-TW";
  utterance.voice = voice ?? null;
  utterance.rate = 0.82;
  utterance.pitch = 1;

  speech.cancel();
  speech.speak(utterance);

  return true;
}
