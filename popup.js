// ポップアップ画面のロジック

(function() {
  'use strict';

  let translations = {};
  let currentLanguage = 'ja';

  // 言語ファイルの読み込み
  function loadLanguage() {
    chrome.storage.sync.get(['language'], (result) => {
      currentLanguage = result.language || 'ja';
      
      const langFile = `locales/${currentLanguage}.json`;
      fetch(chrome.runtime.getURL(langFile))
        .then(response => response.json())
        .then(data => {
          translations = data;
          applyTranslations();
        })
        .catch(error => {
          console.error('Failed to load language file:', error);
        });
    });
  }

  // 翻訳を適用
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const keys = key.split('.');
      let value = translations;
      
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = null;
          break;
        }
      }
      
      if (value !== null && value !== undefined) {
        element.textContent = value;
      }
    });
  }

  // オプションページを開く
  document.getElementById('open-options').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
    window.close();
  });

  // 初期化
  loadLanguage();
})();

