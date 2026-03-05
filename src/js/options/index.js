// Options page - core logic and orchestration
import '../../sass/options.scss';
import { initI18n, t, saveLanguage, loadLanguage, translateElements } from '../common/i18n.js';
import Coloris from '@melloware/coloris';
import '@melloware/coloris/dist/coloris.css';
import { initProjects, loadProjects, getEditingProjectId, setupProjectEventListeners } from './projects.js';
import {
  initSettings,
  loadSettings,
  loadPageTitles,
  loadKeyboardShortcuts,
  loadCopyToClipboardFormat,
  loadBannerCustomization,
  updateBannerPreview,
  updateWikipediaIframeUrl,
  setupKeyboardShortcutInputs,
  setupSettingsEventListeners
} from './settings/index.js';
import { checkForUpdates } from '../common/update-check.js';

// DOM elements
const elements = {
  localText: document.getElementById('local-text'),
  localColor: document.getElementById('local-color'),
  stagingText: document.getElementById('staging-text'),
  stagingColor: document.getElementById('staging-color'),
  productionText: document.getElementById('production-text'),
  productionColor: document.getElementById('production-color'),
  saveSettingsBtn: document.getElementById('save-settings'),
  pageTitleLocal: document.getElementById('page-title-local'),
  pageTitleStaging: document.getElementById('page-title-staging'),
  pageTitleProduction: document.getElementById('page-title-production'),
  savePageTitlesBtn: document.getElementById('save-page-titles'),
  shortcutLocal: document.getElementById('shortcut-local'),
  shortcutStaging: document.getElementById('shortcut-staging'),
  shortcutProduction: document.getElementById('shortcut-production'),
  saveShortcutsBtn: document.getElementById('save-shortcuts'),
  copyToClipboardFormat: document.getElementById('copy-to-clipboard-format'),
  saveCopyToClipboardBtn: document.getElementById('save-copy-to-clipboard'),
  addProjectBtn: document.getElementById('add-project'),
  projectsList: document.getElementById('projects-list'),
  exportSettingsBtn: document.getElementById('export-settings'),
  importSettingsBtn: document.getElementById('import-settings'),
  importFileInput: document.getElementById('import-file'),
  navProjects: document.getElementById('nav-projects'),
  navSettings: document.getElementById('nav-settings'),
  pageProjects: document.getElementById('page-projects'),
  pageSettings: document.getElementById('page-settings'),
  modal: document.getElementById('project-modal'),
  modalTitle: document.getElementById('modal-title'),
  projectForm: document.getElementById('project-form'),
  projectName: document.getElementById('project-name'),
  projectLocal: document.getElementById('project-local'),
  projectStaging: document.getElementById('project-staging'),
  projectProduction: document.getElementById('project-production'),
  cancelProject: document.getElementById('cancel-project'),
  protocolBtns: document.querySelectorAll('.protocol-btn'),
  languageSelect: document.getElementById('language-select'),
  bannerFontSize: document.getElementById('banner-font-size'),
  bannerFontSizeValue: document.getElementById('banner-font-size-value'),
  bannerPosition: document.getElementById('banner-position'),
  bannerOpacity: document.getElementById('banner-opacity'),
  bannerOpacityValue: document.getElementById('banner-opacity-value'),
  bannerBlur: document.getElementById('banner-blur'),
  bannerBlurValue: document.getElementById('banner-blur-value'),
  bannerHeight: document.getElementById('banner-height'),
  bannerHeightValue: document.getElementById('banner-height-value'),
  bannerPreview: document.getElementById('banner-preview'),
  previewTabs: document.querySelectorAll('.preview-tab'),
  bannerPreviewIframe: document.getElementById('banner-preview-iframe'),
  bannerPreviewRefreshBtn: document.getElementById('banner-preview-refresh')
};

async function init() {
  await initI18n();

  initColoris();
  setupLanguageSelector();

  initProjects(elements);
  initSettings(elements);

  requestAnimationFrame(() => {
    loadSettings();
    loadBannerCustomization();
    setTimeout(() => {
      updateBannerPreview();
      updateWikipediaIframeUrl();
    }, 100);
  });

  loadPageTitles();
  loadProjects();
  loadKeyboardShortcuts();
  loadCopyToClipboardFormat();
  setupProjectEventListeners();
  setupKeyboardShortcutInputs();
  setupSettingsEventListeners();
  setupNavigation();
  loadPageFromHash();

  window.addEventListener('hashchange', loadPageFromHash);
  displayVersion();
  checkAndShowUpdateBanner();
}

async function checkAndShowUpdateBanner() {
  const updateBanner = document.getElementById('update-banner');
  const downloadLink = document.getElementById('update-download-link');
  const releasesLink = document.getElementById('update-releases-link');
  if (!updateBanner || !downloadLink || !releasesLink) return;

  const result = await checkForUpdates();
  if (result.updateAvailable && result.htmlUrl) {
    releasesLink.href = result.htmlUrl;
    if (result.downloadUrl) {
      downloadLink.href = result.downloadUrl;
      downloadLink.removeAttribute('aria-disabled');
      downloadLink.classList.remove('update-banner-link--disabled');
    } else {
      downloadLink.removeAttribute('href');
      downloadLink.setAttribute('aria-disabled', 'true');
      downloadLink.classList.add('update-banner-link--disabled');
    }
    updateBanner.style.display = '';
  }
}

function displayVersion() {
  const versionInfo = document.getElementById('version-info');
  if (versionInfo) {
    const manifest = chrome.runtime.getManifest();
    let versionText = `torchlight ver.${manifest.version}`;
    versionText += `\n${navigator.userAgent}`;
    versionInfo.textContent = versionText;
  }
}

function initColoris() {
  Coloris.init();
  Coloris({
    el: '[data-coloris]',
    theme: 'polaroid',
    themeMode: 'light',
    format: 'hex',
    formatToggle: false,
    margin: 4,
    alpha: false,
    clearButton: false,
    clearLabel: 'Clear',
    swatchesOnly: false,
    selectInput: true,
    wrap: true,
    rtl: false,
    focusInput: true,
    selectInput: true
  });
}

async function setupLanguageSelector() {
  if (!elements.languageSelect) return;

  const currentLang = await loadLanguage();
  elements.languageSelect.value = currentLang;

  const options = elements.languageSelect.querySelectorAll('option');
  options.forEach(option => {
    const key = option.getAttribute('data-i18n');
    if (key) {
      option.textContent = t(key);
    }
  });

  const label = elements.languageSelect.previousElementSibling;
  if (label && label.tagName === 'LABEL') {
    const labelKey = label.getAttribute('data-i18n');
    if (labelKey) {
      label.textContent = t(labelKey);
    }
  }

  elements.languageSelect.addEventListener('change', async (e) => {
    const newLang = e.target.value;
    await saveLanguage(newLang);
    translateElements();
    retranslateDynamicContent();
    updateWikipediaIframeUrl();
  });
}

function retranslateDynamicContent() {
  const editingProjectId = getEditingProjectId();
  if (editingProjectId) {
    elements.modalTitle.textContent = t('modal.project.edit');
  } else {
    elements.modalTitle.textContent = t('modal.project.add');
  }

  const modal = document.getElementById('project-modal');
  if (modal && modal.classList.contains('is-open')) {
    translateElements(modal);
  }

  setupLanguageSelector();
  loadProjects();
}

function setupNavigation() {
  if (elements.navProjects) {
    elements.navProjects.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('projects');
    });
  }

  if (elements.navSettings) {
    elements.navSettings.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('settings');
    });
  }
}

function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.classList.remove('active');
  });

  const navItems = document.querySelectorAll('.sidebar-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });

  let targetPage = null;
  let targetNav = null;

  if (pageId === 'projects') {
    targetPage = elements.pageProjects;
    targetNav = elements.navProjects;
    loadProjects();
  } else if (pageId === 'settings') {
    targetPage = elements.pageSettings;
    targetNav = elements.navSettings;
  }

  if (targetPage) {
    targetPage.classList.add('active');
  }
  if (targetNav) {
    targetNav.classList.add('active');
  }

  window.location.hash = pageId;
}

function loadPageFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'projects' || hash === 'settings') {
    showPage(hash);
  } else {
    showPage('projects');
  }
}

init();
