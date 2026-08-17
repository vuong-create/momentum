import { describe, expect, it } from "vitest";

import { validateRecipeCoverFile } from "./recipeImageService";

describe("recipe cover validation", () => {
  it("accepts ordinary images and rejects invalid or oversized files", () => {
    expect(() => validateRecipeCoverFile({ type: "image/jpeg", size: 500_000 })).not.toThrow();
    expect(() => validateRecipeCoverFile({ type: "text/plain", size: 100 })).toThrow("image file");
    expect(() => validateRecipeCoverFile({ type: "image/png", size: 13 * 1024 * 1024 })).toThrow("12 MB");
  });
});
