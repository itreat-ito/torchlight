// Copy to Clipboard - format template and save/load
import { showSuccessToast } from '../../common/toast.js';
import { t } from '../../common/i18n.js';

const STORAGE_KEY = 'copyToClipboardFormat';
const DEFAULT_FORMAT = '{{title}}\n{{url}}';

let elements = null;

export function initCopyToClipboard(elementsRef) {
  elements = elementsRef;
}

export function loadCopyToClipboardFormat() {
  if (!elements?.copyToClipboardFormat) return;

  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    elements.copyToClipboardFormat.value = result[STORAGE_KEY] ?? DEFAULT_FORMAT;
  });
}

export function saveCopyToClipboardFormat() {
  if (!elements?.copyToClipboardFormat) return;

  const format = elements.copyToClipboardFormat.value.trim() || DEFAULT_FORMAT;

  chrome.storage.sync.set({ [STORAGE_KEY]: format }, () => {
    showSuccessToast(t('message.copyToClipboardSaved'));
  });
}

export function setupCopyToClipboardEventListeners() {
  if (!elements?.saveCopyToClipboardBtn) return;

  elements.saveCopyToClipboardBtn.addEventListener('click', saveCopyToClipboardFormat);
}
