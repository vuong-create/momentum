type TranslatorAvailability = "available" | "downloadable" | "downloading" | "unavailable";

interface BrowserTranslator {
  translate(text: string): Promise<string>;
  destroy?: () => void;
}

interface BrowserTranslatorFactory {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorAvailability>;
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<BrowserTranslator>;
}

export type TranslationResult =
  | { status: "translated"; text: string }
  | { status: "unavailable"; reason: string };

export async function translateTraditionalToEnglish(text: string): Promise<TranslationResult> {
  const phrase = text.trim();
  if (!phrase) return { status: "unavailable", reason: "Add Traditional Chinese first." };

  const factory = (globalThis as typeof globalThis & { Translator?: BrowserTranslatorFactory }).Translator;
  if (!factory) {
    return {
      status: "unavailable",
      reason: "On-device translation is not available in this browser. Enter and review the meaning manually.",
    };
  }

  try {
    const options = { sourceLanguage: "zh-Hant", targetLanguage: "en" };
    const availability = await factory.availability(options);
    if (availability === "unavailable") {
      return { status: "unavailable", reason: "This browser cannot translate Traditional Chinese on this device." };
    }
    const translator = await factory.create(options);
    const translated = (await translator.translate(phrase)).trim();
    translator.destroy?.();
    return translated
      ? { status: "translated", text: translated }
      : { status: "unavailable", reason: "No translation was returned. Enter the meaning manually." };
  } catch {
    return {
      status: "unavailable",
      reason: "Translation could not start. Your phrase was not saved or sent by Momentum.",
    };
  }
}
