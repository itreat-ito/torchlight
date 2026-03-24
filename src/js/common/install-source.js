/**
 * Chrome Web Store 経由でインストールされた拡張機能に付与される update URL。
 * @see https://developer.chrome.com/docs/extensions/reference/api/management#property-ExtensionInfo-updateUrl
 */
export const CHROME_WEB_STORE_UPDATE_URL =
  'https://clients2.google.com/service/update2/crx';

/**
 * Returns true when the extension receives updates from the Chrome Web Store.
 * Uses chrome.management.getSelf() when available; otherwise falls back to
 * chrome.runtime.getManifest().update_url (needed in content scripts).
 *
 * chrome.management.getSelf() does not require the "management" permission.
 */
export async function isInstalledFromChromeWebStore() {
  try {
    if (typeof chrome.management?.getSelf === 'function') {
      const info = await chrome.management.getSelf();
      if (typeof info.updateUrl === 'string') {
        return info.updateUrl === CHROME_WEB_STORE_UPDATE_URL;
      }
    }
  } catch {
    // Content scripts and some contexts may not expose management API.
  }

  const manifest = chrome.runtime.getManifest();
  return manifest.update_url === CHROME_WEB_STORE_UPDATE_URL;
}
