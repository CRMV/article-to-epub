import type { DeliveryRoute, ImageMode } from "../types";

export interface UserSettings {
  imageMode: ImageMode;
  route: DeliveryRoute;
  kindleEmail?: string;
}

const SETTINGS_KEY = "settings";

export const defaultSettings: UserSettings = {
  imageMode: "smart-images",
  route: "amazon-web"
};

export async function loadSettings(): Promise<UserSettings> {
  const result = (await chrome.storage.local.get(SETTINGS_KEY)) as Record<string, unknown>;
  return { ...defaultSettings, ...(isRecord(result[SETTINGS_KEY]) ? result[SETTINGS_KEY] : {}) };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function clearSettings(): Promise<void> {
  await chrome.storage.local.remove(SETTINGS_KEY);
}

function isRecord(value: unknown): value is Partial<UserSettings> {
  return typeof value === "object" && value !== null;
}

