import type { PageSnapshot } from "../types";

export const LATEST_SNAPSHOT_KEY = "latestPageSnapshot";

export const CAPTURE_ACTIVE_TAB_REQUEST = "article-to-epub:capture-active-tab";
export const SNAPSHOT_READY_MESSAGE = "article-to-epub:snapshot-ready";
export const SNAPSHOT_ERROR_MESSAGE = "article-to-epub:snapshot-error";

export interface SnapshotReadyMessage {
  type: typeof SNAPSHOT_READY_MESSAGE;
  snapshot: PageSnapshot;
}

export interface SnapshotErrorMessage {
  type: typeof SNAPSHOT_ERROR_MESSAGE;
  message: string;
}

export type SnapshotMessage = SnapshotReadyMessage | SnapshotErrorMessage;

export async function saveLatestSnapshot(snapshot: PageSnapshot): Promise<void> {
  await chrome.storage.session.set({ [LATEST_SNAPSHOT_KEY]: snapshot });
}

export async function loadLatestSnapshot(): Promise<PageSnapshot | undefined> {
  const result = (await chrome.storage.session.get(LATEST_SNAPSHOT_KEY)) as Record<string, unknown>;
  return isRecord(result) && isPageSnapshot(result[LATEST_SNAPSHOT_KEY]) ? result[LATEST_SNAPSHOT_KEY] : undefined;
}

export function isSnapshotMessage(message: unknown): message is SnapshotMessage {
  return (
    isRecord(message) &&
    (message.type === SNAPSHOT_ERROR_MESSAGE ||
      (message.type === SNAPSHOT_READY_MESSAGE && isPageSnapshot(message.snapshot)))
  );
}

function isPageSnapshot(value: unknown): value is PageSnapshot {
  return (
    isRecord(value) &&
    (value.mode === "document" || value.mode === "selection") &&
    typeof value.url === "string" &&
    typeof value.title === "string" &&
    typeof value.html === "string" &&
    typeof value.capturedAt === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
