import { describe, expect, it } from "vitest";

import { cueRegistry } from "./audioEngine";

describe("Sound v2 cue registry", () => {
  it("assigns every cue one controlled playback strategy", () => {
    for (const definition of Object.values(cueRegistry)) {
      expect(Boolean(definition.assetUrl) !== Boolean(definition.micro)).toBe(true);
      expect(definition.gain).toBeGreaterThan(0);
      expect(definition.gain).toBeLessThanOrEqual(1);
      expect(definition.cooldownMs).toBeGreaterThan(0);
    }
  });

  it("keeps milestone sounds separate from everyday actions", () => {
    expect(cueRegistry["task-completed"].category).toBe("action");
    expect(cueRegistry["personal-record"].category).toBe("celebration");
    expect(cueRegistry["level-up"].category).toBe("celebration");
    expect(cueRegistry.navigation.category).toBe("interface");
  });

  it("keeps keyboard confirmation quieter than a full add action", () => {
    expect(cueRegistry["entry-confirmed"].category).toBe("interface");
    expect(cueRegistry["entry-confirmed"].gain).toBeLessThan(cueRegistry["task-added"].gain);
  });
});
