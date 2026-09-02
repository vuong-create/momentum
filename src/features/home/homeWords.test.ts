import { describe, expect, it } from "vitest";

import { chineseIdioms, getDailyChineseIdiom, idiomAsQuote } from "./chineseIdioms";
import { getDailyQuote, momentumQuotes } from "./quotes";

describe("Home daily words", () => {
  it("ships broad, duplicate-free offline collections", () => {
    expect(momentumQuotes.length).toBeGreaterThanOrEqual(60);
    expect(chineseIdioms.length).toBeGreaterThanOrEqual(50);
    expect(new Set(momentumQuotes.map((item) => item.id)).size).toBe(momentumQuotes.length);
    expect(new Set(chineseIdioms.map((item) => item.id)).size).toBe(chineseIdioms.length);
    expect(new Set(chineseIdioms.map((item) => item.text)).size).toBe(chineseIdioms.length);
  });

  it("keeps each day's quote and idiom stable", () => {
    expect(getDailyQuote("2026-09-01")).toEqual(getDailyQuote("2026-09-01"));
    expect(getDailyChineseIdiom("2026-09-01")).toEqual(getDailyChineseIdiom("2026-09-01"));
    expect(getDailyQuote("2026-09-01").id).not.toBe(getDailyQuote("2026-09-02").id);
  });

  it("preserves idiom pronunciation and meaning when saved as a quote", () => {
    const idiom = chineseIdioms[0];
    expect(idiomAsQuote(idiom)).toMatchObject({
      id: idiom.id,
      text: idiom.text,
      author: "Chinese idiom",
      source: `${idiom.pinyin} · ${idiom.meaning}`,
    });
  });
});
