// Content script for subtitle detection and translation

class SubtitleTranslator {
  constructor() {
    this.settings = {
      enabled: true,
      targetLanguage: 'tr',
      autoTranslate: true,
      showOriginal: false
    };
    this.observer = null;
    this.translationCache = new Map();
    this.lastSubtitle = '';
    this.checkTimeout = null;
    this.isTranslating = false;
    console.log('[Altyazı Çevirici] Başlatıldı');
    this.init();
  }

  async init() {
    // Load settings
    const stored = await chrome.storage.sync.get(['enabled', 'targetLanguage', 'autoTranslate', 'showOriginal']);
    this.settings = { ...this.settings, ...stored };

    if (this.settings.enabled) {
      this.startObserving();
    }

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      for (let key in changes) {
        this.settings[key] = changes[key].newValue;
      }
      
      if (changes.enabled) {
        if (changes.enabled.newValue) {
          this.startObserving();
        } else {
          this.stopObserving();
        }
      }
    });
  }

  startObserving() {
    console.log('[Observer] MutationObserver başlatılıyor...');
    
    this.observer = new MutationObserver((mutations) => {
      this.checkSubtitles();
    });

    // Observe the entire document for subtitle changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log('[Observer] MutationObserver aktif');

    // Debug mode (enable only when needed)
    const DEBUG_MODE = false;
    
    if (DEBUG_MODE && window.location.href.includes('dailymotion')) {
      console.log('[Debug] Dailymotion tespit edildi, detaylı arama başlatılıyor...');
      
      this.debugInterval = setInterval(() => {
        console.log('--- [Debug Tarama] ---');
        
        // Check video element and text tracks
        const videos = document.querySelectorAll('video');
        console.log(`[Debug] Video elementleri: ${videos.length}`);
        videos.forEach((video, i) => {
          const tracks = video.textTracks;
          console.log(`[Debug] Video ${i} text tracks: ${tracks.length}`);
          for (let j = 0; j < tracks.length; j++) {
            const track = tracks[j];
            console.log(`  Track ${j}: ${track.kind} - ${track.label} - ${track.mode}`);
          }
        });
        
        // Search for subtitle containers with various patterns
        const patterns = [
          '[class*="subtitle"]', '[class*="caption"]', '[class*="text-track"]',
          '[class*="timedtext"]', '[class*="cue"]', '[data-testid*="subtitle"]',
          '.dmp-subtitle', '.dmp-caption', 'div[style*="absolute"]'
        ];
        
        patterns.forEach(pattern => {
          const elements = document.querySelectorAll(pattern);
          if (elements.length > 0) {
            elements.forEach(el => {
              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0;
              const text = el.textContent?.trim();
              if (text && text.length > 3 && text.length < 200 && isVisible) {
                console.log(`[Debug] Bulundu! ${pattern}:`, {
                  tag: el.tagName,
                  class: el.className,
                  text: text.substring(0, 50),
                  visible: isVisible
                });
              }
            });
          }
        });
        
        // Check shadow roots
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.shadowRoot) {
            const shadowSubs = el.shadowRoot.querySelectorAll('[class*="subtitle"], [class*="caption"]');
            if (shadowSubs.length > 0) {
              console.log('[Debug] Shadow DOM içinde altyazı bulundu!', shadowSubs);
            }
          }
        });
        
      }, 5000);
    }

    // Initial check
    this.checkSubtitles();
    
    // Periodic check for late-loading subtitles (first 10 seconds)
    if (DEBUG_MODE) {
      let checkCount = 0;
      const intervalCheck = setInterval(() => {
        checkCount++;
        console.log(`[Check ${checkCount}] Manuel kontrol...`);
        this.checkSubtitles();
        if (checkCount >= 10) {
          clearInterval(intervalCheck);
          console.log('[Observer] İlk 10 saniye kontrolü tamamlandı');
        }
      }, 1000);
    }
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debugInterval) {
      clearInterval(this.debugInterval);
      this.debugInterval = null;
    }
    console.log('[Observer] Durduruldu');
  }

  checkSubtitles() {
    // Throttle: Prevent too frequent checks
    if (this.checkTimeout) return;
    
    this.checkTimeout = setTimeout(() => {
      this.checkTimeout = null;
    }, 300);

    // YouTube specific
    const youtubeSubtitles = document.querySelectorAll('.ytp-caption-segment');
    if (youtubeSubtitles.length > 0) {
      const text = Array.from(youtubeSubtitles)
        .map(el => el.textContent)
        .join(' ')
        .trim();
      
      if (text && text !== this.lastSubtitle && text.length > 1) {
        // Normalize text for better comparison
        const normalizedText = text.trim().toLowerCase();
        const normalizedLast = this.lastSubtitle.trim().toLowerCase();
        
        if (normalizedText === normalizedLast) return;
        
        console.log('[Altyazı] YouTube tespit:', text.substring(0, 50));
        this.lastSubtitle = text;
        this.translateAndReplace(youtubeSubtitles, text);
      }
      return;
    }

    // Dailymotion - CRITICAL: Multiple selectors for DMP player
    const dailymotionSelectors = [
      '.dmp-subtitles-line',
      '.dmp-subtitle',
      '[class*="subtitle"]',
      'video + div[class*="subtitle"]',
      'video ~ div[class*="text"]'
    ];
    
    for (const selector of dailymotionSelectors) {
      const dmSubtitles = document.querySelectorAll(selector);
      if (dmSubtitles.length > 0) {
        // Filter to only visible and properly sized elements
        const visibleElements = Array.from(dmSubtitles).filter(el => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const isReasonableSize = rect.width > 100; // At least 100px wide
          const hasText = el.textContent?.trim().length > 1;
          return isVisible && isReasonableSize && hasText;
        });
        
        if (visibleElements.length === 0) continue;
        
        // Use only the first visible element to avoid duplicates
        const bestElement = visibleElements[0];
        const text = bestElement.textContent.trim();
        
        if (text && text !== this.lastSubtitle && text.length > 1) {
          // Normalize and check for duplicates
          const normalizedText = text.trim().toLowerCase();
          const normalizedLast = this.lastSubtitle.trim().toLowerCase();
          
          if (normalizedText === normalizedLast) continue;
          
          console.log('[Altyazı] Dailymotion tespit:', selector, text.substring(0, 50));
          this.lastSubtitle = text;
          this.translateAndReplace([bestElement], text);
          return;
        }
      }
    }

    // Netflix
    const netflixSubtitles = document.querySelectorAll('.player-timedtext-text-container span');
    if (netflixSubtitles.length > 0) {
      const text = Array.from(netflixSubtitles)
        .map(el => el.textContent)
        .join(' ')
        .trim();
      
      if (text && text !== this.lastSubtitle && text.length > 1) {
        console.log('[Altyazı] Netflix tespit:', text.substring(0, 50));
        this.lastSubtitle = text;
        this.translateAndReplace(netflixSubtitles, text);
      }
      return;
    }

    // Generic subtitle detection
    const genericSubtitles = document.querySelectorAll('[class*="caption"], [class*="subtitle"], [class*="timedtext"]');
    for (const element of genericSubtitles) {
      const text = element.textContent.trim();
      if (text && text !== this.lastSubtitle && text.length > 2) {
        console.log('[Altyazı] Genel tespit:', element.className, text.substring(0, 50));
        this.lastSubtitle = text;
        this.translateAndReplace([element], text);
        break;
      }
    }
  }

  async translateAndReplace(elements, text) {
    if (!this.settings.autoTranslate || !text) return;
    
    // CRITICAL: If already translating, skip
    if (this.isTranslating) {
      console.log('[Çeviri] Zaten çeviri yapılıyor, atlanıyor...');
      return;
    }

    // Check if already Turkish (simple heuristic)
    const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
    const targetLang = this.settings.targetLanguage;
    if (targetLang === 'tr' && turkishChars.test(text)) {
      console.log('[Çeviri] Zaten Türkçe, atlanıyor:', text.substring(0, 30));
      return;
    }

    // Check cache
    if (this.translationCache.has(text)) {
      const cached = this.translationCache.get(text);
      console.log('[Çeviri] Önbellekten alındı:', cached.substring(0, 50));
      this.applyTranslation(elements, text, cached);
      return;
    }

    this.isTranslating = true;
    console.log('[Çeviri] İstek gönderiliyor:', text.substring(0, 50));

    // Safety timeout: Reset isTranslating after 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (this.isTranslating) {
        console.warn('[Çeviri] Timeout - isTranslating sıfırlanıyor');
        this.isTranslating = false;
      }
    }, 5000);

    // Request translation from background script
    try {
      chrome.runtime.sendMessage(
        {
          action: 'translate',
          text: text,
          targetLang: this.settings.targetLanguage
        },
        (response) => {
          clearTimeout(safetyTimeout);
          this.isTranslating = false;
          
          if (chrome.runtime.lastError) {
            console.error('[Çeviri] Runtime hatası:', chrome.runtime.lastError);
            return;
          }
          
          if (response && response.success) {
            console.log('[Çeviri] Başarılı:', response.translation.substring(0, 50));
            this.translationCache.set(text, response.translation);
            this.applyTranslation(elements, text, response.translation);
            
            // Update translation count
            chrome.storage.sync.get(['translationCount'], (result) => {
              const count = (result.translationCount || 0) + 1;
              chrome.storage.sync.set({ translationCount: count });
            });
          } else {
            console.error('[Çeviri] Başarısız:', response?.error);
          }
        }
      );
    } catch (error) {
      clearTimeout(safetyTimeout);
      this.isTranslating = false;
      console.error('[Çeviri] Hata:', error);
    }
  }

  applyTranslation(elements, original, translated) {
    console.log('[Uygula] Çeviri uygulanıyor:', translated.substring(0, 50));
    
    // Clean up old overlays first
    this.cleanupOldOverlays();
    
    for (const element of elements) {
      // Store original if not already stored
      if (!element.dataset.originalText) {
        element.dataset.originalText = original;
      }

      // Check if we already created an overlay for this element
      let overlay = element.querySelector('.altyazi-ceviri-overlay');
      
      if (!overlay) {
        // Hide original element
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
        
        // Create overlay container
        overlay = document.createElement('div');
        overlay.className = 'altyazi-ceviri-overlay';
        
        // Position overlay exactly over the subtitle element
        const computedStyle = window.getComputedStyle(element);
        overlay.style.cssText = `
          position: absolute;
          left: ${element.offsetLeft}px;
          top: ${element.offsetTop}px;
          width: ${element.offsetWidth || computedStyle.width};
          height: auto;
          z-index: 999999;
          pointer-events: none;
        `;
        
        // Insert overlay after original element
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(overlay);
      }

      // Update overlay content
      if (this.settings.showOriginal) {
        overlay.innerHTML = `
          <span class="altyazi-ceviri-translated">${this.escapeHtml(translated)}</span>
          <span class="altyazi-ceviri-original">${this.escapeHtml(original)}</span>
        `;
      } else {
        overlay.innerHTML = `
          <span class="altyazi-ceviri-translated">${this.escapeHtml(translated)}</span>
        `;
      }

      // Mark as translated
      element.classList.add('altyazi-ceviri-active');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  cleanupOldOverlays() {
    // Remove all existing overlays
    const overlays = document.querySelectorAll('.altyazi-ceviri-overlay');
    overlays.forEach(overlay => {
      overlay.remove();
    });
    
    // Reset opacity of hidden elements
    const hiddenElements = document.querySelectorAll('.altyazi-ceviri-active');
    hiddenElements.forEach(el => {
      el.style.opacity = '';
      el.style.pointerEvents = '';
      el.classList.remove('altyazi-ceviri-active');
    });
  }
}

// Initialize the translator
const translator = new SubtitleTranslator();
