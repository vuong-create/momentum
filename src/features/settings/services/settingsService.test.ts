import "fake-indexeddb/auto";

import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { db } from "../../../database/db";

import {
  getAppSettings,
  updateAppSettings,
} from "./settingsService";

beforeEach(async () => {
  await db.appSettings.clear();
});

afterAll(async () => {
  db.close();
  await db.delete();
});

describe("settings service", () => {
  it("provides calm experience defaults before settings are persisted", async () => {
    const settings = await getAppSettings();

    expect(settings.soundsEnabled).toBe(true);
    expect(settings.animationsEnabled).toBe(true);
  });

  it("persists feedback preferences without resetting other values", async () => {
    await updateAppSettings({ soundsEnabled: false });
    await updateAppSettings({ animationsEnabled: false });

    const settings = await getAppSettings();

    expect(settings.soundsEnabled).toBe(false);
    expect(settings.animationsEnabled).toBe(false);
    expect(settings.updatedAt).toBeTruthy();
  });
});
