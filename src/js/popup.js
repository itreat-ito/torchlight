// Popup page logic
import '../sass/popup.scss';

// グローバルトグルの状態を読み込んで表示を更新
const globalToggle = document.getElementById('global-toggle');

// 初期状態を読み込む
chrome.storage.sync.get(['extensionEnabled'], (result) => {
  // デフォルトは有効（true）
  const isEnabled = result.extensionEnabled !== false;
  globalToggle.checked = isEnabled;
});

// トグルの変更を監視
globalToggle.addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  chrome.storage.sync.set({ extensionEnabled: isEnabled }, () => {
    // すべてのタブにメッセージを送信して状態を更新
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateExtensionState',
          enabled: isEnabled
        }).catch(() => {
          // メッセージ送信に失敗しても無視（コンテンツスクリプトが読み込まれていないタブなど）
        });
      });
    });
  });
});

document.getElementById('open-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
});
