// Popup functionality

class PopupController {
  constructor() {
    this.elements = {
      enabledToggle: document.getElementById('enabledToggle'),
      targetLanguage: document.getElementById('targetLanguage'),
      showOriginal: document.getElementById('showOriginal'),
      statusIndicator: document.getElementById('statusIndicator'),
      translationCount: document.getElementById('translationCount')
    };
    
    this.init();
  }

  async init() {
    // Load current settings
    const settings = await chrome.storage.sync.get([
      'enabled',
      'targetLanguage',
      'showOriginal',
      'translationCount'
    ]);

    // Set UI values
    this.elements.enabledToggle.checked = settings.enabled !== false;
    this.elements.targetLanguage.value = settings.targetLanguage || 'tr';
    this.elements.showOriginal.checked = settings.showOriginal || false;
    this.elements.translationCount.textContent = settings.translationCount || 0;

    // Update status indicator
    this.updateStatus(settings.enabled !== false);

    // Attach event listeners
    this.attachListeners();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.translationCount) {
        this.elements.translationCount.textContent = changes.translationCount.newValue;
      }
      if (changes.enabled) {
        this.updateStatus(changes.enabled.newValue);
      }
    });
  }

  attachListeners() {
    // Enabled toggle
    this.elements.enabledToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      chrome.storage.sync.set({ enabled });
      this.updateStatus(enabled);
    });

    // Target language
    this.elements.targetLanguage.addEventListener('change', (e) => {
      chrome.storage.sync.set({ targetLanguage: e.target.value });
    });

    // Show original
    this.elements.showOriginal.addEventListener('change', (e) => {
      chrome.storage.sync.set({ showOriginal: e.target.checked });
    });
  }

  updateStatus(enabled) {
    const statusText = this.elements.statusIndicator.querySelector('.status-text');
    const statusDot = this.elements.statusIndicator.querySelector('.status-dot');

    if (enabled) {
      statusText.textContent = 'Aktif';
      statusDot.style.background = 'var(--color-accent)';
      this.elements.statusIndicator.style.background = 'var(--color-accent-dim)';
      this.elements.statusIndicator.style.borderColor = 'var(--color-accent)';
    } else {
      statusText.textContent = 'Pasif';
      statusDot.style.background = '#666';
      this.elements.statusIndicator.style.background = 'rgba(102, 102, 102, 0.1)';
      this.elements.statusIndicator.style.borderColor = '#666';
    }
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
