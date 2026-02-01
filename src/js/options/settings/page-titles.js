// Page Titles - load/save page title settings
import { showSuccessToast } from '../../common/toast.js';
import { t } from '../../common/i18n.js';

let elements = null;

export function initPageTitles(elementsRef) {
  elements = elementsRef;
}

export function loadPageTitles() {
  chrome.storage.sync.get(['pageTitles'], (result) => {
    const pageTitles = result.pageTitles || {
      local: '',
      staging: '',
      production: ''
    };

    elements.pageTitleLocal.value = pageTitles.local || '';
    elements.pageTitleStaging.value = pageTitles.staging || '';
    elements.pageTitleProduction.value = pageTitles.production || '';
  });
}

export function savePageTitles() {
  const pageTitles = {
    local: elements.pageTitleLocal.value.trim() || '',
    staging: elements.pageTitleStaging.value.trim() || '',
    production: elements.pageTitleProduction.value.trim() || ''
  };

  chrome.storage.sync.set({ pageTitles }, () => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updatePageTitles',
          pageTitles: pageTitles
        }).catch(() => {});
      });
    });
    showSuccessToast(t('message.pageTitlesSaved'));
  });
}
