import {
  CAPTURE_ACTIVE_TAB_REQUEST,
  SNAPSHOT_ERROR_MESSAGE,
  SNAPSHOT_READY_MESSAGE,
  saveLatestSnapshot
} from "../src/capture/snapshotSession";
import { collectPageSnapshot } from "../src/extraction/injectedSnapshot";
import type { PageSnapshot } from "../src/types";

export default defineBackground(() => {
  const disableAutomaticPanelOpen = () => {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => undefined);
  };

  chrome.runtime.onInstalled.addListener(disableAutomaticPanelOpen);
  disableAutomaticPanelOpen();

  chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    void chrome.sidePanel.open({ tabId: tab.id }).catch(() => undefined);
    void captureTab(tab.id);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isCaptureRequest(message)) return false;
    void captureActiveTab().then(sendResponse);
    return true;
  });
});

async function captureActiveTab(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (!tabId) throw new Error("No active tab is available.");
    await captureTab(tabId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not capture the active page.";
    await publishCaptureError(message);
    return { ok: false, message };
  }
}

async function captureTab(tabId: number): Promise<void> {
  try {
    const results = (await chrome.scripting.executeScript({
      target: { tabId },
      func: collectPageSnapshot
    })) as Array<{ result?: PageSnapshot }>;
    const snapshot = results[0]?.result;
    if (!snapshot) throw new Error("The active page did not return a snapshot.");
    await saveLatestSnapshot(snapshot);
    await chrome.runtime
      .sendMessage({
        type: SNAPSHOT_READY_MESSAGE,
        snapshot
      })
      .catch(() => undefined);
  } catch (error) {
    await publishCaptureError(error instanceof Error ? error.message : "Could not capture the active page.");
  }
}

async function publishCaptureError(message: string): Promise<void> {
  await chrome.runtime
    .sendMessage({
      type: SNAPSHOT_ERROR_MESSAGE,
      message: `${message} Click the Article Ferry toolbar icon from the article tab to refresh access.`
    })
    .catch(() => undefined);
}

function isCaptureRequest(message: unknown): message is { type: typeof CAPTURE_ACTIVE_TAB_REQUEST } {
  return typeof message === "object" && message !== null && "type" in message && message.type === CAPTURE_ACTIVE_TAB_REQUEST;
}
