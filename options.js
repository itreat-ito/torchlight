// 設定画面のロジック

(function() {
  'use strict';

  // DOM要素の取得
  const elements = {
    // 共通設定
    localText: document.getElementById('local-text'),
    localColor: document.getElementById('local-color'),
    stagingText: document.getElementById('staging-text'),
    stagingColor: document.getElementById('staging-color'),
    productionText: document.getElementById('production-text'),
    productionColor: document.getElementById('production-color'),
    saveSettingsBtn: document.getElementById('save-settings'),

    // プロジェクト管理
    addProjectBtn: document.getElementById('add-project'),
    projectsList: document.getElementById('projects-list'),

    // モーダル
    modal: document.getElementById('project-modal'),
    modalTitle: document.getElementById('modal-title'),
    projectForm: document.getElementById('project-form'),
    projectName: document.getElementById('project-name'),
    projectLocal: document.getElementById('project-local'),
    projectStaging: document.getElementById('project-staging'),
    projectProduction: document.getElementById('project-production'),
    closeModal: document.querySelector('.close'),
    cancelProject: document.getElementById('cancel-project'),

    // 言語選択
    languageSelect: document.getElementById('language-select')
  };

  let editingProjectId = null;
  let currentLanguage = 'ja';
  let translations = {};

  // 初期化
  function init() {
    loadLanguage();
    loadSettings();
    loadProjects();
    setupEventListeners();
  }

  // 言語ファイルの読み込み
  function loadLanguage() {
    chrome.storage.sync.get(['language'], (result) => {
      currentLanguage = result.language || 'ja';
      elements.languageSelect.value = currentLanguage;
      
      const langFile = `locales/${currentLanguage}.json`;
      fetch(chrome.runtime.getURL(langFile))
        .then(response => response.json())
        .then(data => {
          translations = data;
          applyTranslations();
        })
        .catch(error => {
          console.error('Failed to load language file:', error);
          // フォールバック: デフォルトで日本語を使用
          if (currentLanguage !== 'ja') {
            currentLanguage = 'ja';
            elements.languageSelect.value = 'ja';
            loadLanguage();
          }
        });
    });
  }

  // 翻訳を適用
  function applyTranslations() {
    // data-i18n-placeholder属性を持つ要素を先に更新（優先）
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
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
        element.placeholder = value;
      }
    });

    // data-i18n属性を持つ要素を更新（プレースホルダー以外）
    document.querySelectorAll('[data-i18n]').forEach(element => {
      // data-i18n-placeholderが既に処理されている場合はスキップ
      if (element.hasAttribute('data-i18n-placeholder')) {
        return;
      }

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

    // タイトルを更新
    if (translations.settings && translations.settings.title) {
      document.title = translations.settings.title;
    }
  }

  // イベントリスナーの設定
  function setupEventListeners() {
    // 共通設定の保存
    elements.saveSettingsBtn.addEventListener('click', saveSettings);

    // プロジェクト追加
    elements.addProjectBtn.addEventListener('click', () => openProjectModal());

    // モーダルの閉じる
    elements.closeModal.addEventListener('click', closeProjectModal);
    elements.cancelProject.addEventListener('click', closeProjectModal);
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        closeProjectModal();
      }
    });

    // プロジェクトフォームの送信
    elements.projectForm.addEventListener('submit', handleProjectSubmit);

    // 言語切り替え
    elements.languageSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      chrome.storage.sync.set({ language: currentLanguage }, () => {
        loadLanguage();
      });
    });
  }

  // 共通設定の読み込み
  function loadSettings() {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || {
        local: { text: 'ローカル環境', color: '#4CAF50' },
        staging: { text: 'ステージング環境', color: '#FFC107' },
        production: { text: '本番環境', color: '#F44336' }
      };

      elements.localText.value = settings.local.text || 'ローカル環境';
      elements.localColor.value = settings.local.color || '#4CAF50';
      elements.stagingText.value = settings.staging.text || 'ステージング環境';
      elements.stagingColor.value = settings.staging.color || '#FFC107';
      elements.productionText.value = settings.production.text || '本番環境';
      elements.productionColor.value = settings.production.color || '#F44336';
    });
  }

  // 共通設定の保存
  function saveSettings() {
    const settings = {
      local: {
        text: elements.localText.value || 'ローカル環境',
        color: elements.localColor.value
      },
      staging: {
        text: elements.stagingText.value || 'ステージング環境',
        color: elements.stagingColor.value
      },
      production: {
        text: elements.productionText.value || '本番環境',
        color: elements.productionColor.value
      }
    };

    chrome.storage.sync.set({ settings }, () => {
      const message = translations.settings?.settingsSaved || '共通設定を保存しました';
      alert(message);
    });
  }

  // プロジェクトの読み込み
  function loadProjects() {
    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      renderProjects(projects);
    });
  }

  // プロジェクトの表示
  function renderProjects(projects) {
    if (projects.length === 0) {
      const noProjects = translations.projects?.noProjects || 'プロジェクトが登録されていません';
      const addHint = translations.projects?.addProjectHint || '「プロジェクトを追加」ボタンから追加してください';
      elements.projectsList.innerHTML = `
        <div class="empty-state">
          <p>${escapeHtml(noProjects)}</p>
          <p>${escapeHtml(addHint)}</p>
        </div>
      `;
      return;
    }

    const localEnv = translations.projects?.localDomains?.replace('のドメイン', '') || translations.settings?.localEnv || 'ローカル環境';
    const stagingEnv = translations.projects?.stagingDomains?.replace('のドメイン', '') || translations.settings?.stagingEnv || 'ステージング環境';
    const productionEnv = translations.projects?.productionDomains?.replace('のドメイン', '') || translations.settings?.productionEnv || '本番環境';
    const notSet = translations.projects?.notSet || '未設定';
    const editText = translations.projects?.edit || '編集';
    const deleteText = translations.projects?.delete || '削除';

    elements.projectsList.innerHTML = projects.map(project => `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-header">
          <div class="project-name">${escapeHtml(project.name)}</div>
          <div class="project-actions">
            <button class="btn btn-edit edit-project" data-project-id="${project.id}">${escapeHtml(editText)}</button>
            <button class="btn btn-danger delete-project" data-project-id="${project.id}">${escapeHtml(deleteText)}</button>
          </div>
        </div>
        <div class="project-domains">
          <div class="domain-group">
            <h4>${escapeHtml(localEnv)}</h4>
            <div class="domain-list">
              <ul>
                ${(project.local || []).map(domain => `<li>${escapeHtml(domain)}</li>`).join('')}
                ${(project.local || []).length === 0 ? `<li style="color: #999;">${escapeHtml(notSet)}</li>` : ''}
              </ul>
            </div>
          </div>
          <div class="domain-group">
            <h4>${escapeHtml(stagingEnv)}</h4>
            <div class="domain-list">
              <ul>
                ${(project.staging || []).map(domain => `<li>${escapeHtml(domain)}</li>`).join('')}
                ${(project.staging || []).length === 0 ? `<li style="color: #999;">${escapeHtml(notSet)}</li>` : ''}
              </ul>
            </div>
          </div>
          <div class="domain-group">
            <h4>${escapeHtml(productionEnv)}</h4>
            <div class="domain-list">
              <ul>
                ${(project.production || []).map(domain => `<li>${escapeHtml(domain)}</li>`).join('')}
                ${(project.production || []).length === 0 ? `<li style="color: #999;">${escapeHtml(notSet)}</li>` : ''}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // 編集・削除ボタンのイベントリスナー
    document.querySelectorAll('.edit-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = e.target.getAttribute('data-project-id');
        editProject(projectId);
      });
    });

    document.querySelectorAll('.delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = e.target.getAttribute('data-project-id');
        deleteProject(projectId);
      });
    });
  }

  // プロジェクトモーダルを開く
  function openProjectModal(projectId = null) {
    editingProjectId = projectId;
    const title = projectId 
      ? (translations.projects?.editProject || 'プロジェクトを編集')
      : (translations.projects?.addProject || 'プロジェクトを追加');
    elements.modalTitle.textContent = title;
    elements.projectForm.reset();

    if (projectId) {
      chrome.storage.sync.get(['projects'], (result) => {
        const projects = result.projects || [];
        const project = projects.find(p => p.id === projectId);
        if (project) {
          elements.projectName.value = project.name || '';
          elements.projectLocal.value = (project.local || []).join('\n');
          elements.projectStaging.value = (project.staging || []).join('\n');
          elements.projectProduction.value = (project.production || []).join('\n');
        }
      });
    }

    elements.modal.style.display = 'block';
  }

  // プロジェクトモーダルを閉じる
  function closeProjectModal() {
    elements.modal.style.display = 'none';
    editingProjectId = null;
    elements.projectForm.reset();
  }

  // プロジェクトの編集
  function editProject(projectId) {
    openProjectModal(projectId);
  }

  // プロジェクトの削除
  function deleteProject(projectId) {
    const message = translations.projects?.deleteConfirm || 'このプロジェクトを削除してもよろしいですか？';
    if (!confirm(message)) {
      return;
    }

    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      const filtered = projects.filter(p => p.id !== projectId);
      chrome.storage.sync.set({ projects: filtered }, () => {
        loadProjects();
      });
    });
  }

  // プロジェクトフォームの送信
  function handleProjectSubmit(e) {
    e.preventDefault();

    const name = elements.projectName.value.trim();
    if (!name) {
      const message = translations.projects?.nameRequired || 'プロジェクト名を入力してください';
      alert(message);
      return;
    }

    // ドメインを配列に変換（改行またはカンマで区切る）
    const parseDomains = (text) => {
      return text.split(/[\n,]/)
        .map(d => d.trim())
        .filter(d => d.length > 0);
    };

    const local = parseDomains(elements.projectLocal.value);
    const staging = parseDomains(elements.projectStaging.value);
    const production = parseDomains(elements.projectProduction.value);

    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];

      if (editingProjectId) {
        // 編集
        const index = projects.findIndex(p => p.id === editingProjectId);
        if (index !== -1) {
          projects[index] = {
            id: editingProjectId,
            name,
            local,
            staging,
            production
          };
        }
      } else {
        // 新規追加
        const newProject = {
          id: 'project-' + Date.now(),
          name,
          local,
          staging,
          production
        };
        projects.push(newProject);
      }

      chrome.storage.sync.set({ projects }, () => {
        loadProjects();
        closeProjectModal();
      });
    });
  }

  // HTMLエスケープ
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 初期化実行
  init();
})();

