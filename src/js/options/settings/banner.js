// Banner display - appearance, preview, customization
import { showSuccessToast } from '../../common/toast.js';
import { t, getLanguage } from '../../common/i18n.js';
import { hexToRgb, getLuminance } from '../../common/color.js';

let elements = null;
let currentPreviewEnv = 'local';

export function initBanner(elementsRef) {
  elements = elementsRef;
}

export function getCurrentPreviewEnv() {
  return currentPreviewEnv;
}

export function updateSliderTrackFill(slider) {
  if (!slider) return;

  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const value = parseFloat(slider.value) || min;
  const percentage = ((value - min) / (max - min)) * 100;

  slider.style.background = `linear-gradient(to right, #4476e2 ${percentage}%, #ddd ${percentage}%)`;
}

export function updateBannerPreview() {
  if (!elements.bannerPreview) return;

  const env = currentPreviewEnv;
  const envText = elements[`${env}Text`]?.value || '';
  const envColor = elements[`${env}Color`]?.value || '#666666';

  const fontSize = parseInt(elements.bannerFontSize?.value) || 18;
  const height = parseInt(elements.bannerHeight?.value) || 40;
  const opacity = parseInt(elements.bannerOpacity?.value) || 100;
  const blur = parseInt(elements.bannerBlur?.value) || 0;
  const position = elements.bannerPosition?.value || 'top';

  elements.bannerPreview.textContent = envText || `${env}環境`;

  const opacityDecimal = opacity / 100;
  const rgb = hexToRgb(envColor);
  if (rgb) {
    elements.bannerPreview.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacityDecimal})`;
  } else {
    elements.bannerPreview.style.backgroundColor = envColor;
    elements.bannerPreview.style.opacity = opacityDecimal.toString();
  }

  if (blur > 0) {
    elements.bannerPreview.style.backdropFilter = `blur(${blur}px)`;
    elements.bannerPreview.style.webkitBackdropFilter = `blur(${blur}px)`;
  } else {
    elements.bannerPreview.style.backdropFilter = '';
    elements.bannerPreview.style.webkitBackdropFilter = '';
  }

  elements.bannerPreview.style.fontSize = `${fontSize}px`;
  elements.bannerPreview.style.height = `${height}px`;
  elements.bannerPreview.style.lineHeight = `${height}px`;
  elements.bannerPreview.style.top = '0';
  elements.bannerPreview.style.bottom = 'auto';
  elements.bannerPreview.setAttribute('data-position', position);

  const luminance = getLuminance(envColor);
  elements.bannerPreview.classList.remove('dark-text', 'light-text');
  if (luminance > 0.5) {
    elements.bannerPreview.classList.add('dark-text');
  } else {
    elements.bannerPreview.classList.add('light-text');
  }
}

export function getWikipediaRandomUrl() {
  const lang = getLanguage();
  if (lang === 'ja') {
    return 'https://ja.wikipedia.org/wiki/%E7%89%B9%E5%88%A5:%E3%81%8A%E3%81%BE%E3%81%8B%E3%81%9B%E8%A1%A8%E7%A4%BA';
  } else {
    return 'https://en.wikipedia.org/wiki/Special:Random';
  }
}

export function updateWikipediaIframeUrl() {
  if (elements.bannerPreviewIframe) {
    const randomUrl = getWikipediaRandomUrl();
    if (elements.bannerPreviewIframe.src !== randomUrl && !elements.bannerPreviewIframe.src.includes(randomUrl.split('/wiki/')[1])) {
      elements.bannerPreviewIframe.src = randomUrl;
    }
  }
}

export function loadSettings() {
  chrome.storage.sync.get(['bannerAppearance'], (result) => {
    const settings = result.bannerAppearance || {
      local: { text: 'You\'re on LOCAL env.', color: '#42a4ff' },
      staging: { text: 'You\'re on STAGING env.', color: '#ffc107' },
      production: { text: 'You\'re on PRODUCTION env.', color: '#f44336' }
    };

    elements.localText.value = settings.local.text || 'You\'re on LOCAL env.';
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

    updateBannerPreview();
  });
}

export function saveSettings() {
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
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateBannerCustomization',
          customization: baseSettings
        }).catch(() => {});
      });
    });
    showSuccessToast(t('message.bannerAppearanceSaved'));
  });
}

export function loadBannerCustomization() {
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

    updateBannerPreview();
  });
}

export function saveBannerCustomization() {
  const baseSettings = {
    fontSize: parseInt(elements.bannerFontSize.value) || 18,
    position: elements.bannerPosition.value || 'top',
    opacity: parseInt(elements.bannerOpacity.value) || 100,
    blur: parseInt(elements.bannerBlur.value) || 0,
    height: parseInt(elements.bannerHeight.value) || 40
  };

  chrome.storage.sync.get(['bannerAppearance'], (result) => {
    const bannerAppearance = result.bannerAppearance || {
      local: { text: 'You\'re on LOCAL env.', color: '#42a4ff' },
      staging: { text: 'You\'re on STAGING env.', color: '#ffc107' },
      production: { text: 'You\'re on PRODUCTION env.', color: '#f44336' }
    };

    bannerAppearance.baseSettings = baseSettings;

    chrome.storage.sync.set({ bannerAppearance: bannerAppearance }, () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateBannerCustomization',
            customization: baseSettings
          }).catch(() => {});
        });
      });
      showSuccessToast(t('message.bannerCustomizationSaved'));
    });
  });
}

export function setupPreviewTabs() {
  elements.previewTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const env = e.target.getAttribute('data-preview-env');
      if (!env) return;

      elements.previewTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentPreviewEnv = env;
      updateBannerPreview();
    });
  });
}

export function setupBannerPreviewUpdates() {
  [elements.localText, elements.stagingText, elements.productionText].forEach(input => {
    if (input) {
      input.addEventListener('input', updateBannerPreview);
    }
  });

  [elements.localColor, elements.stagingColor, elements.productionColor].forEach(input => {
    if (input) {
      input.addEventListener('change', updateBannerPreview);
      input.addEventListener('input', updateBannerPreview);
    }
  });

  if (elements.bannerFontSize) {
    elements.bannerFontSize.addEventListener('input', updateBannerPreview);
  }
  if (elements.bannerHeight) {
    elements.bannerHeight.addEventListener('input', updateBannerPreview);
  }
  if (elements.bannerOpacity) {
    elements.bannerOpacity.addEventListener('input', updateBannerPreview);
  }
  if (elements.bannerBlur) {
    elements.bannerBlur.addEventListener('input', updateBannerPreview);
  }

  if (elements.bannerPosition) {
    elements.bannerPosition.addEventListener('change', updateBannerPreview);
  }

  if (elements.bannerPreviewRefreshBtn && elements.bannerPreviewIframe) {
    const container = elements.bannerPreviewIframe.closest('.banner-preview-container');

    const handleIframeLoad = () => {
      if (container) {
        container.classList.remove('loading');
      }
      if (elements.bannerPreviewRefreshBtn) {
        elements.bannerPreviewRefreshBtn.classList.remove('loading');
        elements.bannerPreviewRefreshBtn.disabled = false;
      }
      elements.bannerPreviewIframe.removeEventListener('load', handleIframeLoad);
    };

    elements.bannerPreviewRefreshBtn.addEventListener('click', () => {
      if (elements.bannerPreviewIframe) {
        if (container) {
          container.classList.add('loading');
        }
        elements.bannerPreviewRefreshBtn.classList.add('loading');
        elements.bannerPreviewRefreshBtn.disabled = true;
        elements.bannerPreviewIframe.addEventListener('load', handleIframeLoad);
        const randomUrl = getWikipediaRandomUrl();
        elements.bannerPreviewIframe.src = randomUrl + '?t=' + Date.now();
      }
    });
  }

  updateWikipediaIframeUrl();
}
