// Your Projects page logic
import { showSuccessToast, showErrorToast } from '../common/toast.js';
import { showConfirmModal } from '../confirm-modal.js';
import MicroModal from 'micromodal';
import { t, translateElements } from '../common/i18n.js';
import Sortable from 'sortablejs';

let elements = null;
let editingProjectId = null;
let sortableInstance = null;

// Function to close project modal with animation
const closeProjectModalWithAnimation = (callback) => {
  const modalElement = document.getElementById('project-modal');
  if (modalElement && modalElement.classList.contains('is-open')) {
    modalElement.classList.add('is-closing');

    setTimeout(() => {
      MicroModal.close('project-modal');
      modalElement.classList.remove('is-closing');
      editingProjectId = null;
      elements.projectForm.reset();
      if (callback && typeof callback === 'function') {
        callback();
      }
    }, 200);
  } else {
    editingProjectId = null;
    elements.projectForm.reset();
    if (callback && typeof callback === 'function') {
      callback();
    }
  }
};

// Initialize project module with DOM elements
export function initProjects(elementsRef) {
  elements = elementsRef;

  MicroModal.init({
    onShow: (modal) => {
      const firstInput = modal.querySelector('#project-name');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    },
    onClose: (modal) => {
      const modalElement = document.getElementById('project-modal');
      if (modalElement) {
        modalElement.classList.remove('is-closing');
      }
      if (modal._cleanupProjectModal) {
        modal._cleanupProjectModal();
        delete modal._cleanupProjectModal;
      }
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

  setupProjectModalHandlers();
  setupProtocolToggle();
}

export function getEditingProjectId() {
  return editingProjectId;
}

// Set up event handlers for project modal close buttons
function setupProjectModalHandlers() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const overlay = modal.querySelector('.modal__overlay');
  const closeButtons = modal.querySelectorAll('[data-micromodal-close]');

  const handleOverlayClick = (e) => {
    if (e.target === overlay) {
      e.preventDefault();
      e.stopPropagation();
      closeProjectModalWithAnimation();
    }
  };

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

  const handleEscKey = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      e.preventDefault();
      e.stopPropagation();
      closeProjectModalWithAnimation();
    }
  };

  document.addEventListener('keydown', handleEscKey);

  modal._cleanupProjectModal = () => {
    document.removeEventListener('keydown', handleEscKey);
    overlay.onclick = null;
    closeButtons.forEach(btn => {
      btn.onclick = null;
    });
  };
}

// Setup protocol toggle buttons
function setupProtocolToggle() {
  elements.protocolBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const env = e.target.getAttribute('data-env');
      const protocol = e.target.getAttribute('data-protocol');

      const envBtns = document.querySelectorAll(`.protocol-btn[data-env="${env}"]`);
      envBtns.forEach(b => {
        b.classList.remove('active');
      });
      e.target.classList.add('active');
    });
  });
}

export function getSelectedProtocol(env) {
  const activeBtn = document.querySelector(`.protocol-btn[data-env="${env}"].active`);
  return activeBtn ? activeBtn.getAttribute('data-protocol') : 'https';
}

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

function resetProtocols() {
  ['local', 'staging', 'production'].forEach(env => {
    setProtocol(env, 'https');
  });
}

export function loadProjects() {
  chrome.storage.sync.get(['projects'], (result) => {
    const projects = result.projects || [];
    renderProjects(projects);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function renderProjects(projects) {
  if (projects.length === 0) {
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
    translateElements(elements.projectsList);
    return;
  }

  elements.projectsList.innerHTML = projects.map(project => {
    const isEnabled = project.enabled !== false;
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

  translateElements(elements.projectsList);

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

  document.querySelectorAll('.toggle-input').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const projectId = e.target.getAttribute('data-project-id');
      const enabled = e.target.checked;
      toggleProject(projectId, enabled);
    });
  });

  initSortable();
}

function initSortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  if (elements.projectsList.children.length === 0) {
    return;
  }

  sortableInstance = new Sortable(elements.projectsList, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd: () => {
      saveProjectOrder();
    }
  });
}

function saveProjectOrder() {
  const projectCards = elements.projectsList.querySelectorAll('.project-card');
  const projectIds = Array.from(projectCards).map(card => card.getAttribute('data-project-id'));

  chrome.storage.sync.get(['projects'], (result) => {
    const projects = result.projects || [];
    const reorderedProjects = projectIds.map(id => {
      return projects.find(p => p.id === id);
    }).filter(p => p !== undefined);

    projects.forEach(project => {
      if (!reorderedProjects.find(p => p.id === project.id)) {
        reorderedProjects.push(project);
      }
    });

    chrome.storage.sync.set({ projects: reorderedProjects }, () => {});
  });
}

export function openProjectModal(projectId = null) {
  editingProjectId = projectId;
  elements.modalTitle.textContent = projectId ? t('modal.project.edit') : t('modal.project.add');
  elements.projectForm.reset();
  resetProtocols();

  if (projectId) {
    chrome.storage.sync.get(['projects'], (result) => {
      const projects = result.projects || [];
      const project = projects.find(p => p.id === projectId);
      if (project) {
        elements.projectName.value = project.name || '';
        elements.projectLocal.value = (project.local && project.local.length > 0) ? project.local[0] : '';
        elements.projectStaging.value = (project.staging && project.staging.length > 0) ? project.staging[0] : '';
        elements.projectProduction.value = (project.production && project.production.length > 0) ? project.production[0] : '';

        setProtocol('local', project.localProtocol || 'https');
        setProtocol('staging', project.stagingProtocol || 'https');
        setProtocol('production', project.productionProtocol || 'https');
      }
    });
  } else {
    elements.projectLocal.value = '';
    elements.projectStaging.value = '';
    elements.projectProduction.value = '';
  }

  MicroModal.show('project-modal');
}

function closeProjectModal() {
  closeProjectModalWithAnimation();
}

function editProject(projectId) {
  openProjectModal(projectId);
}

export async function deleteProject(projectId) {
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

function toggleProject(projectId, enabled) {
  chrome.storage.sync.get(['projects'], (result) => {
    const projects = result.projects || [];
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.enabled = enabled;
      chrome.storage.sync.set({ projects }, () => {});
    }
  });
}

export function handleProjectSubmit(e) {
  e.preventDefault();

  const name = elements.projectName.value.trim();
  if (!name) {
    showErrorToast(t('message.enterProjectName'));
    return;
  }

  const localValue = elements.projectLocal.value.trim();
  const stagingValue = elements.projectStaging.value.trim();
  const productionValue = elements.projectProduction.value.trim();

  const local = localValue ? [localValue] : [];
  const staging = stagingValue ? [stagingValue] : [];
  const production = productionValue ? [productionValue] : [];

  const localProtocol = getSelectedProtocol('local');
  const stagingProtocol = getSelectedProtocol('staging');
  const productionProtocol = getSelectedProtocol('production');

  chrome.storage.sync.get(['projects'], (result) => {
    const projects = result.projects || [];

    if (editingProjectId) {
      const index = projects.findIndex(p => p.id === editingProjectId);
      if (index !== -1) {
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
          enabled: existingProject.enabled !== false
        };

        projects[index] = updatedProject;
      }
    } else {
      const newProject = {
        id: 'project-' + Date.now(),
        name,
        local,
        staging,
        production,
        localProtocol,
        stagingProtocol,
        productionProtocol,
        enabled: true
      };

      projects.push(newProject);
    }

    chrome.storage.sync.set({ projects }, () => {
      loadProjects();
      const isEditing = !!editingProjectId;
      closeProjectModalWithAnimation(() => {
        if (isEditing) {
          showSuccessToast(t('message.projectUpdated'));
        } else {
          showSuccessToast(t('message.projectAdded'));
        }
      });
    });
  });
}

export function setupProjectEventListeners() {
  elements.addProjectBtn.addEventListener('click', () => openProjectModal());
  elements.projectForm.addEventListener('submit', handleProjectSubmit);
}
