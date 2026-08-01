export type Achievement = {
  title: string;
  description: string;
  unlocked: boolean;
};

export function getAchievements(xp: number) {
  return [
    {
      title: "First Steps",
      description: "Earn your first 10 XP",
      unlocked: xp >= 10,
    },
    {
      title: "Building Momentum",
      description: "Reach 100 XP",
      unlocked: xp >= 100,
    },
    {
      title: "Consistency",
      description: "Reach 500 XP",
      unlocked: xp >= 500,
    },
  ];
}