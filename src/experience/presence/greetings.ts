import type { TimePeriod } from "./clock";

const greetings: Record<TimePeriod, string[]> = {
  morning: [
    "Good morning.",
    "A new day.",
    "Begin gently.",
    "Let’s start.",
    "",
  ],
  afternoon: [
    "Good afternoon.",
    "Keep going.",
    "Continue from here.",
    "One thing at a time.",
    "",
  ],
  evening: [
    "Good evening.",
    "Welcome back.",
    "Let’s continue.",
    "Take your time.",
    "",
  ],
  night: [
    "Good night.",
    "A quiet moment.",
    "Slow down.",
    "You’re home.",
    "",
  ],
};

function stringToNumber(value: string) {
  return value
    .split("")
    .reduce(
      (total, character) => total + character.charCodeAt(0),
      0
    );
}

export function getDailyGreeting(
  period: TimePeriod,
  dateKey: string
) {
  const options = greetings[period];
  const index = stringToNumber(`${dateKey}-${period}`) % options.length;

  return options[index];
}
