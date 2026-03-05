// Internationalization (i18n) utility for torchlight extension

// Translation data
const translations = {
  en: {
    // Navigation
    'nav.projects': 'Your Projects',
    'nav.settings': 'Settings',
    
    // Projects page
    'projects.add': 'Add Project',
    'projects.empty.title': 'No projects found',
    'projects.empty.description': 'Click "Add Project" button to add a new project',
    'projects.edit': 'Edit',
    'projects.delete': 'Delete',
    'projects.local': 'Local',
    'projects.staging': 'Staging',
    'projects.production': 'Production',
    'projects.notSet': 'Not set',
    
    // Project modal
    'modal.project.add': 'Add Project',
    'modal.project.edit': 'Edit Project',
    'modal.project.name': 'Project Name',
    'modal.project.envDomains': 'Environment Domains',
    'modal.project.local': 'Local',
    'modal.project.staging': 'Staging',
    'modal.project.production': 'Production',
    'modal.project.save': 'Save',
    'modal.project.cancel': 'Cancel',
    
    // Settings page
    'settings.banner.title': 'Banner Appearance',
    'settings.banner.description': 'Customize the banner\'s appearance and display settings for each environment.',
    'settings.banner.local': 'Local',
    'settings.banner.staging': 'Staging',
    'settings.banner.production': 'Production',
    'settings.banner.text': 'Text',
    'settings.banner.color': 'Background Color',
    'settings.banner.save': 'Save',
    
    'settings.bannerBaseSettings.title': 'Base Settings',
    'settings.bannerBaseSettings.fontSize': 'Font Size',
    'settings.bannerBaseSettings.position': 'Position',
    'settings.bannerBaseSettings.positionTop': 'Top',
    'settings.bannerBaseSettings.positionBottom': 'Bottom',
    'settings.bannerBaseSettings.opacity': 'Background Opacity',
    'settings.bannerBaseSettings.blur': 'Backdrop Blur',
    'settings.bannerBaseSettings.height': 'Height',
    'settings.bannerBaseSettings.save': 'Save',
    
    'settings.pageTitle.title': 'Page Titles',
    'settings.pageTitle.description': 'Set a prefix to be added to the page title when accessing each environment.',
    'settings.pageTitle.local': 'Local',
    'settings.pageTitle.staging': 'Staging',
    'settings.pageTitle.production': 'Production',
    'settings.pageTitle.prefix': 'Prefix',
    'settings.pageTitle.save': 'Save',
    
    'settings.shortcuts.title': 'URL Switching',
    'settings.shortcuts.description': 'Set keyboard shortcuts to quickly switch between environments.',
    'settings.shortcuts.local': 'Local',
    'settings.shortcuts.staging': 'Staging',
    'settings.shortcuts.production': 'Production',
    'settings.shortcuts.hotkey': 'Hotkey',
    'settings.shortcuts.hotkeyHint': 'Click and press the key combination to set',
    'settings.shortcuts.save': 'Save',
    
    'settings.copyToClipboard.title': 'Copy to Clipboard',
    'settings.copyToClipboard.description': 'Set a format template for copying to the clipboard. Press the key combination Shift+Control+C to copy the text.\nYou can use the following variables.\n ・{{title}} ... the page title\n ・{{url}} ... the page URL',
    'settings.copyToClipboard.format': 'Format',
    'settings.copyToClipboard.save': 'Save',
    
    'settings.export.title': 'Export/Import',
    'settings.export.export': 'Export',
    'settings.export.import': 'Import',
    
    // Language selector
    'language.title': 'Language',
    'language.english': 'English',
    'language.japanese': '日本語',
    
    // Popup
    'popup.enabled': 'ENABLED',
    'popup.disabled': 'DISABLED',
    'popup.switchEnv': 'Switch Environment',
    'popup.local': 'LOCAL',
    'popup.staging': 'STAGING',
    'popup.production': 'PRODUCTION',
    'popup.openSettings': 'Settings',
    'popup.copyToClipboard': 'Copy to Clipboard',
    'popup.copyToClipboardButton': 'Copy',
    'popup.current': 'Current',
    'popup.domain': 'Domain',
    'popup.unableToDetect': 'Unable to detect current environment',
    'popup.notWebPage': 'Not a web page',
    'popup.error': 'Error detecting environment',
    
    // Messages
    'message.bannerAppearanceSaved': 'Banner appearance saved successfully!',
    'message.bannerCustomizationSaved': 'Banner customization saved successfully!',
    'message.pageTitlesSaved': 'Page titles saved successfully!',
    'message.urlSwitchingSaved': 'URL switching saved successfully!',
    'message.copyToClipboardSaved': 'Copy to clipboard format saved successfully!',
    'message.copiedToClipboard': 'Copied to clipboard!',
    'message.projectAdded': 'Project added successfully!',
    'message.projectUpdated': 'Project updated successfully!',
    'message.projectDeleted': 'Project deleted successfully!',
    'message.settingsExported': 'Settings exported successfully!',
    'message.settingsImported': 'Settings imported successfully!',
    'message.enterProjectName': 'Please enter a project name',
    'message.invalidJson': 'Error: Invalid JSON file. Please check the file format.',
    'message.invalidSettings': 'Error: Invalid settings file. Missing required fields.',
    'message.confirmDelete': 'Are you sure you want to delete this project?',
    'message.confirmDeleteTitle': 'Delete Project',
    'message.confirmImport': 'This will replace all your current settings. Are you sure you want to continue?',
    'message.confirmImportTitle': 'Import Settings',
    'message.confirm': 'Confirm',
    'message.ok': 'OK',
    'message.cancel': 'Cancel',
    
    // Update notification
    'update.available': 'New version available',
    'update.download': 'Download',
    'update.releasesPage': 'Release note',
    'update.skipVersion': 'Skip this version',
    
    // Placeholders
    'placeholder.localText': 'You\'re on LOCAL env.',
    'placeholder.stagingText': 'You\'re on STAGING env.',
    'placeholder.productionText': 'You\'re on PRODUCTION env.',
    'placeholder.pageTitleLocal': '[LOCAL]',
    'placeholder.pageTitleStaging': '[STAGING]',
    'placeholder.pageTitleProduction': '[PRODUCTION]',
    'placeholder.projectLocal': 'example.test',
    'placeholder.projectStaging': 'example.itreat-test.com',
    'placeholder.projectProduction': 'example.com',
    'placeholder.shortcut': 'Press key combination...',
    'placeholder.copyToClipboardFormat': '{{title}}\n{{url}}',
  },
  ja: {
    // Navigation
    'nav.projects': 'プロジェクト',
    'nav.settings': '設定',
    
    // Projects page
    'projects.add': 'プロジェクトを追加',
    'projects.empty.title': 'プロジェクトがありません',
    'projects.empty.description': '「プロジェクトを追加」ボタンをクリックして新しいプロジェクトを追加してください',
    'projects.edit': '編集',
    'projects.delete': '削除',
    'projects.local': 'ローカル',
    'projects.staging': 'テスト',
    'projects.production': '本番',
    'projects.notSet': '未設定',
    
    // Project modal
    'modal.project.add': 'プロジェクトを追加',
    'modal.project.edit': 'プロジェクトを編集',
    'modal.project.name': 'プロジェクト名',
    'modal.project.envDomains': '各環境のドメイン',
    'modal.project.local': 'ローカル',
    'modal.project.staging': 'テスト',
    'modal.project.production': '本番',
    'modal.project.save': '保存',
    'modal.project.cancel': 'キャンセル',
    
    // Settings page
    'settings.banner.title': 'バナースタイル',
    'settings.banner.description': '各環境のバナーの見た目と表示設定をカスタマイズします。',
    'settings.banner.local': 'ローカル',
    'settings.banner.staging': 'テスト',
    'settings.banner.production': '本番',
    'settings.banner.text': 'テキスト',
    'settings.banner.color': '背景色',
    'settings.banner.save': '保存',
    
    'settings.bannerBaseSettings.title': '共通設定',
    'settings.bannerBaseSettings.fontSize': 'フォントサイズ',
    'settings.bannerBaseSettings.position': '表示位置',
    'settings.bannerBaseSettings.positionTop': '上部',
    'settings.bannerBaseSettings.positionBottom': '下部',
    'settings.bannerBaseSettings.opacity': '背景の不透明度',
    'settings.bannerBaseSettings.blur': '背景のぼかし',
    'settings.bannerBaseSettings.height': 'バナーの高さ',
    'settings.bannerBaseSettings.save': '保存',
    
    'settings.pageTitle.title': 'ページタイトル',
    'settings.pageTitle.description': 'ページタイトルの先頭に任意の文字を追加します。',
    'settings.pageTitle.local': 'ローカル',
    'settings.pageTitle.staging': 'テスト',
    'settings.pageTitle.production': '本番',
    'settings.pageTitle.prefix': 'プレフィックス',
    'settings.pageTitle.save': '保存',
    
    'settings.shortcuts.title': 'URL切り替え',
    'settings.shortcuts.description': '各環境間を素早く切り替えるためのキーボードショートカットを設定します。',
    'settings.shortcuts.local': 'ローカル',
    'settings.shortcuts.staging': 'テスト',
    'settings.shortcuts.production': '本番',
    'settings.shortcuts.hotkey': 'ホットキー',
    'settings.shortcuts.hotkeyHint': 'クリックしてショートカットキーを設定',
    'settings.shortcuts.save': '保存',
    
    'settings.copyToClipboard.title': 'クリップボードにコピー',
    'settings.copyToClipboard.description': 'クリップボードにコピーする形式を登録します。Shift+Control+Cでコピーされます。\n以下の変数を使用できます。\n ・{{title}} ... ページタイトル\n ・{{url}} ... ページURL',
    'settings.copyToClipboard.format': '形式',
    'settings.copyToClipboard.save': '保存',
    
    'settings.export.title': '設定のエクスポート/インポート',
    'settings.export.export': 'エクスポート',
    'settings.export.import': 'インポート',
    
    // Language selector
    'language.title': '言語',
    'language.english': 'English',
    'language.japanese': '日本語',
    
    // Popup
    'popup.enabled': '有効',
    'popup.disabled': '無効',
    'popup.switchEnv': '環境切り替え',
    'popup.local': 'ローカル',
    'popup.staging': 'テスト',
    'popup.production': '本番',
    'popup.openSettings': '詳細設定',
    'popup.copyToClipboard': 'クリップボードにコピー',
    'popup.copyToClipboardButton': 'コピー',
    'popup.current': '現在',
    'popup.domain': 'ドメイン',
    'popup.unableToDetect': '現在の環境を検出できません',
    'popup.notWebPage': 'Webページではありません',
    'popup.error': '環境の検出でエラーが発生しました',
    
    // Messages
    'message.bannerAppearanceSaved': 'バナースタイルを保存しました',
    'message.bannerCustomizationSaved': 'バナー詳細設定を保存しました',
    'message.pageTitlesSaved': 'ページタイトルを保存しました',
    'message.urlSwitchingSaved': 'URL切り替えを保存しました',
    'message.copyToClipboardSaved': 'コピー形式を保存しました',
    'message.copiedToClipboard': 'クリップボードにコピーしました',
    'message.projectAdded': 'プロジェクトを追加しました',
    'message.projectUpdated': 'プロジェクトを更新しました',
    'message.projectDeleted': 'プロジェクトを削除しました',
    'message.settingsExported': '設定のエクスポートが完了しました',
    'message.settingsImported': '設定のインポートが完了しました',
    'message.enterProjectName': 'プロジェクト名を入力してください',
    'message.invalidJson': 'エラー: 無効なJSONファイルです。ファイル形式を確認してください。',
    'message.invalidSettings': 'エラー: 無効な設定ファイルです。必須フィールドが不足しています。',
    'message.confirmDelete': 'このプロジェクトを削除してもよろしいですか？',
    'message.confirmDeleteTitle': 'プロジェクトの削除',
    'message.confirmImport': '現在のすべての設定が置き換えられます。続行してもよろしいですか？',
    'message.confirmImportTitle': '設定のインポート',
    'message.confirm': '確認',
    'message.ok': 'OK',
    'message.cancel': 'キャンセル',
    
    // Update notification
    'update.available': '新しいバージョンが利用可能です',
    'update.download': 'ダウンロード',
    'update.releasesPage': 'リリースノート',
    'update.skipVersion': 'このバージョンをスキップ',

    // Placeholders
    'placeholder.localText': 'ローカル環境です',
    'placeholder.stagingText': 'テスト環境です',
    'placeholder.productionText': '本番環境です',
    'placeholder.pageTitleLocal': '[ローカル]',
    'placeholder.pageTitleStaging': '[テスト]',
    'placeholder.pageTitleProduction': '[本番]',
    'placeholder.projectLocal': 'example.test',
    'placeholder.projectStaging': 'example.itreat-test.com',
    'placeholder.projectProduction': 'example.com',
    'placeholder.shortcut': 'ショートカットキーを設定してください...',
    'placeholder.copyToClipboardFormat': '{{title}}\n{{url}}',
  }
};

// Current language (default: Japanese)
let currentLanguage = 'ja';

/**
 * Get the current language
 * @returns {string} Current language code ('en' or 'ja')
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Set the language
 * @param {string} lang - Language code ('en' or 'ja')
 */
export function setLanguage(lang) {
  if (lang === 'en' || lang === 'ja') {
    currentLanguage = lang;
  }
}

/**
 * Get a translated string
 * @param {string} key - Translation key
 * @param {Object} params - Optional parameters for string interpolation
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
  const translation = translations[currentLanguage]?.[key] || translations.en[key] || key;
  
  // Simple parameter replacement: {paramName}
  if (Object.keys(params).length > 0) {
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }
  
  return translation;
}

/**
 * Load language from storage
 * @returns {Promise<string>} Language code
 */
export function loadLanguage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['language'], (result) => {
      const lang = result.language || 'ja'; // Default to Japanese
      setLanguage(lang);
      resolve(lang);
    });
  });
}

/**
 * Save language to storage
 * @param {string} lang - Language code ('en' or 'ja')
 * @returns {Promise<void>}
 */
export function saveLanguage(lang) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ language: lang }, () => {
      setLanguage(lang);
      resolve();
    });
  });
}

/**
 * Translate all elements with data-i18n attribute
 * @param {HTMLElement|Document} root - Root element to search (default: document)
 */
export function translateElements(root = document) {
  const elements = root.querySelectorAll('[data-i18n]');
  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      const text = t(key);
      
      // Handle different element types
      if (element.tagName === 'INPUT' && element.type === 'text') {
        // For input placeholders, check if there's a data-i18n-placeholder attribute
        const placeholderKey = element.getAttribute('data-i18n-placeholder');
        if (placeholderKey) {
          element.placeholder = t(placeholderKey);
        }
        // For input values, use the data-i18n value
        if (element.value === '' || element.hasAttribute('data-i18n-value')) {
          // Only update if empty or explicitly marked
          const value = t(key);
          if (value !== key) {
            element.value = value;
          }
        }
      } else if (element.tagName === 'INPUT' && element.type === 'button' || element.tagName === 'BUTTON') {
        element.textContent = text;
      } else if (element.tagName === 'SELECT') {
        // For select elements, translate options
        const options = element.querySelectorAll('option[data-i18n]');
        options.forEach((option) => {
          const optionKey = option.getAttribute('data-i18n');
          if (optionKey) {
            option.textContent = t(optionKey);
          }
        });
      } else if (element.tagName === 'OPTION') {
        // Options are handled by their parent select
        element.textContent = text;
      } else {
        element.textContent = text;
      }
    }
  });
  
  // Handle title attributes
  const titleElements = root.querySelectorAll('[data-i18n-title]');
  titleElements.forEach((element) => {
    const key = element.getAttribute('data-i18n-title');
    if (key) {
      element.title = t(key);
    }
  });
  
  // Handle placeholder attributes separately
  const placeholderElements = root.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key && element.placeholder !== undefined) {
      element.placeholder = t(key);
    }
  });
}

/**
 * Initialize i18n system
 * @returns {Promise<void>}
 */
export async function initI18n() {
  await loadLanguage();
  translateElements();
}
