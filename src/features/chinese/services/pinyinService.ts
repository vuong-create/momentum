import { pinyin } from "pinyin-pro";

export function generatePinyin(traditional: string) {
  const text = traditional.trim();

  if (!text) return "";

  try {
    return pinyin(text, {
      toneType: "symbol",
      type: "string",
      nonZh: "consecutive",
    }).trim();
  } catch {
    return "";
  }
}
