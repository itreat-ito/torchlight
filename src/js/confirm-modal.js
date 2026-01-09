// Confirmation modal utility using Micromodal
import MicroModal from 'micromodal';

let currentResolve = null;
const ANIMATION_DURATION = 200; // milliseconds

// Initialize Micromodal
MicroModal.init({
  onShow: (modal) => {
    // Focus on OK button when modal opens
    const okButton = modal.querySelector('#confirm-modal-ok');
    if (okButton) {
      setTimeout(() => okButton.focus(), 100);
    }
  },
  onClose: (modal) => {
    // Clean up event listeners
    if (modal._cleanup) {
      modal._cleanup();
      delete modal._cleanup;
    }
    
    // Remove closing class if it exists
    const modalElement = document.getElementById('confirm-modal');
    if (modalElement) {
      modalElement.classList.remove('is-closing');
    }
  },
  openTrigger: 'data-micromodal-trigger',
  closeTrigger: 'data-micromodal-close',
  disableScroll: true,
  disableFocus: false,
  awaitOpenAnimation: false, // We'll handle animations manually
  awaitCloseAnimation: false, // We'll handle animations manually
});

/**
 * Show a confirmation modal
 * @param {string} message - The message to display
 * @param {string} title - The title of the modal (optional, defaults to "Confirm")
 * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal(message, title = 'Confirm') {
  return new Promise((resolve) => {
    currentResolve = resolve;
    
    const modal = document.getElementById('confirm-modal');
    const titleElement = document.getElementById('confirm-modal-title');
    const contentElement = document.getElementById('confirm-modal-content');
    const okButton = document.getElementById('confirm-modal-ok');
    const overlay = modal.querySelector('.modal__overlay');

    // Set title and message
    titleElement.textContent = title;
    contentElement.querySelector('p').textContent = message;

    // Function to close modal with animation
    const closeWithAnimation = (result) => {
      const modalElement = document.getElementById('confirm-modal');
      if (modalElement && modalElement.classList.contains('is-open')) {
        // Add closing class to trigger animation
        modalElement.classList.add('is-closing');
        
        // Wait for animation to complete before actually closing
        setTimeout(() => {
          MicroModal.close('confirm-modal');
          modalElement.classList.remove('is-closing');
          resolve(result);
        }, ANIMATION_DURATION);
      } else {
        resolve(result);
      }
    };

    // Set up OK button handler
    const handleOk = (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentResolve = null;
      closeWithAnimation(true);
    };

    // Set up Cancel handler
    const handleCancel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentResolve = null;
      closeWithAnimation(false);
    };

    // Set up overlay click handler
    const handleOverlayClick = (e) => {
      // Only close if clicking directly on overlay, not on container
      if (e.target === overlay) {
        e.preventDefault();
        e.stopPropagation();
        currentResolve = null;
        closeWithAnimation(false);
      }
    };

    // Set up ESC key handler
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        e.preventDefault();
        e.stopPropagation();
        currentResolve = null;
        closeWithAnimation(false);
      }
    };

    // Temporarily remove data-micromodal-close to prevent Micromodal's default behavior
    const cancelButtons = modal.querySelectorAll('[data-micromodal-close]');
    const originalAttributes = [];
    cancelButtons.forEach((btn, index) => {
      originalAttributes[index] = btn.getAttribute('data-micromodal-close');
      btn.removeAttribute('data-micromodal-close');
    });

    // Remove existing listeners and add new ones
    okButton.onclick = handleOk;
    
    // Handle cancel buttons and close button
    cancelButtons.forEach(btn => {
      if (btn !== overlay) {
        btn.onclick = handleCancel;
      }
    });

    // Handle overlay click
    overlay.onclick = handleOverlayClick;

    // Handle ESC key
    document.addEventListener('keydown', handleEscKey);

    // Clean up function
    const cleanup = () => {
      document.removeEventListener('keydown', handleEscKey);
      overlay.onclick = null;
      okButton.onclick = null;
      cancelButtons.forEach((btn, index) => {
        btn.onclick = null;
        // Restore original attribute
        if (originalAttributes[index] !== null) {
          btn.setAttribute('data-micromodal-close', originalAttributes[index]);
        }
      });
    };

    // Store cleanup function to call on close
    modal._cleanup = cleanup;

    // Show modal
    MicroModal.show('confirm-modal');
  });
}
