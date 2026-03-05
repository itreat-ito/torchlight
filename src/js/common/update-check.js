// Update check utility for GitHub Releases
// Checks for new versions and provides download/release page URLs

const GITHUB_API_URL = 'https://api.github.com/repos/itreat-ito/torchlight/releases/latest';
const RELEASES_PAGE_URL = 'https://github.com/itreat-ito/torchlight/releases/latest';
const CACHE_KEY = 'updateCheck';
const SKIPPED_VERSION_KEY = 'updateSkippedVersion';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the skipped version from storage
 * @returns {Promise<string|null>}
 */
function getSkippedVersion() {
  return new Promise((resolve) => {
    chrome.storage.local.get([SKIPPED_VERSION_KEY], (result) => {
      resolve(result[SKIPPED_VERSION_KEY] || null);
    });
  });
}

/**
 * Skip the current version and hide the banner until the next version is released
 * @param {string} version - Version to skip (e.g. "v1.5.0")
 */
export function skipVersion(version) {
  if (!version) return;
  chrome.storage.local.set({ [SKIPPED_VERSION_KEY]: version });
}

/**
 * Parse version string (handles "v1.4.1" format)
 * @param {string} versionStr - Version string (e.g. "1.4.1" or "v1.4.1")
 * @returns {number[]} Array of version parts for comparison
 */
function parseVersion(versionStr) {
  if (!versionStr || typeof versionStr !== 'string') {
    return [0, 0, 0];
  }
  const cleaned = versionStr.replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map((p) => parseInt(p, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/**
 * Compare two version strings (semantic versioning)
 * @param {string} current - Current version
 * @param {string} latest - Latest version from API
 * @returns {number} Positive if latest > current, 0 if equal, negative if latest < current
 */
export function compareVersions(current, latest) {
  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return 1;
    if (latestParts[i] < currentParts[i]) return -1;
  }
  return 0;
}

/**
 * Get cached update info from storage
 * @returns {Promise<{version: string, downloadUrl: string, htmlUrl: string} | null>}
 */
function getCachedUpdateInfo() {
  return new Promise((resolve) => {
    chrome.storage.local.get([CACHE_KEY], (result) => {
      const cached = result[CACHE_KEY];
      if (!cached) {
        resolve(null);
        return;
      }
      const age = Date.now() - (cached.timestamp || 0);
      if (age > CACHE_DURATION_MS) {
        resolve(null);
        return;
      }
      resolve(cached);
    });
  });
}

/**
 * Save update info to cache
 * @param {Object} info - Update info to cache
 */
function setCachedUpdateInfo(info) {
  chrome.storage.local.set({
    [CACHE_KEY]: {
      ...info,
      timestamp: Date.now(),
    },
  });
}

/**
 * Fetch latest release info from GitHub API
 * @returns {Promise<{version: string, downloadUrl: string, htmlUrl: string} | null>}
 */
async function fetchLatestRelease() {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const tagName = data.tag_name || '';
    const htmlUrl = data.html_url || RELEASES_PAGE_URL;

    // Find zip asset for direct download
    let downloadUrl = null;
    const assets = data.assets || [];
    const zipAsset = assets.find((a) => a.name && a.name.endsWith('.zip'));
    if (zipAsset && zipAsset.browser_download_url) {
      downloadUrl = zipAsset.browser_download_url;
    }

    return {
      version: tagName,
      downloadUrl,
      htmlUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Check for updates. Uses cache if valid, otherwise fetches from API.
 * @returns {Promise<{updateAvailable: boolean, version?: string, downloadUrl?: string, htmlUrl?: string}>}
 */
export async function checkForUpdates() {
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version || '0.0.0';

  // Try cache first
  const cached = await getCachedUpdateInfo();
  if (cached) {
    const isNewer = compareVersions(currentVersion, cached.version) > 0;
    const skippedVersion = await getSkippedVersion();
    const isSkipped = skippedVersion && cached.version === skippedVersion;
    return {
      updateAvailable: isNewer && !isSkipped,
      version: cached.version,
      downloadUrl: cached.downloadUrl,
      htmlUrl: cached.htmlUrl,
    };
  }

  // Fetch from API
  const latest = await fetchLatestRelease();
  if (latest) {
    setCachedUpdateInfo(latest);
    const isNewer = compareVersions(currentVersion, latest.version) > 0;
    const skippedVersion = await getSkippedVersion();
    const isSkipped = skippedVersion && latest.version === skippedVersion;
    return {
      updateAvailable: isNewer && !isSkipped,
      version: latest.version,
      downloadUrl: latest.downloadUrl,
      htmlUrl: latest.htmlUrl,
    };
  }

  return { updateAvailable: false };
}
