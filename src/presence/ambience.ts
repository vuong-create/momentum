import type { TimePeriod } from "./clock";

export type Ambience = {
  period: TimePeriod;
  className: string;
  label: string;
};

const ambienceByPeriod: Record<TimePeriod, Ambience> = {
  morning: {
    period: "morning",
    className: "presence-morning",
    label: "Morning",
  },

  afternoon: {
    period: "afternoon",
    className: "presence-afternoon",
    label: "Afternoon",
  },

  evening: {
    period: "evening",
    className: "presence-evening",
    label: "Evening",
  },

  night: {
    period: "night",
    className: "presence-night",
    label: "Night",
  },
};

export function getAmbience(period: TimePeriod) {
  return ambienceByPeriod[period];
}