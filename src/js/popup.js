// Popup page logic
import '../sass/popup.scss';
import { detectEnvironment, convertUrl, getDomainMapping } from './common/domain.js';
import { getLuminance, hexToRgb } from './common/color.js';
import { initI18n, t, translateElements } from './common/i18n.js';

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
  extensionStatus.textContent = isEnabled ? t('popup.enabled') : t('popup.disabled');
}

// ボタンのスタイルを更新
function updateButtonStyles(settings) {
  const defaultSettings = {
    local: { text: 'You\'re on LOCAL env.', color: '#42a4ff' },
    staging: { text: 'You\'re on STAGING env.', color: '#ffc107' },
    production: { text: 'You\'re on PRODUCTION env.', color: '#f44336' }
  };
  
  const envSettings = {
    local: settings?.local || defaultSettings.local,
    staging: settings?.staging || defaultSettings.staging,
    production: settings?.production || defaultSettings.production
  };
  
  // 各ボタンのスタイルを設定
  [openLocalBtn, openStagingBtn, openProductionBtn].forEach((btn, index) => {
    const env = ['local', 'staging', 'production'][index];
    const envSetting = envSettings[env];
    const backgroundColor = envSetting.color;
    const luminance = getLuminance(backgroundColor);
    
    btn.style.backgroundColor = backgroundColor;
    btn.style.color = luminance > 0.5 ? '#000000' : '#ffffff';
  });
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
    currentTabInfo.textContent = t('popup.unableToDetect');
    return;
  }
  
  // chrome:// や chrome-extension:// などの特殊なURLは処理しない
  if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
    openLocalBtn.disabled = true;
    openStagingBtn.disabled = true;
    openProductionBtn.disabled = true;
    currentTabInfo.textContent = t('popup.notWebPage');
    return;
  }
  
  try {
    const urlObj = new URL(tab.url);
    const currentDomain = urlObj.hostname;
    
    chrome.storage.sync.get(['projects', 'settings'], (result) => {
      const projects = result.projects || [];
      
      // ボタンのスタイルを更新
      updateButtonStyles(result.settings);
      
      const currentEnv = detectEnvironment(currentDomain, projects);
      
      // 各環境への切り替えが可能かチェック（プロジェクトのdomainMappingsが設定されている場合のみ）
      const canSwitchToLocal = getDomainMapping('local', currentDomain, projects, null) !== null;
      const canSwitchToStaging = getDomainMapping('staging', currentDomain, projects, null) !== null;
      const canSwitchToProduction = getDomainMapping('production', currentDomain, projects, null) !== null;
      
      // ボタンの有効/無効を設定
      openLocalBtn.disabled = !canSwitchToLocal || currentEnv === 'local';
      openStagingBtn.disabled = !canSwitchToStaging || currentEnv === 'staging';
      openProductionBtn.disabled = !canSwitchToProduction || currentEnv === 'production';
      
      // 現在のタブ情報を表示
      if (currentEnv) {
        currentTabInfo.textContent = `${t('popup.current')}: ${currentEnv.toUpperCase()}`;
      } else {
        currentTabInfo.textContent = `${t('popup.domain')}: ${currentDomain}`;
      }
    });
  } catch (error) {
    console.error('Error updating environment buttons:', error);
    openLocalBtn.disabled = true;
    openStagingBtn.disabled = true;
    openProductionBtn.disabled = true;
    currentTabInfo.textContent = t('popup.error');
  }
}

// 初期化
(async function() {
  // Initialize i18n first
  await initI18n();
  
  // Translate all elements
  translateElements();
  
  // 初期状態を読み込む
  chrome.storage.sync.get(['extensionEnabled', 'settings'], (result) => {
    // デフォルトは有効（true）
    const isEnabled = result.extensionEnabled !== false;
    globalToggle.checked = isEnabled;
    updateStatusText(isEnabled);
    
    // ボタンのスタイルを更新
    updateButtonStyles(result.settings);
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

  // 設定が変更されたときにボタンのスタイルを更新
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      if (changes.settings) {
        updateButtonStyles(changes.settings.newValue);
      }
      // Language change
      if (changes.language) {
        translateElements();
        updateStatusText(globalToggle.checked);
        updateEnvironmentButtons();
      }
    }
  });
})();
