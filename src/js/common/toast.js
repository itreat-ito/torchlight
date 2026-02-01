// Toast notification utility
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

/**
 * Show a success toast notification
 * @param {string} message - The message to display
 * @param {Object} [options] - Optional. e.g. { offsetTop: number } to position below a banner
 */
export function showSuccessToast(message, options = {}) {
  const baseStyle = {
    background: 'linear-gradient(to right, #fd79ae, #ffa17d)',
    fontSize: '.9rem',
    fontWeight: '700',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  };
  // if (options.offsetTop != null) {
  //   baseStyle.top = `${options.offsetTop}px`;
  // }
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    style: baseStyle,
    offset: {
      y: options.offsetTop ?? 10,
    },
  }).showToast();
}

/**
 * Show an error toast notification
 * @param {string} message - The message to display
 */
export function showErrorToast(message) {
  Toastify({
    text: message,
    duration: 4000,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    style: {
      background: 'linear-gradient(to right, #f44336, #d32f2f)',
      fontSize: '.9rem',
      fontWeight: '700',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
  }).showToast();
}

/**
 * Show an info toast notification
 * @param {string} message - The message to display
 */
export function showInfoToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    style: {
      background: 'linear-gradient(to right, #3498db, #2980b9)',
      fontSize: '.9rem',
      fontWeight: '700',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
  }).showToast();
}
