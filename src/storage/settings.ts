import type { DeliveryRoute, ImageMode, KindleProfileId } from "../types";
import { defaultProfileId, isKindleProfileId } from "./kindleProfiles";
import { isValidKindleEmail } from "./kindleTargets";

export interface UserSettings {
  imageMode: ImageMode;
  route: DeliveryRoute;
  selectedProfileId?: KindleProfileId;
  kindleEmail?: string;
}

const SETTINGS_KEY = "settings";

export const defaultSettings: UserSettings = {
  imageMode: "smart-images",
  route: "amazon-web",
  selectedProfileId: defaultProfileId
};

export async function loadSettings(): Promise<UserSettings> {
  const result = (await chrome.storage.local.get(SETTINGS_KEY)) as Record<string, unknown>;
  return parseSettings(result[SETTINGS_KEY]);
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

function parseSettings(value: unknown): UserSettings {
  if (!isRecord(value)) return defaultSettings;

  return {
    imageMode: parseImageMode(value.imageMode),
    route: parseRoute(value.route),
    selectedProfileId: isKindleProfileId(value.selectedProfileId) ? value.selectedProfileId : defaultProfileId,
    ...(typeof value.kindleEmail === "string" && isValidKindleEmail(value.kindleEmail.trim())
      ? { kindleEmail: value.kindleEmail.trim() }
      : {})
  };
}

function parseImageMode(value: unknown): UserSettings["imageMode"] {
  return value === "text-only" || value === "cover-only" || value === "smart-images"
    ? value
    : defaultSettings.imageMode;
}

function parseRoute(value: unknown): UserSettings["route"] {
  return value === "download" || value === "amazon-web" || value === "email-handoff"
    ? value
    : defaultSettings.route;
}
