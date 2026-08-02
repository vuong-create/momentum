import type {
  ChineseActivityIntensity,
  ChineseActivityType,
  Difficulty,
} from "../../database/db";

export interface ChineseActivityDefinition {
  type: ChineseActivityType;
  label: string;
  mark: string;
  description: string;
  intensity: ChineseActivityIntensity;
  xp: number;
  difficulty: Difficulty;
}

export const chineseActivityCatalog: ChineseActivityDefinition[] = [
  {
    type: "anki",
    label: "Anki",
    mark: "卡",
    description: "Review and recall",
    intensity: "normal",
    xp: 10,
    difficulty: "medium",
  },
  {
    type: "tutor",
    label: "Tutor",
    mark: "師",
    description: "Guided conversation",
    intensity: "strong",
    xp: 25,
    difficulty: "hard",
  },
  {
    type: "music",
    label: "Music",
    mark: "音",
    description: "Listen intentionally",
    intensity: "light",
    xp: 5,
    difficulty: "easy",
  },
  {
    type: "podcast",
    label: "Podcast",
    mark: "播",
    description: "Hear natural speech",
    intensity: "normal",
    xp: 10,
    difficulty: "medium",
  },
  {
    type: "video",
    label: "TV / Video",
    mark: "影",
    description: "Watch in Chinese",
    intensity: "normal",
    xp: 10,
    difficulty: "medium",
  },
  {
    type: "conversation",
    label: "Conversation",
    mark: "聊",
    description: "Use Chinese aloud",
    intensity: "normal",
    xp: 15,
    difficulty: "medium",
  },
  {
    type: "reading",
    label: "Reading",
    mark: "讀",
    description: "Read with intent",
    intensity: "normal",
    xp: 10,
    difficulty: "medium",
  },
  {
    type: "other",
    label: "Other",
    mark: "文",
    description: "Meaningful exposure",
    intensity: "light",
    xp: 5,
    difficulty: "easy",
  },
];

export function getChineseActivityDefinition(type: ChineseActivityType) {
  const definition = chineseActivityCatalog.find((item) => item.type === type);

  if (!definition) throw new Error(`Unknown Chinese activity type: ${type}`);

  return definition;
}

export function getChineseActivityKind(type: ChineseActivityType) {
  return `chinese:${type}`;
}

export function parseChineseActivityKind(value?: string) {
  if (!value?.startsWith("chinese:")) return null;

  const type = value.slice("chinese:".length) as ChineseActivityType;

  return chineseActivityCatalog.some((item) => item.type === type)
    ? type
    : null;
}
