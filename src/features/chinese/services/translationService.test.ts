import { afterEach, describe, expect, it, vi } from "vitest";

import { translateTraditionalToEnglish } from "./translationService";

afterEach(() => {
  Reflect.deleteProperty(globalThis, "Translator");
});

describe("Chinese translation service", () => {
  it("fails gracefully when on-device translation is unavailable", async () => {
    await expect(translateTraditionalToEnglish("隨便")).resolves.toMatchObject({
      status: "unavailable",
    });
  });

  it("uses Traditional Chinese and English with the browser translator", async () => {
    const destroy = vi.fn();
    const create = vi.fn(async () => ({
      translate: async () => "whatever / as you like",
      destroy,
    }));
    const availability = vi.fn(async () => "available");
    Object.defineProperty(globalThis, "Translator", {
      configurable: true,
      value: { availability, create },
    });

    await expect(translateTraditionalToEnglish("隨便")).resolves.toEqual({
      status: "translated",
      text: "whatever / as you like",
    });
    expect(availability).toHaveBeenCalledWith({ sourceLanguage: "zh-Hant", targetLanguage: "en" });
    expect(create).toHaveBeenCalledWith({ sourceLanguage: "zh-Hant", targetLanguage: "en" });
    expect(destroy).toHaveBeenCalledOnce();
  });
});
