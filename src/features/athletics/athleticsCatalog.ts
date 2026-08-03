import type {
  AthleticsTemplateExercise,
  VolleyballSessionType,
} from "../../database/db";

export const starterAthleticsTemplates: Array<{
  name: string;
  exercises: Omit<AthleticsTemplateExercise, "id">[];
}> = [
  {
    name: "Push",
    exercises: [
      { name: "Incline DB Press", defaultSets: 3 },
      { name: "Shoulder Press", defaultSets: 3 },
      { name: "Lateral Raise", defaultSets: 3 },
      { name: "Triceps Extension", defaultSets: 3 },
    ],
  },
  {
    name: "Pull",
    exercises: [
      { name: "Pull Up", defaultSets: 3 },
      { name: "Chest Supported Row", defaultSets: 3 },
      { name: "Lat Pulldown", defaultSets: 3 },
      { name: "Biceps Curl", defaultSets: 3 },
    ],
  },
  {
    name: "Legs",
    exercises: [
      { name: "Squat", defaultSets: 3 },
      { name: "Romanian Deadlift", defaultSets: 3 },
      { name: "Leg Press", defaultSets: 3 },
      { name: "Calf Raise", defaultSets: 3 },
    ],
  },
];

export const volleyballSessionCatalog: Array<{
  type: VolleyballSessionType;
  label: string;
  mark: string;
  xp: number;
}> = [
  { type: "practice", label: "Practice", mark: "P", xp: 20 },
  { type: "open-gym", label: "Open Gym", mark: "O", xp: 20 },
  { type: "tournament", label: "Tournament", mark: "T", xp: 50 },
  { type: "coaching", label: "Coaching / Other", mark: "C", xp: 20 },
];

export function getVolleyballDefinition(type: VolleyballSessionType) {
  return volleyballSessionCatalog.find((item) => item.type === type)!;
}

export function getAthleticsTemplateActivityKind(templateId: number) {
  return `athletics-template:${templateId}`;
}

export function getVolleyballActivityKind(type: VolleyballSessionType) {
  return `athletics-volleyball:${type}`;
}
