const leadingListMarker = /^\s*(?:[-*•]+|\d+[.)])\s*/;

export const taskBrainstormPrompts = [
  "What has been quietly asking for your attention?",
  "What would make tomorrow feel lighter?",
  "What is one small move for each part of your life?",
  "Which loose ends are taking up mental space?",
  "What idea have you been postponing?",
];

export function parseBrainstormTasks(value: string) {
  const seen = new Set<string>();

  return value
    .split(/\r?\n/)
    .map((line) => line.replace(leadingListMarker, "").trim())
    .filter((line) => {
      if (!line) return false;
      const key = line.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30);
}
