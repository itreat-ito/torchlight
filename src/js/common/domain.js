// Domain utility functions for environment detection and URL conversion

// ドメインマッチング（部分一致）
export function matchesDomain(pattern, domain) {
  if (!pattern || !domain) {
    return false;
  }
  
  // 完全一致
  if (pattern === domain) {
    return true;
  }
  
  // 部分一致（ドメインにパターンが含まれているか）
  if (domain.includes(pattern)) {
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
    // ステージング環境をチェック
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
  
  // 3. 該当プロジェクトが見つかり、Domain Mappingsが設定されている場合
  if (matchingProject && matchingProject.domainMappings) {
    // プロジェクト個別設定から取得
    const currentMapping = matchingProject.domainMappings[currentEnv];
    const targetMapping = matchingProject.domainMappings[environment];
    
    // 現在の環境のDomain Mappingとターゲット環境のDomain Mappingが両方設定されている場合
    if (currentMapping && currentMapping.trim() && targetMapping && targetMapping.trim()) {
      return {
        from: currentMapping.trim(),
        to: targetMapping.trim()
      };
    }
  }
  
  // 4. プロジェクトのDomain Mappingsが未設定の場合はnullを返す（URL Switching不可）
  return null;
}

// ドメインを変換（単純な文字列置換）
export function convertDomain(domain, fromDomain, toDomain) {
  if (!fromDomain || !toDomain) {
    return null;
  }
  
  const trimmedFrom = fromDomain.trim();
  const trimmedTo = toDomain.trim();
  
  // ドメインの末尾にfromDomainが一致する場合
  if (domain.endsWith(trimmedFrom)) {
    // 末尾を置換
    return domain.slice(0, -trimmedFrom.length) + trimmedTo;
  }
  
  // ドメイン内でドット + fromDomainが出現する場合（例: "aaa.bbb.itreat-test.com" で "itreat-test.com" を検索）
  const dotFrom = '.' + trimmedFrom;
  if (domain.includes(dotFrom)) {
    // ドット + fromDomainをドット + toDomainに置換
    return domain.replace(dotFrom, '.' + trimmedTo);
  }
  
  return null;
}

// URLを環境別URLに変換
export function convertUrl(url, targetEnvironment) {
  try {
    const urlObj = new URL(url);
    const currentDomain = urlObj.hostname;
    
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
