// Popup page logic
import '../sass/popup.scss';

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

// ワイルドカードパターンを正規表現に変換
function wildcardToRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regex = escaped.replace(/\*/g, '.*');
  return new RegExp('^' + regex + '$');
}

// ドメインマッチング（完全一致またはワイルドカード）
function matchesDomain(pattern, domain) {
  if (pattern === domain) {
    return true;
  }
  if (pattern.includes('*')) {
    const regex = wildcardToRegex(pattern);
    return regex.test(domain);
  }
  return false;
}

// 環境を判定（content.jsのロジックを再利用）
function detectCurrentEnvironment(domain, projects) {
  for (const project of projects) {
    if (project.enabled === false) {
      continue;
    }
    
    if (project.local && Array.isArray(project.local)) {
      for (const localDomain of project.local) {
        if (matchesDomain(localDomain, domain)) {
          return 'local';
        }
      }
    }
    if (project.staging && Array.isArray(project.staging)) {
      for (const stagingDomain of project.staging) {
        if (matchesDomain(stagingDomain, domain)) {
          return 'staging';
        }
      }
    }
    if (project.production && Array.isArray(project.production)) {
      for (const prodDomain of project.production) {
        if (matchesDomain(prodDomain, domain)) {
          return 'production';
        }
      }
    }
  }
  return null;
}

// 現在のタブを取得
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

// 現在のドメインがどのプロジェクトに該当するかを判定
function findMatchingProject(currentDomain, projects) {
  for (const project of projects) {
    if (project.enabled === false) {
      continue;
    }
    
    // プロジェクトのドメインリストを確認
    const allDomains = [
      ...(project.local || []),
      ...(project.staging || []),
      ...(project.production || [])
    ];
    
    for (const domainPattern of allDomains) {
      if (matchesDomain(domainPattern, currentDomain)) {
        return project; // 該当するプロジェクトを返す
      }
    }
  }
  return null; // 該当するプロジェクトがない
}

// 現在のドメインに含まれる文字列を探して、対応するターゲット環境の文字列を取得
function getDomainMapping(environment, currentDomain, projects, globalMappings) {
  // 1. まず現在のドメインがどのプロジェクトに該当するかを判定
  const matchingProject = findMatchingProject(currentDomain, projects);
  
  // 2. 該当プロジェクトが見つかった場合
  if (matchingProject && matchingProject.domainMappings) {
    // 現在の環境を判定（どの環境のDomain Mappingsが現在のドメインに含まれているか）
    let foundCurrentEnv = null;
    for (const env of ['local', 'staging', 'production']) {
      const mapping = matchingProject.domainMappings[env];
      if (mapping && mapping.trim() && currentDomain.includes(mapping)) {
        foundCurrentEnv = env;
        break;
      }
    }
    
    // 現在の環境が見つかり、ターゲット環境のDomain Mappingsが設定されている場合
    if (foundCurrentEnv) {
      const targetMapping = matchingProject.domainMappings[environment];
      // ターゲット環境のDomain Mappingsが設定されている場合のみ使用
      if (targetMapping && targetMapping.trim()) {
        return {
          from: matchingProject.domainMappings[foundCurrentEnv],
          to: targetMapping
        };
      }
      // ターゲット環境のDomain Mappingsが未設定の場合は、グローバル設定にフォールバック
    }
  }
  
  // 3. 該当プロジェクトがない、またはDomain Mappingsが未設定の場合はグローバル設定を使用
  // グローバル設定から現在のドメインに含まれる文字列を探す
  let foundGlobalEnv = null;
  for (const env of ['local', 'staging', 'production']) {
    const mapping = globalMappings?.[env];
    if (mapping && mapping.trim() && currentDomain.includes(mapping)) {
      foundGlobalEnv = env;
      break;
    }
  }
  
  // ターゲット環境のグローバル設定を返す
  if (foundGlobalEnv && globalMappings && globalMappings[environment] && globalMappings[environment].trim()) {
    return {
      from: globalMappings[foundGlobalEnv],
      to: globalMappings[environment]
    };
  }
  
  return null;
}

// ドメインを変換（単純な文字列置換）
function convertDomain(domain, fromDomain, toDomain) {
  if (!fromDomain || !toDomain) {
    return null;
  }
  
  // 現在のドメインにfromDomainが含まれている場合、toDomainに置換
  if (domain.includes(fromDomain)) {
    return domain.replace(fromDomain, toDomain);
  }
  
  return null;
}

// URLを環境別URLに変換
function convertUrl(url, targetEnvironment) {
  try {
    const urlObj = new URL(url);
    const currentDomain = urlObj.hostname;
    
    return new Promise((resolve) => {
      chrome.storage.sync.get(['projects', 'globalDomainMappings'], (result) => {
        const projects = result.projects || [];
        const globalMappings = result.globalDomainMappings || {
          local: 'test',
          staging: 'itreat-test.com'
        };
        
        const mapping = getDomainMapping(targetEnvironment, currentDomain, projects, globalMappings);
        if (!mapping || !mapping.from || !mapping.to) {
          resolve(null);
          return;
        }
        
        const newDomain = convertDomain(currentDomain, mapping.from, mapping.to);
        if (!newDomain) {
          resolve(null);
          return;
        }
        
        // 新しいURLを構築
        urlObj.hostname = newDomain;
        resolve(urlObj.toString());
      });
    });
  } catch (error) {
    console.error('Error converting URL:', error);
    return Promise.resolve(null);
  }
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
      
      const currentEnv = detectCurrentEnvironment(currentDomain, projects);
      
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
