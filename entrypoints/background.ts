export default defineBackground(() => {
  const openPanelFromAction = (tab: chrome.tabs.Tab) => {
    if (!tab.id) return;
    void chrome.sidePanel.open({ tabId: tab.id }).catch(() => undefined);
  };

  const enableActionClick = () => {
    void chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(() => chrome.action.onClicked.addListener(openPanelFromAction));
  };

  chrome.runtime.onInstalled.addListener(enableActionClick);
  enableActionClick();
});
