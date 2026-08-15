import {
  db,
  type AppSettings,
} from "../../../database/db";

export const SETTINGS_ID = "preferences" as const;

export const defaultAppSettings: AppSettings = {
  id: SETTINGS_ID,
  soundsEnabled: true,
  animationsEnabled: true,
  soundVolume: 0.6,
  interfaceSoundsEnabled: true,
  actionSoundsEnabled: true,
  celebrationSoundsEnabled: true,
  soundscapeVolume: 0.35,
  updatedAt: "",
};

export async function getAppSettings(): Promise<AppSettings> {
  const stored = await db.appSettings.get(SETTINGS_ID);

  return { ...defaultAppSettings, ...stored };
}

export async function updateAppSettings(
  patch: Partial<
    Pick<
      AppSettings,
      | "soundsEnabled"
      | "animationsEnabled"
      | "soundVolume"
      | "interfaceSoundsEnabled"
      | "actionSoundsEnabled"
      | "celebrationSoundsEnabled"
      | "soundscapeVolume"
    >
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
