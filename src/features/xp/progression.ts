export type ProgressionTrack = "momentum" | "pillar";

export interface ProgressionSummary {
  level: number;
  totalXP: number;
  currentLevelStartXP: number;
  nextLevelXP: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNextLevel: number;
  percentage: number;
}

const curves: Record<ProgressionTrack, { initial: number; step: number }> = {
  momentum: { initial: 100, step: 25 },
  pillar: { initial: 75, step: 15 },
};

export function getXPRequiredForNextLevel(
  level: number,
  track: ProgressionTrack = "momentum"
) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const curve = curves[track];

  return curve.initial + (normalizedLevel - 1) * curve.step;
}

export function getCumulativeXPForLevel(
  level: number,
  track: ProgressionTrack = "momentum"
) {
  const completedLevels = Math.max(0, Math.floor(level) - 1);
  const curve = curves[track];

  return Math.round(
    (completedLevels / 2) *
      (2 * curve.initial + (completedLevels - 1) * curve.step)
  );
}

export function getProgressionSummary(
  xp: number,
  track: ProgressionTrack = "momentum"
): ProgressionSummary {
  const totalXP = Math.max(0, Math.floor(xp));
  let level = 1;

  while (getCumulativeXPForLevel(level + 1, track) <= totalXP) {
    level += 1;
  }

  const currentLevelStartXP = getCumulativeXPForLevel(level, track);
  const xpForLevel = getXPRequiredForNextLevel(level, track);
  const nextLevelXP = currentLevelStartXP + xpForLevel;
  const xpIntoLevel = totalXP - currentLevelStartXP;

  return {
    level,
    totalXP,
    currentLevelStartXP,
    nextLevelXP,
    xpIntoLevel,
    xpForLevel,
    xpToNextLevel: Math.max(0, nextLevelXP - totalXP),
    percentage: Math.min(100, Math.max(0, (xpIntoLevel / xpForLevel) * 100)),
  };
}

export function getMomentumTitle(level: number) {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Master";
  if (level >= 10) return "Expert";
  if (level >= 5) return "Builder";

  return "Beginner";
}
