import {
  getMomentumTitle,
  getProgressionSummary,
} from "../xp/progression";

export function getLevel(xp: number) {
  return getProgressionSummary(xp).level;
}

export const getLevelTitle = getMomentumTitle;

export function getLevelProgress(xp: number) {
  return getProgressionSummary(xp).percentage;
}
