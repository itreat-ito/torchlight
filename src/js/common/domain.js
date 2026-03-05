// Domain utility functions for environment detection and URL conversion

// ポート番号を除去してドメインを正規化
function normalizeDomain(domain) {
  if (!domain) {
    return domain;
  }
  // ポート番号（:数字）を除去
  return domain.replace(/:\d+$/, '');
}

// ドメインマッチング（部分一致）
export function matchesDomain(pattern, domain) {
  if (!pattern || !domain) {
    return false;
  }
  
  // ポート番号を除去して正規化
  const normalizedPattern = normalizeDomain(pattern);
  const normalizedDomain = normalizeDomain(domain);
  
  // 完全一致
  if (normalizedPattern === normalizedDomain) {
    return true;
  }
  
  // 部分一致（ドメインにパターンが含まれているか）
  if (normalizedDomain.includes(normalizedPattern)) {
    return true;
  }
  
  return false;
}

// 環境を判定
export function detectEnvironment(domain, projects) {
  for (const project of projects) {
    // プロジェクトが無効の場合はスキップ
    if (project.enabled === false) {
      continue;
    }
    
    // ローカル環境をチェック
    if (project.local && Array.isArray(project.local)) {
      for (const localDomain of project.local) {
        if (matchesDomain(localDomain, domain)) {
          return 'local';
        }
      }
    }
    // テスト環境をチェック
    if (project.staging && Array.isArray(project.staging)) {
      for (const stagingDomain of project.staging) {
        if (matchesDomain(stagingDomain, domain)) {
          return 'staging';
        }
      }
    }
    // 本番環境をチェック
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

// 現在のドメインがどのプロジェクトに該当するかを判定
export function findMatchingProject(currentDomain, projects) {
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
export function getDomainMapping(environment, currentDomain, projects, globalMappings) {
  // 1. まず現在のドメインがどの環境にいるのかを判定
  const currentEnv = detectEnvironment(currentDomain, projects);
  
  if (!currentEnv) {
    // 現在の環境が判定できない場合はnullを返す
    return null;
  }
  
  // 2. 現在のドメインがどのプロジェクトに該当するかを判定
  const matchingProject = findMatchingProject(currentDomain, projects);
  
  // 3. 該当プロジェクトが見つかり、Environment Domainsが設定されている場合
  if (matchingProject) {
    // Environment Domainsから取得（配列の最初の要素を使用）
    const currentDomainList = matchingProject[currentEnv] || [];
    const targetDomainList = matchingProject[environment] || [];
    
    const currentMapping = currentDomainList.length > 0 ? currentDomainList[0] : null;
    const targetMapping = targetDomainList.length > 0 ? targetDomainList[0] : null;
    
    // ターゲット環境のプロトコルを取得（デフォルトはhttps）
    const targetProtocol = matchingProject[`${environment}Protocol`] || 'https';
    
    // 現在の環境のDomainとターゲット環境のDomainが両方設定されている場合
    if (currentMapping && currentMapping.trim() && targetMapping && targetMapping.trim()) {
      return {
        from: currentMapping.trim(),
        to: targetMapping.trim(),
        protocol: targetProtocol
      };
    }
  }
  
  // 4. プロジェクトのEnvironment Domainsが未設定の場合はnullを返す（URL Switching不可）
  return null;
}

// ドメインからポート番号を抽出
function extractPort(domain) {
  if (!domain) {
    return null;
  }
  const match = domain.match(/:(\d+)$/);
  return match ? match[1] : null;
}

// ドメインを変換（単純な文字列置換）
export function convertDomain(domain, fromDomain, toDomain) {
  if (!fromDomain || !toDomain) {
    return null;
  }
  
  // ポート番号を除去して正規化
  const trimmedFrom = normalizeDomain(fromDomain.trim());
  const trimmedTo = normalizeDomain(toDomain.trim());
  const normalizedDomain = normalizeDomain(domain);
  
  // ドメインの末尾にfromDomainが一致する場合
  if (normalizedDomain.endsWith(trimmedFrom)) {
    // 末尾を置換
    return normalizedDomain.slice(0, -trimmedFrom.length) + trimmedTo;
  }
  
  // ドメイン内でドット + fromDomainが出現する場合（例: "aaa.bbb.itreat-test.com" で "itreat-test.com" を検索）
  const dotFrom = '.' + trimmedFrom;
  if (normalizedDomain.includes(dotFrom)) {
    // ドット + fromDomainをドット + toDomainに置換
    return normalizedDomain.replace(dotFrom, '.' + trimmedTo);
  }
  
  return null;
}

// URLを環境別URLに変換
export function convertUrl(url, targetEnvironment) {
  try {
    const urlObj = new URL(url);
    const currentDomain = urlObj.hostname;
    const originalPort = urlObj.port; // 元のポート番号を取得
    
    return new Promise((resolve) => {
      chrome.storage.sync.get(['projects'], (result) => {
        const projects = result.projects || [];
        
        const mapping = getDomainMapping(targetEnvironment, currentDomain, projects, null);
        if (!mapping || !mapping.from || !mapping.to) {
          resolve(null);
          return;
        }
        
        const newDomain = convertDomain(currentDomain, mapping.from, mapping.to);
        if (!newDomain) {
          resolve(null);
          return;
        }
        
        // ターゲットドメインからポート番号を抽出
        const targetPort = extractPort(mapping.to.trim());
        
        // 新しいURLを構築
        urlObj.hostname = newDomain;
        
        // プロトコルの処理
        // プロジェクト設定のプロトコルを使用（デフォルトはhttps）
        const targetProtocol = mapping.protocol || 'https';
        urlObj.protocol = targetProtocol + ':';
        
        // ポート番号の処理
        // プロジェクト設定のドメインに入力された文字列がそのまま置換されるようにする
        if (targetPort) {
          // ターゲットドメインにポート番号が含まれている場合はそれを使用
          urlObj.port = targetPort;
        } else {
          // ターゲットドメインにポート番号が含まれていない場合は、ポート番号を削除
          urlObj.port = '';
        }
        
        resolve(urlObj.toString());
      });
    });
  } catch (error) {
    console.error('Error converting URL:', error);
    return Promise.resolve(null);
  }
}
