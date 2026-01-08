// Options page logic

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

    // Project management
    addProjectBtn: document.getElementById('add-project'),
    projectsList: document.getElementById('projects-list'),

    // Modal
    modal: document.getElementById('project-modal'),
    modalTitle: document.getElementById('modal-title'),
    projectForm: document.getElementById('project-form'),
    projectName: document.getElementById('project-name'),
    projectLocal: document.getElementById('project-local'),
    projectStaging: document.getElementById('project-staging'),
    projectProduction: document.getElementById('project-production'),
    closeModal: document.querySelector('.close'),
    cancelProject: document.getElementById('cancel-project')
  };

  let editingProjectId = null;

  // Initialize
  function init() {
    loadSettings();
    loadProjects();
    setupEventListeners();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Save common settings
    elements.saveSettingsBtn.addEventListener('click', saveSettings);

    // Add project
    elements.addProjectBtn.addEventListener('click', () => openProjectModal());

    // Close modal
    elements.closeModal.addEventListener('click', closeProjectModal);
    elements.cancelProject.addEventListener('click', closeProjectModal);
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        closeProjectModal();
      }
    });

    // Project form submission
    elements.projectForm.addEventListener('submit', handleProjectSubmit);
  }

  // Load common settings
  function loadSettings() {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || {
        local: { text: 'You\'re on LOCAL env.', color: '#4CAF50' },
        staging: { text: 'You\'re on STAGING env.', color: '#FFC107' },
        production: { text: 'You\'re on PRODUCTION env.', color: '#F44336' }
      };

      elements.localText.value = settings.local.text || 'You\'re on LOCAL env.';
      elements.localColor.value = settings.local.color || '#4CAF50';
      elements.stagingText.value = settings.staging.text || 'You\'re on STAGING env.';
      elements.stagingColor.value = settings.staging.color || '#FFC107';
      elements.productionText.value = settings.production.text || 'You\'re on PRODUCTION env.';
      elements.productionColor.value = settings.production.color || '#F44336';
    });
  }

  // Save common settings
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

    chrome.storage.sync.set({ settings }, () => {
      alert('Common settings saved');
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
      elements.projectsList.innerHTML = `
        <div class="empty-state">
          <p>No projects registered</p>
          <p>Click "Add Project" button to add one</p>
        </div>
      `;
      return;
    }

    elements.projectsList.innerHTML = projects.map(project => {
      const isEnabled = project.enabled !== false; // デフォルトはtrue
      return `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-header">
          <div class="project-name-wrapper">
            <label class="toggle-switch">
              <input type="checkbox" class="toggle-input" data-project-id="${project.id}" ${isEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <div class="project-name">${escapeHtml(project.name)}</div>
          </div>
          <div class="project-actions">
            <button class="btn btn-edit edit-project" data-project-id="${project.id}">Edit</button>
            <button class="btn btn-danger delete-project" data-project-id="${project.id}">Delete</button>
          </div>
        </div>
        <div class="project-domains">
          <div class="domain-group">
            <h4>Local</h4>
            <div class="domain-list">
              <ul>
                ${(project.local || []).map(domain => `<li>${escapeHtml(domain)}</li>`).join('')}
                ${(project.local || []).length === 0 ? '<li style="color: #999;">Not set</li>' : ''}
              </ul>
            </div>
          </div>
          <div class="domain-group">
            <h4>Staging</h4>
            <div class="domain-list">
              <ul>
                ${(project.staging || []).map(domain => `<li>${escapeHtml(domain)}</li>`).join('')}
                ${(project.staging || []).length === 0 ? '<li style="color: #999;">Not set</li>' : ''}
              </ul>
            </div>
          </div>
          <div class="domain-group">
            <h4>Production</h4>
            <div class="domain-list">
              <ul>
                ${(project.production || []).map(domain => `<li>${escapeHtml(domain)}</li>`).join('')}
                ${(project.production || []).length === 0 ? '<li style="color: #999;">Not set</li>' : ''}
              </ul>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');

    // Edit and delete button event listeners
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

    // Toggle switch event listeners
    document.querySelectorAll('.toggle-input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const projectId = e.target.getAttribute('data-project-id');
        const enabled = e.target.checked;
        toggleProject(projectId, enabled);
      });
    });
  }

  // Open project modal
  function openProjectModal(projectId = null) {
    editingProjectId = projectId;
    elements.modalTitle.textContent = projectId ? 'Edit Project' : 'Add Project';
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

  // Close project modal
  function closeProjectModal() {
    elements.modal.style.display = 'none';
    editingProjectId = null;
    elements.projectForm.reset();
  }

  // Edit project
  function editProject(projectId) {
    openProjectModal(projectId);
  }

  // Delete project
  function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) {
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
      alert('Please enter a project name');
      return;
    }

    // Parse domains (separated by line breaks or commas)
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
        // Edit
        const index = projects.findIndex(p => p.id === editingProjectId);
        if (index !== -1) {
          // 既存のenabled状態を保持（デフォルトはtrue）
          const existingProject = projects[index];
          projects[index] = {
            id: editingProjectId,
            name,
            local,
            staging,
            production,
            enabled: existingProject.enabled !== false // 既存の値があれば保持、なければtrue
          };
        }
      } else {
        // Add new
        const newProject = {
          id: 'project-' + Date.now(),
          name,
          local,
          staging,
          production,
          enabled: true // 新規プロジェクトはデフォルトで有効
        };
        projects.push(newProject);
      }

      chrome.storage.sync.set({ projects }, () => {
        loadProjects();
        closeProjectModal();
      });
    });
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize
  init();
})();
