// 環境表示バナーのコンテンツスクリプト
import '../sass/content.scss';
import { detectEnvironment, convertUrl } from './common/domain.js';
import { getLuminance, hexToRgb } from './common/color.js';
import { matchesShortcut, isInputFocused } from './common/keyboard.js';
import { showSuccessToast } from './common/toast.js';
import { t, loadLanguage } from './common/i18n.js';
import { checkForUpdates } from './common/update-check.js';

(function() {
  'use strict';

  // 既にバナーが存在する場合は削除
  const existingContainer = document.getElementById('env-banner-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // ドメインを取得（ポート番号を除去）
  function getDomain() {
    const hostname = window.location.hostname;
    return hostname;
  }


  // 更新バナーを作成
  function createUpdateBanner(container, position) {
    loadLanguage().then(() => {
      checkForUpdates().then((result) => {
        if (!result.updateAvailable) return;
        const updateBanner = document.createElement('div');
        updateBanner.id = 'env-update-banner';
        updateBanner.className = 'env-update-banner';
        updateBanner.setAttribute('data-position', position);

        const inner = document.createElement('div');
        inner.className = 'env-update-banner-inner';
        const downloadLink = document.createElement(result.downloadUrl ? 'a' : 'span');
        if (result.downloadUrl) {
          downloadLink.href = result.downloadUrl;
          downloadLink.target = '_blank';
          downloadLink.rel = 'noopener noreferrer';
        }
        downloadLink.className = 'env-update-banner-link' + (result.downloadUrl ? '' : ' env-update-banner-link--disabled');
        downloadLink.textContent = t('update.download');
        const releasesLink = document.createElement('a');
        releasesLink.href = result.htmlUrl;
        releasesLink.target = '_blank';
        releasesLink.rel = 'noopener noreferrer';
        releasesLink.className = 'env-update-banner-link';
        releasesLink.textContent = t('update.releasesPage');
        inner.appendChild(document.createTextNode(t('update.available') + ' '));
        inner.appendChild(downloadLink);
        inner.appendChild(document.createTextNode(' | '));
        inner.appendChild(releasesLink);
        updateBanner.appendChild(inner);

        const envBanner = container.querySelector('#env-banner');
        container.insertBefore(updateBanner, envBanner);
      });
    });
  }

  // バナーを作成
  function createBanner(environment, settings, customization) {
    const envSettings = settings[environment];
    if (!envSettings) return null;

    const banner = document.createElement('div');
    banner.id = 'env-banner';
    banner.className = 'env-banner';

    const bannerInner = document.createElement('div');
    bannerInner.className = 'env-banner-inner';
    const envText = document.createElement('span');
    envText.className = 'env-banner-text';
    envText.textContent = envSettings.text || `${environment}環境`;
    bannerInner.appendChild(envText);
    banner.appendChild(bannerInner);
    
    // カスタマイズ設定を適用
    const custom = customization || {
      fontSize: 18,
      position: 'top',
      opacity: 100,
      blur: 0,
      height: 40
    };
    
    // 背景色と不透明度を設定
    const baseColor = envSettings.color || '#666666';
    const opacity = custom.opacity !== undefined ? custom.opacity : 100;
    const opacityDecimal = opacity / 100;
    
    // RGB値を取得してrgba形式に変換
    const rgb = hexToRgb(baseColor);
    if (rgb) {
      banner.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacityDecimal})`;
    } else {
      banner.style.backgroundColor = baseColor;
      banner.style.opacity = opacityDecimal.toString();
    }
    
    // backdrop-filter: blurを設定
    if (custom.blur !== undefined && custom.blur > 0) {
      banner.style.backdropFilter = `blur(${custom.blur}px)`;
      banner.style.webkitBackdropFilter = `blur(${custom.blur}px)`;
    }
    
    // フォントサイズを設定
    if (custom.fontSize !== undefined) {
      banner.style.fontSize = `${custom.fontSize}px`;
    }
    
    // バナーの高さを設定
    if (custom.height !== undefined) {
      banner.style.height = `${custom.height}px`;
      banner.style.lineHeight = `${custom.height}px`;
    }
    
    // 表示位置を設定
    if (custom.position === 'bottom') {
      banner.style.top = 'auto';
      banner.style.bottom = '0';
      banner.setAttribute('data-position', 'bottom');
    } else {
      banner.style.top = '0';
      banner.style.bottom = 'auto';
      banner.setAttribute('data-position', 'top');
    }

    // テキスト色を決定（明度に基づく）
    const luminance = getLuminance(baseColor);
    if (luminance > 0.5) {
      banner.classList.add('dark-text');
    } else {
      banner.classList.add('light-text');
    }

    return banner;
  }

  // 元のページタイトルを保存（プレフィックスなし）
  let originalTitle = document.title;

  // ページタイトルを更新
  function updatePageTitle(environment, pageTitles) {
    if (!environment || !pageTitles) {
      // 環境が検出できない場合は元のタイトルに戻す
      if (originalTitle) {
        document.title = originalTitle;
      }
      return;
    }

    const prefix = pageTitles[environment];
    if (!prefix || !prefix.trim()) {
      // プレフィックスが設定されていない場合は元のタイトルに戻す
      if (originalTitle) {
        document.title = originalTitle;
      }
      return;
    }

    // 元のタイトルが保存されていない場合は現在のタイトルを保存
    // ただし、既にプレフィックスが付いている場合は除外
    if (!originalTitle || originalTitle === document.title) {
      const existingPrefixes = Object.values(pageTitles).filter(p => p && p.trim());
      let isPrefixed = false;
      for (const existingPrefix of existingPrefixes) {
        if (document.title.startsWith(existingPrefix)) {
          isPrefixed = true;
          // 既存のプレフィックスを除去して元のタイトルを取得
          originalTitle = document.title.substring(existingPrefix.length).trim();
          break;
        }
      }
      if (!isPrefixed) {
        originalTitle = document.title;
      }
    }

    // 新しいプレフィックスを追加
    const titleWithoutPrefix = originalTitle || document.title;
    document.title = prefix + (titleWithoutPrefix ? ' ' + titleWithoutPrefix : titleWithoutPrefix);
  }

  // メイン処理
  function init() {
    const domain = getDomain();
    
    // 既存のバナーを削除
    const existingBanner = document.getElementById('env-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
    
    chrome.storage.sync.get(['extensionEnabled', 'bannerAppearance', 'projects', 'pageTitles'], (result) => {
      // 拡張機能が無効の場合は何もしない
      if (result.extensionEnabled === false) {
        const existingContainer = document.getElementById('env-banner-container');
        if (existingContainer) {
          existingContainer.remove();
        }
        return;
      }

      const bannerAppearance = result.bannerAppearance || {
        local: { text: 'You\'re on LOCAL env.', color: '#42a4ff' },
        staging: { text: 'You\'re on STAGING env.', color: '#ffc107' },
        production: { text: 'You\'re on PRODUCTION env.', color: '#f44336' },
        baseSettings: {
          fontSize: 18,
          position: 'top',
          opacity: 100,
          blur: 0,
          height: 40
        }
      };
      
      const settings = {
        local: bannerAppearance.local,
        staging: bannerAppearance.staging,
        production: bannerAppearance.production
      };
      const baseSettings = bannerAppearance.baseSettings || {
        fontSize: 18,
        position: 'top',
        opacity: 100,
        blur: 0,
        height: 40
      };
      
      const projects = result.projects || [];
      const pageTitles = result.pageTitles || {
        local: '',
        staging: '',
        production: ''
      };

      const environment = detectEnvironment(domain, projects);
      
      if (environment) {
        // ページタイトルを更新
        updatePageTitle(environment, pageTitles);

        const banner = createBanner(environment, settings, baseSettings);
        if (banner) {
          const position = baseSettings.position || 'top';
          const container = document.createElement('div');
          container.id = 'env-banner-container';
          container.className = 'env-banner-container';
          container.setAttribute('data-position', position);
          container.appendChild(banner);

          if (document.body) {
            document.body.appendChild(container);
            createUpdateBanner(container, position);
            try {
              if (container.showPopover && typeof container.showPopover === 'function') {
                container.setAttribute('popover', 'manual');
                container.showPopover();
              } else {
                container.style.zIndex = '9999';
              }
            } catch (error) {
              container.style.zIndex = '9999';
            }
            setupBannerAutoHide(banner);
          } else {
            const observer = new MutationObserver((mutations, obs) => {
              if (document.body) {
                document.body.appendChild(container);
                createUpdateBanner(container, position);
                try {
                  if (container.showPopover && typeof container.showPopover === 'function') {
                    container.setAttribute('popover', 'manual');
                    container.showPopover();
                  } else {
                    container.style.zIndex = '9999';
                  }
                } catch (error) {
                  container.style.zIndex = '9999';
                }
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

  // バナーの自動非表示機能を設定（環境バナーのみ、更新バナーは非表示にならない）
  function setupBannerAutoHide(banner) {
    const MARGIN = 20;
    let hideTimeout = null;
    let isHidden = false;
    const position = banner.getAttribute('data-position') || 'top';
    const isBottom = position === 'bottom';

    document.addEventListener('mousemove', (e) => {
      const mouseY = e.clientY;
      const rect = banner.getBoundingClientRect();
      const top = rect.top - MARGIN;
      const bottom = rect.bottom + MARGIN;

      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      const shouldHide = isBottom
        ? mouseY >= top && mouseY <= window.innerHeight
        : mouseY >= 0 && mouseY <= bottom;

      if (shouldHide) {
        if (!isHidden) {
          banner.style.pointerEvents = 'none';
          banner.style.opacity = '0';
          banner.style.transition = 'opacity 0.2s ease-in-out';
          isHidden = true;
        }
      } else {
        if (isHidden) {
          hideTimeout = setTimeout(() => {
            banner.style.pointerEvents = 'auto';
            banner.style.opacity = '1';
            isHidden = false;
          }, 100);
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
      // ページ遷移時に元のタイトルをリセット
      originalTitle = null;
      setTimeout(init, 100);
    }
  }).observe(document, { subtree: true, childList: true });

  // 拡張機能の有効/無効状態の更新を受け取る
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateExtensionState') {
      // 状態が変更されたら再初期化
      init();
      sendResponse({ success: true });
    } else if (message.action === 'updateKeyboardShortcuts') {
      // ショートカット設定が変更されたら再設定
      setupKeyboardShortcuts();
      sendResponse({ success: true });
    } else if (message.action === 'updatePageTitles') {
      // ページタイトル設定が変更されたら再初期化
      init();
      sendResponse({ success: true });
    } else if (message.action === 'updateBannerCustomization') {
      // バナーカスタマイズ設定が変更されたら再初期化
      init();
      sendResponse({ success: true });
    }
    return true;
  });

  // キーボードショートカットの設定
  let keyboardShortcutHandler = null;

  // 環境切り替え処理
  async function switchEnvironment(environment) {
    const currentUrl = window.location.href;
    
    // chrome:// や chrome-extension:// などの特殊なURLは処理しない
    if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
      return;
    }
    
    const newUrl = await convertUrl(currentUrl, environment);
    if (newUrl) {
      // 新しいタブで開く
      window.open(newUrl, '_blank');
    }
  }

  // クリップボードにコピー
  const COPY_TO_CLIPBOARD_SHORTCUT = 'Ctrl+Shift+C';
  const DEFAULT_COPY_FORMAT = '{{title}}\n{{url}}';
  const TOAST_MARGIN_BELOW_BANNER = 0;

  function getToastOffsetBelowBanner() {
    const container = document.getElementById('env-banner-container');
    if (!container) return {};
    const position = container.getAttribute('data-position') || 'top';
    if (position !== 'top') return {};
    const offsetTop = container.offsetHeight + TOAST_MARGIN_BELOW_BANNER;
    return { offsetTop };
  }

  function copyToClipboard() {
    const url = window.location.href;
    const title = document.title || '';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return;
    }

    chrome.storage.sync.get(['copyToClipboardFormat'], (result) => {
      const format = (result.copyToClipboardFormat || DEFAULT_COPY_FORMAT).trim() || DEFAULT_COPY_FORMAT;
      const text = format
        .replace(/\{\{url\}\}/g, url)
        .replace(/\{\{title\}\}/g, title);

      navigator.clipboard.writeText(text).then(() => {
        loadLanguage().then(() => {
          const toastOptions = getToastOffsetBelowBanner();
          showSuccessToast(t('message.copiedToClipboard'), toastOptions);
        });
      }).catch(() => {});
    });
  }

  // キーボードショートカットのハンドラーを設定
  function setupKeyboardShortcuts() {
    // 既存のハンドラーを削除
    if (keyboardShortcutHandler) {
      document.removeEventListener('keydown', keyboardShortcutHandler);
      keyboardShortcutHandler = null;
    }

    // ショートカット設定を読み込む
    chrome.storage.sync.get(['extensionEnabled', 'keyboardShortcuts'], (result) => {
      // 拡張機能が無効の場合は何もしない
      if (result.extensionEnabled === false) {
        return;
      }

      const shortcuts = result.keyboardShortcuts || {
        local: 'Ctrl+Shift+1',
        staging: 'Ctrl+Shift+2',
        production: 'Ctrl+Shift+3'
      };

      // キーボードイベントハンドラーを作成
      keyboardShortcutHandler = (event) => {
        // 入力フィールドにフォーカスがある場合は無視
        if (isInputFocused(event)) {
          return;
        }

        // クリップボードにコピー
        if (matchesShortcut(COPY_TO_CLIPBOARD_SHORTCUT, event)) {
          copyToClipboard();
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        // ショートカットが一致するかチェック
        if (matchesShortcut(shortcuts.local, event)) {
          switchEnvironment('local');
          event.preventDefault();
          event.stopPropagation();
        } else if (matchesShortcut(shortcuts.staging, event)) {
          switchEnvironment('staging');
          event.preventDefault();
          event.stopPropagation();
        } else if (matchesShortcut(shortcuts.production, event)) {
          switchEnvironment('production');
          event.preventDefault();
          event.stopPropagation();
        }
      };

      // イベントリスナーを追加
      document.addEventListener('keydown', keyboardShortcutHandler, true);
    });
  }

  // 初期化時にキーボードショートカットを設定
  setupKeyboardShortcuts();

  // ページ遷移時にも再設定（SPA対応）
  let lastUrlForShortcuts = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrlForShortcuts) {
      lastUrlForShortcuts = url;
      // 少し遅延してから再設定（ページ読み込みを待つ）
      setTimeout(() => {
        setupKeyboardShortcuts();
      }, 100);
    }
  }).observe(document, { subtree: true, childList: true });

})();
