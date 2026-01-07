// 環境表示バナーのコンテンツスクリプト

(function() {
  'use strict';

  // 既にバナーが存在する場合は削除
  const existingBanner = document.getElementById('env-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  // ドメインを取得（ポート番号を除去）
  function getDomain() {
    const hostname = window.location.hostname;
    return hostname;
  }

  // ワイルドカードパターンを正規表現に変換
  function wildcardToRegex(pattern) {
    // エスケープが必要な文字をエスケープ
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // ワイルドカード * を .* に変換
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

  // 環境を判定
  function detectEnvironment(domain, projects) {
    for (const project of projects) {
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

  // 色の明度を計算（テキスト色の決定に使用）
  function getLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const [rLinear, gLinear, bLinear] = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  // 16進数カラーをRGBに変換
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // バナーを作成
  function createBanner(environment, settings) {
    const envSettings = settings[environment];
    if (!envSettings) return null;

    const banner = document.createElement('div');
    banner.id = 'env-banner';
    banner.className = 'env-banner';
    banner.textContent = envSettings.text || `${environment}環境`;
    banner.style.backgroundColor = envSettings.color || '#666666';
    
    // Top Layer API: popover属性を使用して最上位レイヤーに配置
    banner.setAttribute('popover', 'manual');

    // テキスト色を決定（明度に基づく）
    const luminance = getLuminance(envSettings.color);
    if (luminance > 0.5) {
      banner.classList.add('dark-text');
    } else {
      banner.classList.add('light-text');
    }

    return banner;
  }

  // メイン処理
  function init() {
    const domain = getDomain();
    
    chrome.storage.sync.get(['settings', 'projects'], (result) => {
      const settings = result.settings || {
        local: { text: 'ローカル環境', color: '#4CAF50' },
        staging: { text: 'ステージング環境', color: '#FFC107' },
        production: { text: '本番環境', color: '#F44336' }
      };
      const projects = result.projects || [];

      const environment = detectEnvironment(domain, projects);
      
      if (environment) {
        const banner = createBanner(environment, settings);
        if (banner) {
          // DOMが準備できているか確認
          if (document.body) {
            document.body.appendChild(banner);
            // Top Layer API: showPopover()で最上位レイヤーに表示
            try {
              if (banner.showPopover && typeof banner.showPopover === 'function') {
                banner.showPopover();
              } else {
                // Top Layer APIがサポートされていない場合のフォールバック
                console.warn('Top Layer API (popover) is not supported. Using fallback.');
                banner.style.zIndex = '9999';
              }
            } catch (error) {
              // エラーが発生した場合のフォールバック
              console.warn('Failed to show popover:', error);
              banner.style.zIndex = '9999';
            }
          } else {
            // DOMが準備できていない場合は待機
            const observer = new MutationObserver((mutations, obs) => {
              if (document.body) {
                document.body.appendChild(banner);
                // Top Layer API: showPopover()で最上位レイヤーに表示
                try {
                  if (banner.showPopover && typeof banner.showPopover === 'function') {
                    banner.showPopover();
                  } else {
                    // Top Layer APIがサポートされていない場合のフォールバック
                    console.warn('Top Layer API (popover) is not supported. Using fallback.');
                    banner.style.zIndex = '9999';
                  }
                } catch (error) {
                  // エラーが発生した場合のフォールバック
                  console.warn('Failed to show popover:', error);
                  banner.style.zIndex = '9999';
                }
                obs.disconnect();
              }
            });
            observer.observe(document.documentElement, { childList: true });
          }
        }
      }
    });
  }

  // ページ読み込み時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ページ遷移時にも再実行（SPA対応）
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(init, 100);
    }
  }).observe(document, { subtree: true, childList: true });

})();

