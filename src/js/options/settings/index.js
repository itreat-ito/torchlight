// Settings - core logic, Export/Import, event wiring
import { showSuccessToast, showErrorToast } from '../../common/toast.js';
import { showConfirmModal } from '../../confirm-modal.js';
import { t } from '../../common/i18n.js';
import { loadProjects } from '../projects.js';
import {
  initBanner,
  loadSettings,
  saveSettings,
  loadBannerCustomization,
  updateBannerPreview,
  updateSliderTrackFill,
  updateWikipediaIframeUrl,
  setupPreviewTabs,
  setupBannerPreviewUpdates,
  getCurrentPreviewEnv
} from './banner.js';
import { initPageTitles, loadPageTitles, savePageTitles } from './page-titles.js';
import {
  initUrlSwitching,
  loadKeyboardShortcuts,
  saveKeyboardShortcuts,
  setupKeyboardShortcutInputs
} from './url-switching.js';
import {
  initCopyToClipboard,
  loadCopyToClipboardFormat,
  saveCopyToClipboardFormat,
  setupCopyToClipboardEventListeners
} from './copy-to-clipboard.js';

let elements = null;

export function initSettings(elementsRef) {
  elements = elementsRef;
  initBanner(elements);
  initPageTitles(elements);
  initUrlSwitching(elements);
  initCopyToClipboard(elements);
}

export { getCurrentPreviewEnv } from './banner.js';
export { loadSettings, saveSettings, loadBannerCustomization, updateBannerPreview, updateWikipediaIframeUrl } from './banner.js';
export { loadPageTitles, savePageTitles } from './page-titles.js';
export { loadKeyboardShortcuts, saveKeyboardShortcuts, setupKeyboardShortcutInputs } from './url-switching.js';
export { loadCopyToClipboardFormat, saveCopyToClipboardFormat, setupCopyToClipboardEventListeners } from './copy-to-clipboard.js';

export function exportSettings() {
  chrome.storage.sync.get(['bannerAppearance', 'projects', 'keyboardShortcuts', 'pageTitles', 'copyToClipboardFormat'], (result) => {
    const defaultBannerAppearance = {
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

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      bannerAppearance: result.bannerAppearance || defaultBannerAppearance,
      projects: result.projects || [],
      keyboardShortcuts: result.keyboardShortcuts || {
        local: 'Ctrl+Shift+1',
        staging: 'Ctrl+Shift+2',
        production: 'Ctrl+Shift+3'
      },
      pageTitles: result.pageTitles || {
        local: '',
        staging: '',
        production: ''
      },
      copyToClipboardFormat: result.copyToClipboardFormat || '{{title}}\n{{url}}'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const filename = `torchlight-settings-${date}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccessToast(t('message.settingsExported'));
  });
}

export function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importData = JSON.parse(event.target.result);
      importSettings(importData);
    } catch (error) {
      showErrorToast(t('message.invalidJson'));
      console.error('Import error:', error);
    }
  };
  reader.readAsText(file);

  e.target.value = '';
}

export async function importSettings(importData) {
  if (!validateImportData(importData)) {
    showErrorToast(t('message.invalidSettings'));
    return;
  }

  const confirmed = await showConfirmModal(
    t('message.confirmImport'),
    t('message.confirmImportTitle')
  );

  if (!confirmed) {
    return;
  }

  const defaultBannerAppearance = {
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

  const bannerAppearance = importData.bannerAppearance || defaultBannerAppearance;
  const projects = importData.projects || [];
  const keyboardShortcuts = importData.keyboardShortcuts || {
    local: 'Ctrl+Shift+1',
    staging: 'Ctrl+Shift+2',
    production: 'Ctrl+Shift+3'
  };
  const pageTitles = importData.pageTitles || {
    local: '',
    staging: '',
    production: ''
  };
  const copyToClipboardFormat = importData.copyToClipboardFormat ?? '{{title}}\n{{url}}';

  chrome.storage.sync.set({ bannerAppearance, projects, keyboardShortcuts, pageTitles, copyToClipboardFormat }, () => {
    loadSettings();
    loadPageTitles();
    loadProjects();
    loadKeyboardShortcuts();
    loadCopyToClipboardFormat();
    loadBannerCustomization();
    showSuccessToast(t('message.settingsImported'));
  });
}

export function validateImportData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (data.bannerAppearance) {
    const settings = data.bannerAppearance;
    if (!settings.local || !settings.staging || !settings.production) {
      return false;
    }
    if (!settings.local.text || !settings.local.color ||
        !settings.staging.text || !settings.staging.color ||
        !settings.production.text || !settings.production.color) {
      return false;
    }
  }

  if (data.projects && !Array.isArray(data.projects)) {
    return false;
  }

  return true;
}

export function setupSettingsEventListeners() {
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.savePageTitlesBtn.addEventListener('click', savePageTitles);
  elements.saveShortcutsBtn.addEventListener('click', saveKeyboardShortcuts);

  if (elements.bannerFontSize) {
    updateSliderTrackFill(elements.bannerFontSize);
    elements.bannerFontSize.addEventListener('input', (e) => {
      if (elements.bannerFontSizeValue) {
        elements.bannerFontSizeValue.textContent = e.target.value + 'px';
      }
      updateSliderTrackFill(e.target);
    });
  }

  if (elements.bannerOpacity) {
    updateSliderTrackFill(elements.bannerOpacity);
    elements.bannerOpacity.addEventListener('input', (e) => {
      if (elements.bannerOpacityValue) {
        elements.bannerOpacityValue.textContent = e.target.value + '%';
      }
      updateSliderTrackFill(e.target);
    });
  }

  if (elements.bannerBlur) {
    updateSliderTrackFill(elements.bannerBlur);
    elements.bannerBlur.addEventListener('input', (e) => {
      if (elements.bannerBlurValue) {
        elements.bannerBlurValue.textContent = e.target.value + 'px';
      }
      updateSliderTrackFill(e.target);
    });
  }

  if (elements.bannerHeight) {
    updateSliderTrackFill(elements.bannerHeight);
    elements.bannerHeight.addEventListener('input', (e) => {
      if (elements.bannerHeightValue) {
        elements.bannerHeightValue.textContent = e.target.value + 'px';
      }
      updateSliderTrackFill(e.target);
    });
  }

  elements.exportSettingsBtn.addEventListener('click', exportSettings);
  elements.importSettingsBtn.addEventListener('click', () => elements.importFileInput.click());
  elements.importFileInput.addEventListener('change', handleImportFile);

  setupCopyToClipboardEventListeners();

  setupPreviewTabs();
  setupBannerPreviewUpdates();
}
