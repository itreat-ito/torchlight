// Options page logic
import '../sass/options.scss';
import { showSuccessToast, showErrorToast } from './toast.js';
import { showConfirmModal } from './confirm-modal.js';
import MicroModal from 'micromodal';
import { getKeyCombination, normalizeShortcut } from './common/keyboard.js';
import { initI18n, t, saveLanguage, loadLanguage, translateElements } from './common/i18n.js';
import Coloris from '@melloware/coloris';
import '@melloware/coloris/dist/coloris.css';
import Sortable from 'sortablejs';

(function() {
  'use strict';

  // DOM elements
  const elements = {
    // Common settings
    localText: document.getElementById('local-text'),
    localColor: document.getElementById('local-color'),
    stagingText: document.getElementById('staging-text'),
    stagingColor: document.getElementById('staging-color'),
    productionText: document.getElementById('production-text'),
    productionColor: document.getElementById('production-color'),
    saveSettingsBtn: document.getElementById('save-settings'),

    // Page titles
    pageTitleLocal: document.getElementById('page-title-local'),
    pageTitleStaging: document.getElementById('page-title-staging'),
    pageTitleProduction: document.getElementById('page-title-production'),
    savePageTitlesBtn: document.getElementById('save-page-titles'),

    // Keyboard shortcuts
    shortcutLocal: document.getElementById('shortcut-local'),
    shortcutStaging: document.getElementById('shortcut-staging'),
    shortcutProduction: document.getElementById('shortcut-production'),
    saveShortcutsBtn: document.getElementById('save-shortcuts'),

    // Project management
    addProjectBtn: document.getElementById('add-project'),
    projectsList: document.getElementById('projects-list'),

    // Data management
    exportSettingsBtn: document.getElementById('export-settings'),
    importSettingsBtn: document.getElementById('import-settings'),
    importFileInput: document.getElementById('import-file'),

    // Keyboard shortcuts
    shortcutLocal: document.getElementById('shortcut-local'),
    shortcutStaging: document.getElementById('shortcut-staging'),
    shortcutProduction: document.getElementById('shortcut-production'),

    // Navigation
    navProjects: document.getElementById('nav-projects'),
    navSettings: document.getElementById('nav-settings'),
    pageProjects: document.getElementById('page-projects'),
    pageSettings: document.getElementById('page-settings'),

    // Modal
    modal: document.getElementById('project-modal'),
    modalTitle: document.getElementById('modal-title'),
    projectForm: document.getElementById('project-form'),
    projectName: document.getElementById('project-name'),
    projectLocal: document.getElementById('project-local'),
    projectStaging: document.getElementById('project-staging'),
    projectProduction: document.getElementById('project-production'),
    cancelProject: document.getElementById('cancel-project'),
    
    // Protocol toggle buttons
    protocolBtns: document.querySelectorAll('.protocol-btn'),
    
    // Language selector
    languageSelect: document.getElementById('language-select'),

    // Banner customization
    bannerFontSize: document.getElementById('banner-font-size'),
    bannerFontSizeValue: document.getElementById('banner-font-size-value'),
    bannerPosition: document.getElementById('banner-position'),
    bannerOpacity: document.getElementById('banner-opacity'),
    bannerOpacityValue: document.getElementById('banner-opacity-value'),
    bannerBlur: document.getElementById('banner-blur'),
    bannerBlurValue: document.getElementById('banner-blur-value'),
    bannerHeight: document.getElementById('banner-height'),
    bannerHeightValue: document.getElementById('banner-height-value')
  };

  // Initialize
  async function init() {
    // Initialize i18n first
    await initI18n();
    
    // Initialize Coloris
    initColoris();

    // Setup language selector
    setupLanguageSelector();
    
    // Colorisの初期化が完了してDOM構造が変更された後に設定を読み込む
    // requestAnimationFrameを使用して、次のフレームで実行することで確実に反映される
    requestAnimationFrame(() => {
      loadSettings();
    });
    
    loadPageTitles();
    loadProjects();
    loadKeyboardShortcuts();
    loadBannerCustomization();
    setupEventListeners();
    setupProjectModalHandlers();
    setupKeyboardShortcutInputs();
    setupNavigation();
    // URLハッシュからページを読み込む、またはデフォルトでYour Projectsページを表示
    loadPageFromHash();

    // ハッシュ変更イベントをリッスン
    window.addEventListener('hashchange', loadPageFromHash);

    // バージョン番号を表示
    displayVersion();
  }

  // バージョン番号を表示
  function displayVersion() {
    const versionInfo = document.getElementById('version-info');
    if (versionInfo) {
      const manifest = chrome.runtime.getManifest();
      let versionText = `torchlight ver.${manifest.version}`;
      versionText += `\n${navigator.userAgent}`;
      versionInfo.textContent = versionText;
    }
  }

  let editingProjectId = null;
  let sortableInstance = null;

  // Function to close project modal with animation
  const closeProjectModalWithAnimation = (callback) => {
    const modalElement = document.getElementById('project-modal');
    if (modalElement && modalElement.classList.contains('is-open')) {
      // Add closing class to trigger animation
      modalElement.classList.add('is-closing');
      
      // Wait for animation to complete before actually closing
      setTimeout(() => {
        MicroModal.close('project-modal');
        modalElement.classList.remove('is-closing');
        editingProjectId = null;
        elements.projectForm.reset();
        // Execute callback after modal is closed
        if (callback && typeof callback === 'function') {
          callback();
        }
      }, 200);
    } else {
      editingProjectId = null;
      elements.projectForm.reset();
      // Execute callback immediately if modal is not open
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  };

  // Initialize Micromodal for project modal
  MicroModal.init({
    onShow: (modal) => {
      // Focus on first input when modal opens
      const firstInput = modal.querySelector('#project-name');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    },
    onClose: (modal) => {
      // Remove closing class if it exists
      const modalElement = document.getElementById('project-modal');
      if (modalElement) {
        modalElement.classList.remove('is-closing');
      }
      // Clean up event listeners
      if (modal._cleanupProjectModal) {
        modal._cleanupProjectModal();
        delete modal._cleanupProjectModal;
      }
      // Reset form and editing state when modal closes
      editingProjectId = null;
      elements.projectForm.reset();
    },
    openTrigger: 'data-micromodal-trigger',
    closeTrigger: 'data-micromodal-close',
    disableScroll: true,
    disableFocus: false,
    awaitOpenAnimation: false,
    awaitCloseAnimation: false,
  });

  // Set up event handlers for project modal close buttons
  function setupProjectModalHandlers() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const overlay = modal.querySelector('.modal__overlay');
    const closeButtons = modal.querySelectorAll('[data-micromodal-close]');

    // Handle overlay click
    const handleOverlayClick = (e) => {
      if (e.target === overlay) {
        e.preventDefault();
        e.stopPropagation();
        closeProjectModalWithAnimation();
      }
    };

    // Handle close buttons (except overlay)
    const handleCloseButton = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeProjectModalWithAnimation();
    };

    overlay.onclick = handleOverlayClick;
    closeButtons.forEach(btn => {
      if (btn !== overlay) {
        btn.onclick = handleCloseButton;
      }
    });

    // Handle ESC key
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        e.preventDefault();
        e.stopPropagation();
        closeProjectModalWithAnimation();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    // Store cleanup function
    modal._cleanupProjectModal = () => {
      document.removeEventListener('keydown', handleEscKey);
      overlay.onclick = null;
      closeButtons.forEach(btn => {
        btn.onclick = null;
      });
    };
  }

  // Initialize Coloris
  function initColoris() {
    Coloris.init();
    
    // Configure Coloris options
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
  
  // Setup language selector
  async function setupLanguageSelector() {
    if (!elements.languageSelect) return;
    
    // Load current language and set selector value
    const currentLang = await loadLanguage();
    elements.languageSelect.value = currentLang;
    
    // Translate language selector options
    const options = elements.languageSelect.querySelectorAll('option');
    options.forEach(option => {
      const key = option.getAttribute('data-i18n');
      if (key) {
        option.textContent = t(key);
      }
    });
    
    // Translate label
    const label = elements.languageSelect.previousElementSibling;
    if (label && label.tagName === 'LABEL') {
      const labelKey = label.getAttribute('data-i18n');
      if (labelKey) {
        label.textContent = t(labelKey);
      }
    }
    
    // Add change event listener
    elements.languageSelect.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      await saveLanguage(newLang);
      // Retranslate all elements
      translateElements();
      // Retranslate dynamic content
      retranslateDynamicContent();
    });
  }
  
  // Retranslate dynamic content that was set by JavaScript
  function retranslateDynamicContent() {
    // Retranslate modal title if modal is open
    if (editingProjectId) {
      elements.modalTitle.textContent = t('modal.project.edit');
    } else {
      elements.modalTitle.textContent = t('modal.project.add');
    }
    
    // Retranslate modal content if modal is open
    const modal = document.getElementById('project-modal');
    if (modal && modal.classList.contains('is-open')) {
      translateElements(modal);
    }
    
    // Retranslate language selector
    setupLanguageSelector();
    
    // Retranslate projects list
    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      renderProjects(projects);
    });
  }

  // Update slider track fill (left side of thumb)
  function updateSliderTrackFill(slider) {
    if (!slider) return;
    
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const value = parseFloat(slider.value) || min;
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Use linear-gradient to fill left side with primary color
    slider.style.background = `linear-gradient(to right, #4476e2 ${percentage}%, #ddd ${percentage}%)`;
  }

  // Setup event listeners
  function setupEventListeners() {
    // Save common settings
    elements.saveSettingsBtn.addEventListener('click', saveSettings);

    // Save page titles
    elements.savePageTitlesBtn.addEventListener('click', savePageTitles);

    // Save keyboard shortcuts
    elements.saveShortcutsBtn.addEventListener('click', saveKeyboardShortcuts);

    // Save banner customization (now handled by saveSettings)

    // Update slider values in real-time and track fill
    if (elements.bannerFontSize) {
      // Initialize track fill
      updateSliderTrackFill(elements.bannerFontSize);
      
      elements.bannerFontSize.addEventListener('input', (e) => {
        if (elements.bannerFontSizeValue) {
          elements.bannerFontSizeValue.textContent = e.target.value + 'px';
        }
        updateSliderTrackFill(e.target);
      });
    }

    if (elements.bannerOpacity) {
      // Initialize track fill
      updateSliderTrackFill(elements.bannerOpacity);
      
      elements.bannerOpacity.addEventListener('input', (e) => {
        if (elements.bannerOpacityValue) {
          elements.bannerOpacityValue.textContent = e.target.value + '%';
        }
        updateSliderTrackFill(e.target);
      });
    }

    if (elements.bannerBlur) {
      // Initialize track fill
      updateSliderTrackFill(elements.bannerBlur);
      
      elements.bannerBlur.addEventListener('input', (e) => {
        if (elements.bannerBlurValue) {
          elements.bannerBlurValue.textContent = e.target.value + 'px';
        }
        updateSliderTrackFill(e.target);
      });
    }

    if (elements.bannerHeight) {
      // Initialize track fill
      updateSliderTrackFill(elements.bannerHeight);
      
      elements.bannerHeight.addEventListener('input', (e) => {
        if (elements.bannerHeightValue) {
          elements.bannerHeightValue.textContent = e.target.value + 'px';
        }
        updateSliderTrackFill(e.target);
      });
    }

    // Add project
    elements.addProjectBtn.addEventListener('click', () => openProjectModal());

    // Data management
    elements.exportSettingsBtn.addEventListener('click', exportSettings);
    elements.importSettingsBtn.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', handleImportFile);

    // Project form submission
    elements.projectForm.addEventListener('submit', handleProjectSubmit);

    // Protocol toggle buttons
    setupProtocolToggle();
  }

  // Setup protocol toggle buttons
  function setupProtocolToggle() {
    elements.protocolBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const env = e.target.getAttribute('data-env');
        const protocol = e.target.getAttribute('data-protocol');
        
        // Find all buttons for this environment and update active state
        const envBtns = document.querySelectorAll(`.protocol-btn[data-env="${env}"]`);
        envBtns.forEach(b => {
          b.classList.remove('active');
        });
        e.target.classList.add('active');
      });
    });
  }

  // Get selected protocol for an environment
  function getSelectedProtocol(env) {
    const activeBtn = document.querySelector(`.protocol-btn[data-env="${env}"].active`);
    return activeBtn ? activeBtn.getAttribute('data-protocol') : 'https';
  }

  // Set protocol for an environment
  function setProtocol(env, protocol) {
    const envBtns = document.querySelectorAll(`.protocol-btn[data-env="${env}"]`);
    envBtns.forEach(btn => {
      if (btn.getAttribute('data-protocol') === protocol) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Reset all protocols to default (HTTPS)
  function resetProtocols() {
    ['local', 'staging', 'production'].forEach(env => {
      setProtocol(env, 'https');
    });
  }

  // Setup navigation
  function setupNavigation() {
    // サイドバーメニューのクリックイベント
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

  // Show page
  function showPage(pageId) {
    // すべてのページを非表示
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.classList.remove('active');
    });

    // すべてのナビゲーションアイテムからactiveクラスを削除
    const navItems = document.querySelectorAll('.sidebar-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    // 指定されたページを表示
    let targetPage = null;
    let targetNav = null;

    if (pageId === 'projects') {
      targetPage = elements.pageProjects;
      targetNav = elements.navProjects;
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

    // URLハッシュを更新（オプション）
    window.location.hash = pageId;
  }

  // URLハッシュからページを読み込む
  function loadPageFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'projects' || hash === 'settings') {
      showPage(hash);
    } else {
      // デフォルトでYour Projectsページを表示
      showPage('projects');
    }
  }

  // Load common settings
  function loadSettings() {
    chrome.storage.sync.get(['bannerAppearance'], (result) => {
      const settings = result.bannerAppearance || {
        local: { text: 'You\'re on LOCAL env.', color: '#42a4ff' },
        staging: { text: 'You\'re on STAGING env.', color: '#ffc107' },
        production: { text: 'You\'re on PRODUCTION env.', color: '#f44336' }
      };

      elements.localText.value = settings.local.text || 'You\'re on LOCAL env.';
      
      // Colorisが初期化された後のinput要素に値を設定
      // ColorisがDOM構造を変更しているため、値を設定した後にinputイベントを発火してColorisに通知
      if (elements.localColor) {
        elements.localColor.value = settings.local.color || '#42a4ff';
        elements.localColor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      elements.stagingText.value = settings.staging.text || 'You\'re on STAGING env.';
      if (elements.stagingColor) {
        elements.stagingColor.value = settings.staging.color || '#ffc107';
        elements.stagingColor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      elements.productionText.value = settings.production.text || 'You\'re on PRODUCTION env.';
      if (elements.productionColor) {
        elements.productionColor.value = settings.production.color || '#f44336';
        elements.productionColor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }


  // Save common settings (including banner customization)
  function saveSettings() {
    const settings = {
      local: {
        text: elements.localText.value || 'Local Environment',
        color: elements.localColor.value
      },
      staging: {
        text: elements.stagingText.value || 'Staging Environment',
        color: elements.stagingColor.value
      },
      production: {
        text: elements.productionText.value || 'Production Environment',
        color: elements.productionColor.value
      }
    };

    const baseSettings = {
      fontSize: parseInt(elements.bannerFontSize.value) || 18,
      position: elements.bannerPosition.value || 'top',
      opacity: parseInt(elements.bannerOpacity.value) || 100,
      blur: parseInt(elements.bannerBlur.value) || 0,
      height: parseInt(elements.bannerHeight.value) || 40
    };

    const bannerAppearance = {
      ...settings,
      baseSettings: baseSettings
    };

    chrome.storage.sync.set({ bannerAppearance: bannerAppearance }, () => {
      // すべてのタブにメッセージを送信してバナーカスタマイズ設定を更新
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateBannerCustomization',
            customization: baseSettings
          }).catch(() => {
            // メッセージ送信に失敗しても無視（コンテンツスクリプトが読み込まれていないタブなど）
          });
        });
      });
      showSuccessToast(t('message.bannerAppearanceSaved'));
    });
  }

  // Load page titles
  function loadPageTitles() {
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

  // Save page titles
  function savePageTitles() {
    const pageTitles = {
      local: elements.pageTitleLocal.value.trim() || '',
      staging: elements.pageTitleStaging.value.trim() || '',
      production: elements.pageTitleProduction.value.trim() || ''
    };

    chrome.storage.sync.set({ pageTitles }, () => {
      // すべてのタブにメッセージを送信してページタイトル設定を更新
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updatePageTitles',
            pageTitles: pageTitles
          }).catch(() => {
            // メッセージ送信に失敗しても無視（コンテンツスクリプトが読み込まれていないタブなど）
          });
        });
      });
      showSuccessToast(t('message.pageTitlesSaved'));
    });
  }

  // Load projects
  function loadProjects() {
    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      renderProjects(projects);
    });
  }

  // Render projects
  function renderProjects(projects) {
    if (projects.length === 0) {
      // Destroy Sortable instance if exists
      if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
      }
      
      elements.projectsList.innerHTML = `
        <div class="empty-state">
          <p data-i18n="projects.empty.title">No projects found</p>
          <p data-i18n="projects.empty.description">Click "Add Project" button to add a new project</p>
        </div>
      `;
      // Translate the empty state
      translateElements(elements.projectsList);
      return;
    }

    elements.projectsList.innerHTML = projects.map(project => {
      const isEnabled = project.enabled !== false; // デフォルトはtrue
      return `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-header">
          <div class="project-name-wrapper">
            <div class="drag-handle" title="Drag to reorder">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" class="toggle-input" data-project-id="${project.id}" ${isEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <div class="project-name">${escapeHtml(project.name)}</div>
          </div>
          <div class="project-actions">
            <button class="btn btn-edit edit-project" data-project-id="${project.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="btn-icon btn-icon-small"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
              <span data-i18n="projects.edit">Edit</span>
            </button>
            <button class="btn btn-danger delete-project" data-project-id="${project.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon btn-icon-small"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span data-i18n="projects.delete">Delete</span>
            </button>
          </div>
        </div>
        <div class="project-domains-section">
          <div class="project-domains">
            <div class="domain-group">
              <h4 data-i18n="projects.local">Local</h4>
              <div class="domain-list">
                <div class="domain-value">${project.local && project.local.length > 0 && project.local[0] ? escapeHtml(project.local[0]) : `<span style="color: #999;" data-i18n="projects.notSet">Not set</span>`}</div>
              </div>
            </div>
            <div class="domain-group">
              <h4 data-i18n="projects.staging">Staging</h4>
              <div class="domain-list">
                <div class="domain-value">${project.staging && project.staging.length > 0 && project.staging[0] ? escapeHtml(project.staging[0]) : `<span style="color: #999;" data-i18n="projects.notSet">Not set</span>`}</div>
              </div>
            </div>
            <div class="domain-group">
              <h4 data-i18n="projects.production">Production</h4>
              <div class="domain-list">
                <div class="domain-value">${project.production && project.production.length > 0 && project.production[0] ? escapeHtml(project.production[0]) : `<span style="color: #999;" data-i18n="projects.notSet">Not set</span>`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');
    
    // Translate the rendered projects
    translateElements(elements.projectsList);

    // Edit and delete button event listeners
    document.querySelectorAll('.edit-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = e.currentTarget.getAttribute('data-project-id');
        editProject(projectId);
      });
    });

    document.querySelectorAll('.delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = e.currentTarget.getAttribute('data-project-id');
        deleteProject(projectId);
      });
    });

    // Toggle switch event listeners
    document.querySelectorAll('.toggle-input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const projectId = e.target.getAttribute('data-project-id');
        const enabled = e.target.checked;
        toggleProject(projectId, enabled);
      });
    });

    // Initialize Sortable
    initSortable();
  }

  // Initialize Sortable for project list
  function initSortable() {
    // Destroy existing instance if any
    if (sortableInstance) {
      sortableInstance.destroy();
      sortableInstance = null;
    }

    // Only initialize if there are projects
    if (elements.projectsList.children.length === 0) {
      return;
    }

    sortableInstance = new Sortable(elements.projectsList, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: (evt) => {
        saveProjectOrder();
      }
    });
  }

  // Save project order after drag and drop
  function saveProjectOrder() {
    const projectCards = elements.projectsList.querySelectorAll('.project-card');
    const projectIds = Array.from(projectCards).map(card => card.getAttribute('data-project-id'));

    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      
      // Reorder projects array based on DOM order
      const reorderedProjects = projectIds.map(id => {
        return projects.find(p => p.id === id);
      }).filter(p => p !== undefined);

      // Add any projects that might not be in the DOM (shouldn't happen, but safety check)
      projects.forEach(project => {
        if (!reorderedProjects.find(p => p.id === project.id)) {
          reorderedProjects.push(project);
        }
      });

      chrome.storage.sync.set({ projects: reorderedProjects }, () => {
        // Optionally show a success message (commented out to avoid too many toasts)
        // showSuccessToast(t('message.projectOrderSaved'));
      });
    });
  }

  // Open project modal
  function openProjectModal(projectId = null) {
    editingProjectId = projectId;
    elements.modalTitle.textContent = projectId ? t('modal.project.edit') : t('modal.project.add');
    elements.projectForm.reset();
    resetProtocols(); // Reset protocols to default (HTTPS)

    if (projectId) {
      chrome.storage.sync.get(['projects'], (result) => {
        const projects = result.projects || [];
        const project = projects.find(p => p.id === projectId);
        if (project) {
          elements.projectName.value = project.name || '';
          // 単一ドメインとして扱う（配列の最初の要素、または後方互換性のため）
          elements.projectLocal.value = (project.local && project.local.length > 0) ? project.local[0] : '';
          elements.projectStaging.value = (project.staging && project.staging.length > 0) ? project.staging[0] : '';
          elements.projectProduction.value = (project.production && project.production.length > 0) ? project.production[0] : '';
          
          // Set protocols (default to 'https' for backward compatibility)
          setProtocol('local', project.localProtocol || 'https');
          setProtocol('staging', project.stagingProtocol || 'https');
          setProtocol('production', project.productionProtocol || 'https');
        }
      });
    } else {
      // Reset fields for new project
      elements.projectLocal.value = '';
      elements.projectStaging.value = '';
      elements.projectProduction.value = '';
    }

    // Show modal with animation
    MicroModal.show('project-modal');
  }

  // Close project modal
  function closeProjectModal() {
    closeProjectModalWithAnimation();
  }

  // Edit project
  function editProject(projectId) {
    openProjectModal(projectId);
  }

  // Delete project
  async function deleteProject(projectId) {
    const confirmed = await showConfirmModal(
      t('message.confirmDelete'),
      t('message.confirmDeleteTitle')
    );
    
    if (!confirmed) {
      return;
    }

    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      const filtered = projects.filter(p => p.id !== projectId);
      chrome.storage.sync.set({ projects: filtered }, () => {
        loadProjects();
        showSuccessToast(t('message.projectDeleted'));
      });
    });
  }

  // Toggle project enabled/disabled
  function toggleProject(projectId, enabled) {
    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      const project = projects.find(p => p.id === projectId);
      if (project) {
        project.enabled = enabled;
        chrome.storage.sync.set({ projects }, () => {
          // プロジェクトリストを再読み込みせず、状態のみ更新
          // これにより、トグルのちらつきを防ぐ
        });
      }
    });
  }

  // Handle project form submission
  function handleProjectSubmit(e) {
    e.preventDefault();

    const name = elements.projectName.value.trim();
    if (!name) {
      showErrorToast(t('message.enterProjectName'));
      return;
    }

    // 単一ドメインとして取得（配列として保存して後方互換性を保つ）
    const localValue = elements.projectLocal.value.trim();
    const stagingValue = elements.projectStaging.value.trim();
    const productionValue = elements.projectProduction.value.trim();
    
    const local = localValue ? [localValue] : [];
    const staging = stagingValue ? [stagingValue] : [];
    const production = productionValue ? [productionValue] : [];

    // Get selected protocols
    const localProtocol = getSelectedProtocol('local');
    const stagingProtocol = getSelectedProtocol('staging');
    const productionProtocol = getSelectedProtocol('production');

    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];

      if (editingProjectId) {
        // Edit
        const index = projects.findIndex(p => p.id === editingProjectId);
        if (index !== -1) {
          // 既存のenabled状態を保持（デフォルトはtrue）
          const existingProject = projects[index];
          const updatedProject = {
            id: editingProjectId,
            name,
            local,
            staging,
            production,
            localProtocol,
            stagingProtocol,
            productionProtocol,
            enabled: existingProject.enabled !== false // 既存の値があれば保持、なければtrue
          };
          
          projects[index] = updatedProject;
        }
      } else {
        // Add new
        const newProject = {
          id: 'project-' + Date.now(),
          name,
          local,
          staging,
          production,
          localProtocol,
          stagingProtocol,
          productionProtocol,
          enabled: true // 新規プロジェクトはデフォルトで有効
        };
        
        projects.push(newProject);
      }

      chrome.storage.sync.set({ projects }, () => {
        loadProjects();
        const isEditing = !!editingProjectId;
        closeProjectModalWithAnimation(() => {
          // Show success toast after modal is closed
          if (isEditing) {
            showSuccessToast(t('message.projectUpdated'));
          } else {
            showSuccessToast(t('message.projectAdded'));
          }
        });
      });
    });
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export settings
  function exportSettings() {
    chrome.storage.sync.get(['bannerAppearance', 'projects', 'keyboardShortcuts', 'pageTitles'], (result) => {
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
        }
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

  // Handle import file selection
  function handleImportFile(e) {
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
    
    // Reset file input to allow selecting the same file again
    e.target.value = '';
  }

  // Import settings
  async function importSettings(importData) {
    // Validate import data
    if (!validateImportData(importData)) {
      showErrorToast(t('message.invalidSettings'));
      return;
    }

    // Confirm import
    const confirmed = await showConfirmModal(
      t('message.confirmImport'),
      t('message.confirmImportTitle')
    );
    
    if (!confirmed) {
      return;
    }

    // Prepare data to import
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

    // Save imported data
    chrome.storage.sync.set({ bannerAppearance: bannerAppearance, projects, keyboardShortcuts, pageTitles }, () => {
      // Reload settings, page titles, projects, keyboard shortcuts and banner customization
      loadSettings();
      loadPageTitles();
      loadProjects();
      loadKeyboardShortcuts();
      loadBannerCustomization();
      showSuccessToast(t('message.settingsImported'));
    });
  }

  // Validate import data
  function validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if bannerAppearance exist and have required structure
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

    // Check if projects is an array
    if (data.projects && !Array.isArray(data.projects)) {
      return false;
    }

    return true;
  }

  // Load keyboard shortcuts
  function loadKeyboardShortcuts() {
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

  // Save keyboard shortcuts
  function saveKeyboardShortcuts() {
    const shortcuts = {
      local: normalizeShortcut(elements.shortcutLocal.value) || 'Ctrl+Shift+1',
      staging: normalizeShortcut(elements.shortcutStaging.value) || 'Ctrl+Shift+2',
      production: normalizeShortcut(elements.shortcutProduction.value) || 'Ctrl+Shift+3'
    };

    chrome.storage.sync.set({ keyboardShortcuts: shortcuts }, () => {
      // すべてのタブにメッセージを送信してショートカット設定を更新
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateKeyboardShortcuts',
            shortcuts: shortcuts
          }).catch(() => {
            // メッセージ送信に失敗しても無視（コンテンツスクリプトが読み込まれていないタブなど）
          });
        });
      });
      showSuccessToast(t('message.urlSwitchingSaved'));
    });
  }

  // Load banner customization
  function loadBannerCustomization() {
    chrome.storage.sync.get(['bannerAppearance'], (result) => {
      const baseSettings = result.bannerAppearance?.baseSettings || {
        fontSize: 18,
        position: 'top',
        opacity: 100,
        blur: 0,
        height: 40
      };

      if (elements.bannerFontSize) {
        elements.bannerFontSize.value = baseSettings.fontSize || 18;
        if (elements.bannerFontSizeValue) {
          elements.bannerFontSizeValue.textContent = (baseSettings.fontSize || 18) + 'px';
        }
        updateSliderTrackFill(elements.bannerFontSize);
      }
      if (elements.bannerPosition) {
        elements.bannerPosition.value = baseSettings.position || 'top';
      }
      if (elements.bannerOpacity) {
        elements.bannerOpacity.value = baseSettings.opacity !== undefined ? baseSettings.opacity : 100;
        if (elements.bannerOpacityValue) {
          elements.bannerOpacityValue.textContent = (baseSettings.opacity !== undefined ? baseSettings.opacity : 100) + '%';
        }
        updateSliderTrackFill(elements.bannerOpacity);
      }
      if (elements.bannerBlur) {
        elements.bannerBlur.value = baseSettings.blur !== undefined ? baseSettings.blur : 0;
        if (elements.bannerBlurValue) {
          elements.bannerBlurValue.textContent = (baseSettings.blur !== undefined ? baseSettings.blur : 0) + 'px';
        }
        updateSliderTrackFill(elements.bannerBlur);
      }
      if (elements.bannerHeight) {
        elements.bannerHeight.value = baseSettings.height !== undefined ? baseSettings.height : 40;
        if (elements.bannerHeightValue) {
          elements.bannerHeightValue.textContent = (baseSettings.height !== undefined ? baseSettings.height : 40) + 'px';
        }
        updateSliderTrackFill(elements.bannerHeight);
      }
    });
  }

  // Save banner customization
  function saveBannerCustomization() {
    const baseSettings = {
      fontSize: parseInt(elements.bannerFontSize.value) || 18,
      position: elements.bannerPosition.value || 'top',
      opacity: parseInt(elements.bannerOpacity.value) || 100,
      blur: parseInt(elements.bannerBlur.value) || 0,
      height: parseInt(elements.bannerHeight.value) || 40
    };

    // bannerAppearanceを読み込んでbaseSettingsを更新
    chrome.storage.sync.get(['bannerAppearance'], (result) => {
      const bannerAppearance = result.bannerAppearance || {
        local: { text: 'You\'re on LOCAL env.', color: '#42a4ff' },
        staging: { text: 'You\'re on STAGING env.', color: '#ffc107' },
        production: { text: 'You\'re on PRODUCTION env.', color: '#f44336' }
      };
      
      bannerAppearance.baseSettings = baseSettings;

      chrome.storage.sync.set({ bannerAppearance: bannerAppearance }, () => {
        // すべてのタブにメッセージを送信してバナーカスタマイズ設定を更新
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'updateBannerCustomization',
              customization: baseSettings
            }).catch(() => {
              // メッセージ送信に失敗しても無視（コンテンツスクリプトが読み込まれていないタブなど）
            });
          });
        });
        showSuccessToast(t('message.bannerCustomizationSaved'));
      });
    });
  }

  // Setup keyboard shortcut input handlers
  function setupKeyboardShortcutInputs() {
    const shortcutInputs = [
      { element: elements.shortcutLocal, env: 'local' },
      { element: elements.shortcutStaging, env: 'staging' },
      { element: elements.shortcutProduction, env: 'production' }
    ];

    shortcutInputs.forEach(({ element, env }) => {
      let isCapturing = false;

      // フォーカス時にキー入力をキャプチャ開始
      element.addEventListener('focus', () => {
        isCapturing = true;
        element.value = '';
        element.placeholder = t('placeholder.shortcut');
        element.style.backgroundColor = '#fff3cd';
      });

      // フォーカスが外れた時にキャプチャ終了
      element.addEventListener('blur', () => {
        isCapturing = false;
        element.style.backgroundColor = '';
        
        // 値が空の場合はデフォルト値を設定
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

      // キーダウンイベントでキーコンビネーションをキャプチャ
      element.addEventListener('keydown', (e) => {
        if (!isCapturing) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        // 修飾キーのみの場合は無視
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
          return;
        }

        const combination = getKeyCombination(e);
        if (combination) {
          element.value = combination;
          element.blur(); // 自動的にフォーカスを外す
        }
      });

      // キーアップイベントで修飾キーのみの場合は無視
      element.addEventListener('keyup', (e) => {
        if (!isCapturing) {
          return;
        }

        // 修飾キーのみの場合は何もしない
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
          return;
        }
      });
    });
  }

  // Initialize
  init();
})();
