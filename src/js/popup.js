// Popup page logic
import '../sass/popup.scss';
import { detectEnvironment, convertUrl, getDomainMapping } from './domain-utils.js';

// グローバルトグルの状態を読み込んで表示を更新
const globalToggle = document.getElementById('global-toggle');
const extensionStatus = document.getElementById('extension-status');

// 環境切り替えボタン
const openLocalBtn = document.getElementById('open-local');
const openStagingBtn = document.getElementById('open-staging');
const openProductionBtn = document.getElementById('open-production');
const currentTabInfo = document.getElementById('current-tab-info');

// ステータステキストを更新する関数
function updateStatusText(isEnabled) {
  extensionStatus.textContent = isEnabled ? 'ENABLED' : 'DISABLED';
}

// 現在のタブを取得
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

// 指定環境のURLを別タブで開く
async function openInEnvironment(environment) {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    return;
  }
  
  // chrome:// や chrome-extension:// などの特殊なURLは処理しない
  if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
    return;
  }
  
  const newUrl = await convertUrl(tab.url, environment);
  if (newUrl) {
    chrome.tabs.create({ url: newUrl });
  }
}

// 環境切り替えボタンの状態を更新
async function updateEnvironmentButtons() {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    // 無効なタブの場合、すべてのボタンを無効化
    openLocalBtn.disabled = true;
    openStagingBtn.disabled = true;
    openProductionBtn.disabled = true;
    currentTabInfo.textContent = 'Unable to detect current environment';
    return;
  }
  
  // chrome:// や chrome-extension:// などの特殊なURLは処理しない
  if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
    openLocalBtn.disabled = true;
    openStagingBtn.disabled = true;
    openProductionBtn.disabled = true;
    currentTabInfo.textContent = 'Not a web page';
    return;
  }
  
  try {
    const urlObj = new URL(tab.url);
    const currentDomain = urlObj.hostname;
    
    chrome.storage.sync.get(['projects', 'globalDomainMappings'], (result) => {
      const projects = result.projects || [];
      const globalMappings = result.globalDomainMappings || {
        local: 'test',
        staging: 'itreat-test.com'
      };
      
      const currentEnv = detectEnvironment(currentDomain, projects);
      
      // 各環境への切り替えが可能かチェック
      const canSwitchToLocal = getDomainMapping('local', currentDomain, projects, globalMappings) !== null;
      const canSwitchToStaging = getDomainMapping('staging', currentDomain, projects, globalMappings) !== null;
      const canSwitchToProduction = getDomainMapping('production', currentDomain, projects, globalMappings) !== null;
      
      // ボタンの有効/無効を設定
      openLocalBtn.disabled = !canSwitchToLocal || currentEnv === 'local';
      openStagingBtn.disabled = !canSwitchToStaging || currentEnv === 'staging';
      openProductionBtn.disabled = !canSwitchToProduction || currentEnv === 'production';
      
      // 現在のタブ情報を表示
      if (currentEnv) {
        currentTabInfo.textContent = `Current: ${currentEnv.toUpperCase()}`;
      } else {
        currentTabInfo.textContent = `Domain: ${currentDomain}`;
      }
    });
  } catch (error) {
    console.error('Error updating environment buttons:', error);
    openLocalBtn.disabled = true;
    openStagingBtn.disabled = true;
    openProductionBtn.disabled = true;
    currentTabInfo.textContent = 'Error detecting environment';
  }
}

// 初期状態を読み込む
chrome.storage.sync.get(['extensionEnabled'], (result) => {
  // デフォルトは有効（true）
  const isEnabled = result.extensionEnabled !== false;
  globalToggle.checked = isEnabled;
  updateStatusText(isEnabled);
});

// トグルの変更を監視
globalToggle.addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  updateStatusText(isEnabled);
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

// 環境切り替えボタンのイベントリスナー
openLocalBtn.addEventListener('click', () => openInEnvironment('local'));
openStagingBtn.addEventListener('click', () => openInEnvironment('staging'));
openProductionBtn.addEventListener('click', () => openInEnvironment('production'));

// 環境切り替えボタンの状態を更新
updateEnvironmentButtons();

// タブが変更されたときにボタン状態を更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    getCurrentTab().then((currentTab) => {
      if (currentTab && currentTab.id === tabId) {
        updateEnvironmentButtons();
      }
    });
  }
});

document.getElementById('open-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
});
