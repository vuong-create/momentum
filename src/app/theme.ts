export type PillarKey =
  | "core"
  | "chinese"
  | "athletics"
  | "cooking"
  | "finance"
  | "happiness";

export interface PillarTheme {
  key: PillarKey;
  label: string;
  shortLabel: string;
  icon: string;
  route: string;
  className: string;
  description: string;
}

export const pillarThemes: Record<PillarKey, PillarTheme> = {
  core: {
    key: "core",
    label: "General",
    shortLabel: "General",
    icon: "◆",
    route: "/planner",
    className: "pillar-core",
    description: "Everyday plans and responsibilities",
  },

  chinese: {
    key: "chinese",
    label: "Chinese",
    shortLabel: "Chinese",
    icon: "文",
    route: "/chinese",
    className: "pillar-chinese",
    description: "Learning consistency",
  },

  athletics: {
    key: "athletics",
    label: "Athletics",
    shortLabel: "Athletics",
    icon: "🏐",
    route: "/athletics",
    className: "pillar-athletics",
    description: "Weekly training",
  },

  cooking: {
    key: "cooking",
    label: "Cooking",
    shortLabel: "Cooking",
    icon: "🍳",
    route: "/cooking",
    className: "pillar-cooking",
    description: "Meals and cooking",
  },

  finance: {
    key: "finance",
    label: "Finance",
    shortLabel: "Finance",
    icon: "$",
    route: "/finance",
    className: "pillar-finance",
    description: "Financial overview",
  },

  happiness: {
    key: "happiness",
    label: "Library",
    shortLabel: "Library",
    icon: "✎",
    route: "/journal",
    className: "pillar-journal",
    description: "Thoughts, books, and memories",
  },
};

export const homePillars: PillarKey[] = [
  "chinese",
  "athletics",
  "cooking",
  "finance",
  "happiness",
];

export function getPillarTheme(pillar: PillarKey) {
  return pillarThemes[pillar];
}
