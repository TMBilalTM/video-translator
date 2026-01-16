# Altyazı Çevirmeni - Tarayıcı Eklentisi

Video altyazılarını otomatik olarak Türkçe'ye (veya istediğiniz dile) çeviren güçlü bir tarayıcı eklentisi.

## Özellikler

✨ **Otomatik Çeviri**: Video altyazıları gerçek zamanlı olarak otomatik çevrilir
🎯 **Çoklu Platform Desteği**: YouTube, Netflix, Amazon Prime ve daha fazlası
🌍 **11 Farklı Dil**: Türkçe, İngilizce, Almanca, Fransızca ve daha fazlası
⚡ **Hızlı & Hafif**: Minimum kaynak kullanımı, maksimum performans
🎨 **Modern Arayüz**: Brutalist minimal tasarım
💾 **Önbellek Sistemi**: Aynı cümleleri tekrar çevirmez, hızlıdır
👁️ **Orijinal Metin**: İsteğe bağlı olarak orijinal metni de gösterebilir

## Kurulum

### Chrome/Edge için:

1. Bu repoyu indirin veya ZIP olarak çıkarın
2. Chrome/Edge'de `chrome://extensions/` adresine gidin
3. Sağ üstteki "Geliştirici modu"nu etkinleştirin
4. "Paketlenmemiş uzantı yükle" butonuna tıklayın
5. İndirdiğiniz klasörü seçin

### Firefox için:

1. `about:debugging#/runtime/this-firefox` adresine gidin
2. "Geçici Eklenti Yükle"ye tıklayın
3. manifest.json dosyasını seçin

## Kullanım

1. Eklentiyi yükledikten sonra tarayıcı toolbar'ında ikonu görünecek
2. İkona tıklayarak ayarlar panelini açın
3. "Otomatik Çeviri" seçeneğini etkinleştirin
4. Hedef dili seçin (varsayılan: Türkçe)
5. Bir video sitesine gidin ve altyazılı video izleyin
6. Altyazılar otomatik olarak çevrilecek!

## Desteklenen Platformlar

- ✅ YouTube
- ✅ Netflix
- ✅ Amazon Prime Video
- ✅ Genel HTML5 video oynatıcılar
- ✅ video.js tabanlı oynatıcılar

## Ayarlar

- **Otomatik Çeviri**: Çeviriyi etkinleştir/devre dışı bırak
- **Hedef Dil**: Çeviri yapılacak dili seçin
- **Orijinal Metni Göster**: Çeviri ile birlikte orijinal altyazıyı da göster

## Teknik Detaylar

- **Manifest Version**: 3
- **Çeviri API**: Google Translate (ücretsiz endpoint)
- **Önbellek**: Map tabanlı hafıza önbelleği
- **Observer**: MutationObserver ile gerçek zamanlı tespit

## Gizlilik

- Bu eklenti hiçbir kişisel veri toplamaz
- Çeviriler Google Translate API üzerinden yapılır
- Sadece altyazı metinleri işlenir

## Geliştirme

```bash
# Dosya yapısı
ceviri/
├── manifest.json       # Eklenti yapılandırması
├── background.js       # Service worker (çeviri API)
├── content.js          # Altyazı tespiti ve değiştirme
├── content.css         # Altyazı stilleri
├── popup.html          # Ayarlar arayüzü
├── popup.css           # Popup stilleri
├── popup.js            # Popup fonksiyonları
└── icons/              # İkon dosyaları
```

## Lisans

MIT

## Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır! Büyük değişiklikler için lütfen önce bir issue açın.

---

**Not**: Bu eklenti eğitim amaçlıdır ve ücretsiz Google Translate endpoint'ini kullanır. Yoğun kullanımda sınırlamalarla karşılaşılabilir.
