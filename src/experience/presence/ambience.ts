import type { TimePeriod } from "./clock";

export type Ambience = {
  period: TimePeriod;
  className: string;
  label: string;
  description: string;
};

const ambienceByPeriod: Record<TimePeriod, Ambience> = {
  morning: {
    period: "morning",
    className: "experience-morning",
    label: "Morning",
    description: "Cool daylight with a quiet, fresh lift.",
  },
  afternoon: {
    period: "afternoon",
    className: "experience-afternoon",
    label: "Afternoon",
    description: "Neutral light for a clear, focused workspace.",
  },
  evening: {
    period: "evening",
    className: "experience-evening",
    label: "Evening",
    description: "A warmer atmosphere as the day settles.",
  },
  night: {
    period: "night",
    className: "experience-night",
    label: "Night",
    description: "Low, cool light designed for a quieter pace.",
  },
};

export function getAmbience(period: TimePeriod) {
  return ambienceByPeriod[period];
}
