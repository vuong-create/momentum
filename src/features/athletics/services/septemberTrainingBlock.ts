import type { AthleticsPlannedExercise } from "../../../database/db";

export const SEPTEMBER_2026_BLOCK_KEY = "september-2026-training-block";

export const septemberTrainingPhases = [
  { weekNumber: 1, name: "Baseline", guidance: "Establish working weights · 2–3 reps in reserve · explosive work stays crisp." },
  { weekNumber: 2, name: "Progress", guidance: "Add reps inside the prescribed ranges while maintaining movement quality." },
  { weekNumber: 3, name: "Overload", guidance: "Hardest week · 1–2 reps in reserve · add load after reaching the top of a range." },
  { weekNumber: 4, name: "Reduced fatigue", guidance: "Lift with 30–40% less volume · avoid grinding · finish recovered and athletic." },
] as const;

function exercise(id: string, name: string, sets: number, repRange: string, category: AthleticsPlannedExercise["category"], alternatives?: string[], perSide = false): AthleticsPlannedExercise {
  return { id, name, alternatives, category, tracking: category === "explosive" ? "completion" : "load-reps", prescribedSets: sets, repRange, targetLabel: `${sets} × ${repRange}${perSide ? " / side" : ""}`, perSide };
}

export const upperAExercises = [
  exercise("upper-a-incline", "Incline DB Press", 3, "6–10", "hypertrophy"),
  exercise("upper-a-pull", "Pull-Ups", 3, "6–10", "hypertrophy", ["Pull-Ups", "Lat Pulldown"]),
  exercise("upper-a-chest", "Machine Chest Press", 3, "8–12", "hypertrophy"),
  exercise("upper-a-row", "Chest-Supported Row", 3, "8–12", "hypertrophy"),
  exercise("upper-a-lateral", "Cable Lateral Raise", 3, "12–20", "hypertrophy"),
  exercise("upper-a-rear", "Rear-Delt Fly", 2, "12–20", "hypertrophy"),
  exercise("upper-a-triceps", "Triceps Pressdown", 2, "10–15", "hypertrophy"),
  exercise("upper-a-curl", "DB Curl", 2, "10–15", "hypertrophy"),
];

export const lowerAExercises = [
  exercise("lower-a-approach", "Approach Jumps", 3, "3", "explosive"),
  exercise("lower-a-cmj", "Countermovement Jumps", 3, "3", "explosive"),
  exercise("lower-a-squat", "Squat", 3, "6–8", "hypertrophy", ["Squat", "Hack Squat"]),
  exercise("lower-a-split", "Bulgarian Split Squat", 3, "8–10", "hypertrophy", undefined, true),
  exercise("lower-a-curl", "Leg Curl", 3, "10–12", "hypertrophy"),
  exercise("lower-a-calf", "Calf Raise", 3, "10–15", "hypertrophy"),
  exercise("lower-a-tib", "Tibialis Raise", 2, "15–20", "hypertrophy"),
];

export const upperBExercises = [
  exercise("upper-b-press", "Flat DB Press", 3, "6–10", "hypertrophy", ["Flat DB Press", "Machine Press"]),
  exercise("upper-b-row", "Cable Row", 3, "8–12", "hypertrophy", ["Cable Row", "Seated Row"]),
  exercise("upper-b-pulldown", "Lat Pulldown", 3, "8–12", "hypertrophy"),
  exercise("upper-b-shoulder", "DB Shoulder Press", 2, "8–12", "hypertrophy", ["DB Shoulder Press", "Machine Shoulder Press"]),
  exercise("upper-b-lateral", "Cable Lateral Raise", 4, "12–20", "hypertrophy"),
  exercise("upper-b-fly", "Pec Fly", 2, "10–15", "hypertrophy"),
  exercise("upper-b-triceps", "Overhead Triceps Extension", 3, "10–15", "hypertrophy"),
  exercise("upper-b-curl", "Preacher Curl", 3, "10–15", "hypertrophy", ["Preacher Curl", "Cable Curl"]),
];

export const lowerBExercises = [
  exercise("lower-b-acceleration", "Short Acceleration", 4, "10 yd", "explosive"),
  exercise("lower-b-bound", "Lateral Bound + Stick", 3, "3", "explosive", undefined, true),
  exercise("lower-b-rdl", "Romanian Deadlift", 3, "6–8", "hypertrophy"),
  exercise("lower-b-leg-press", "Leg Press", 3, "8–12", "hypertrophy"),
  exercise("lower-b-lunge", "Reverse Lunge", 2, "8–10", "hypertrophy", undefined, true),
  exercise("lower-b-curl", "Leg Curl", 2, "10–15", "hypertrophy"),
  exercise("lower-b-adductor", "Hip Adductor", 2, "10–15", "hypertrophy"),
];

export function reducedSetCount(sets: number) {
  if (sets >= 4) return 3;
  if (sets === 3) return 2;
  if (sets === 2) return 1;
  return sets;
}

export function getEffectivePlannedExercises(exercises: AthleticsPlannedExercise[], reducedVolume: boolean) {
  if (!reducedVolume) return exercises;
  return exercises.map((item) => item.category === "explosive" ? item : {
    ...item,
    prescribedSets: reducedSetCount(item.prescribedSets),
    targetLabel: `${reducedSetCount(item.prescribedSets)} × ${item.repRange}${item.perSide ? " / side" : ""}`,
  });
}
