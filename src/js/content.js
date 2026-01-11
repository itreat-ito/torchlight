// 環境表示バナーのコンテンツスクリプト
import '../sass/content.scss';
import { detectEnvironment } from './domain-utils.js';

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
    
    chrome.storage.sync.get(['extensionEnabled', 'settings', 'projects'], (result) => {
      // 拡張機能が無効の場合は何もしない
      if (result.extensionEnabled === false) {
        // 既存のバナーがあれば削除
        const existingBanner = document.getElementById('env-banner');
        if (existingBanner) {
          existingBanner.remove();
        }
        return;
      }

      const settings = result.settings || {
        local: { text: 'Local Environment', color: '#4CAF50' },
        staging: { text: 'Staging Environment', color: '#FFC107' },
        production: { text: 'Production Environment', color: '#F44336' }
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
            // マウスカーソルによるバナーの非表示機能を設定
            setupBannerAutoHide(banner);
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
                // マウスカーソルによるバナーの非表示機能を設定
                setupBannerAutoHide(banner);
                obs.disconnect();
              }
            });
            observer.observe(document.documentElement, { childList: true });
          }
        }
      }
    });
  }

  // バナーの自動非表示機能を設定
  function setupBannerAutoHide(banner) {
    const BANNER_HEIGHT = 40;
    const HIDE_THRESHOLD = 60; // バナーの高さ + 余白（マウスカーソルがこの範囲内に入ると非表示）
    let hideTimeout = null;
    let isHidden = false;

    // マウスカーソルの位置を監視
    document.addEventListener('mousemove', (e) => {
      const mouseY = e.clientY;
      
      // 既存のタイムアウトをクリア
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      // バナーの近く（バナーの上も含む）にマウスカーソルがある場合は非表示
      if (mouseY <= HIDE_THRESHOLD) {
        if (!isHidden) {
          // バナーを非表示（pointer-eventsをnoneにしてクリック可能にする）
          banner.style.pointerEvents = 'none';
          banner.style.opacity = '0';
          banner.style.transition = 'opacity 0.2s ease-in-out';
          isHidden = true;
        }
      } else {
        // マウスカーソルが離れたら少し遅延して再表示
        if (isHidden) {
          hideTimeout = setTimeout(() => {
            banner.style.pointerEvents = 'auto';
            banner.style.opacity = '1';
            isHidden = false;
          }, 100); // 100msの遅延で再表示（ちらつきを防ぐ）
        }
      }
    });
  };

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

  // 拡張機能の有効/無効状態の更新を受け取る
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateExtensionState') {
      // 状態が変更されたら再初期化
      init();
      sendResponse({ success: true });
    }
    return true;
  });

})();
