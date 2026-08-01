export function getLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function getLevelTitle(level: number) {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Master";
  if (level >= 10) return "Expert";
  if (level >= 5) return "Builder";
  
  return "Beginner";
}

export function getLevelProgress(xp: number) {
  return xp % 100;
}