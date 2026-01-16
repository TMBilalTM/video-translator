// Background service worker for extension

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    targetLanguage: 'tr',
    autoTranslate: true,
    showOriginal: false
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translateText(request.text, request.targetLang)
      .then(translation => sendResponse({ success: true, translation }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Translation function using Google Translate API
async function translateText(text, targetLang = 'tr') {
  if (!text || text.trim() === '') return text;

  console.log('[Background] Çeviri isteği:', text.substring(0, 50), '-> ', targetLang);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Background] API yanıtı alındı');
    
    if (data && data[0]) {
      const translation = data[0].map(item => item[0]).filter(Boolean).join('');
      console.log('[Background] Çeviri tamamlandı:', translation.substring(0, 50));
      return translation;
    }
    
    console.warn('[Background] Geçersiz API yanıtı, orijinal döndürülüyor');
    return text;
  } catch (error) {
    console.error('[Background] Çeviri hatası:', error);
    return text;
  }
}
