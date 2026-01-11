// Domain utility functions for environment detection and URL conversion

// ワイルドカードパターンを正規表現に変換
export function wildcardToRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regex = escaped.replace(/\*/g, '.*');
  return new RegExp('^' + regex + '$');
}

// ドメインマッチング（完全一致またはワイルドカード）
export function matchesDomain(pattern, domain) {
  if (pattern === domain) {
    return true;
  }
  if (pattern.includes('*')) {
    const regex = wildcardToRegex(pattern);
    return regex.test(domain);
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
export function convertDomain(domain, fromDomain, toDomain) {
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
export function convertUrl(url, targetEnvironment) {
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
