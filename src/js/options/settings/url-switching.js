// URL Switching - keyboard shortcuts for environment switching
import { showSuccessToast } from '../../common/toast.js';
import { getKeyCombination, normalizeShortcut } from '../../common/keyboard.js';
import { t } from '../../common/i18n.js';

let elements = null;

export function initUrlSwitching(elementsRef) {
  elements = elementsRef;
}

export function loadKeyboardShortcuts() {
  chrome.storage.sync.get(['keyboardShortcuts'], (result) => {
    const shortcuts = result.keyboardShortcuts || {
      local: 'Ctrl+Shift+1',
      staging: 'Ctrl+Shift+2',
      production: 'Ctrl+Shift+3'
    };

    elements.shortcutLocal.value = shortcuts.local || 'Ctrl+Shift+1';
    elements.shortcutStaging.value = shortcuts.staging || 'Ctrl+Shift+2';
    elements.shortcutProduction.value = shortcuts.production || 'Ctrl+Shift+3';
  });
}

export function saveKeyboardShortcuts() {
  const shortcuts = {
    local: normalizeShortcut(elements.shortcutLocal.value) || 'Ctrl+Shift+1',
    staging: normalizeShortcut(elements.shortcutStaging.value) || 'Ctrl+Shift+2',
    production: normalizeShortcut(elements.shortcutProduction.value) || 'Ctrl+Shift+3'
  };

  chrome.storage.sync.set({ keyboardShortcuts: shortcuts }, () => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateKeyboardShortcuts',
          shortcuts: shortcuts
        }).catch(() => {});
      });
    });
    showSuccessToast(t('message.urlSwitchingSaved'));
  });
}

export function setupKeyboardShortcutInputs() {
  const shortcutInputs = [
    { element: elements.shortcutLocal, env: 'local' },
    { element: elements.shortcutStaging, env: 'staging' },
    { element: elements.shortcutProduction, env: 'production' }
  ];

  shortcutInputs.forEach(({ element, env }) => {
    let isCapturing = false;

    element.addEventListener('focus', () => {
      isCapturing = true;
      element.value = '';
      element.placeholder = t('placeholder.shortcut');
      element.style.backgroundColor = '#fff3cd';
    });

    element.addEventListener('blur', () => {
      isCapturing = false;
      element.style.backgroundColor = '';

      if (!element.value.trim()) {
        const defaults = {
          local: 'Ctrl+Shift+1',
          staging: 'Ctrl+Shift+2',
          production: 'Ctrl+Shift+3'
        };
        element.value = defaults[env];
      }

      element.placeholder = `Ctrl+Shift+${env === 'local' ? '1' : env === 'staging' ? '2' : '3'}`;
    });

    element.addEventListener('keydown', (e) => {
      if (!isCapturing) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      const combination = getKeyCombination(e);
      if (combination) {
        element.value = combination;
        element.blur();
      }
    });

    element.addEventListener('keyup', (e) => {
      if (!isCapturing) {
        return;
      }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }
    });
  });
}
