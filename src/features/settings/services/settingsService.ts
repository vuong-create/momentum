import {
  db,
  type AppSettings,
} from "../../../database/db";

export const SETTINGS_ID = "preferences" as const;

export const defaultAppSettings: AppSettings = {
  id: SETTINGS_ID,
  soundsEnabled: true,
  animationsEnabled: true,
  updatedAt: "",
};

export async function getAppSettings(): Promise<AppSettings> {
  const stored = await db.appSettings.get(SETTINGS_ID);

  return stored ?? defaultAppSettings;
}

export async function updateAppSettings(
  patch: Partial<
    Pick<AppSettings, "soundsEnabled" | "animationsEnabled">
  >
) {
  return db.transaction("rw", db.appSettings, async () => {
    const current = await getAppSettings();
    const next: AppSettings = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await db.appSettings.put(next);

    return next;
  });
}
