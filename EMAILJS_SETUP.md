# EmailJS Kurulum Rehberi

## 🔧 EmailJS Hesap Kurulumu

### 1. Hesap Oluşturma
- [EmailJS.com](https://www.emailjs.com/) adresine gidin
- "Sign Up" ile ücretsiz hesap oluşturun
- E-posta adresinizi doğrulayın

### 2. Mail Servisi Kurulumu
- Dashboard'da "Email Services" sekmesine gidin
- "Add New Service" butonuna tıklayın
- "SMTP" seçeneğini seçin
- SMTP bilgilerinizi girin

### 3. Mail Template Oluşturma
- "Email Templates" sekmesine gidin
- "Create New Template" butonuna tıklayın
- Template adı: `dogi_support`
- **TEMİZ TEMPLATE** kullanın:

```html
Subject: {{subject}}

Sevgili Doğuş Otomat Ekibi,

{{message}}

Saygılarımla,
Dogi AI Teknik Destek Botu
```

**ÖNEMLİ:** Template'de sadece `{{subject}}` ve `{{message}}` parametrelerini kullanın.

### 4. Public Key Alma
- Dashboard'da "Account" sekmesine gidin
- "API Keys" bölümünden "Public Key"i kopyalayın

### 5. .env Dosyasını Güncelleme
`.env` dosyasına şu satırı ekleyin:

```env
REACT_APP_EMAILJS_PUBLIC_KEY=YOUR_ACTUAL_PUBLIC_KEY_HERE
```

**ÖNEMLİ:** `YOUR_ACTUAL_PUBLIC_KEY_HERE` kısmını EmailJS'den aldığınız gerçek public key ile değiştirin.

### 6. Uygulamayı Yeniden Başlatma
- Değişikliklerin etkili olması için uygulamayı yeniden başlatın:
```bash
npm start
```

## 🧪 Test Etme

1. Uygulamayı başlatın
2. "Test Mail Gönder" butonuna tıklayın
3. Console'da EmailJS loglarını kontrol edin
4. Mail Test Paneli'nde gönderilen mailleri görün

## 🔒 Güvenlik

- SMTP bilgileri güvenli şekilde saklanır
- EmailJS üzerinden güvenli mail gönderimi
- LocalStorage'da mail logları tutulur

## 🚨 Sorun Giderme

### 422 Hatası (En Yaygın)
- **Sebep**: Template parametreleri uyumsuzluğu
- **Çözüm**: Template'de sadece `{{subject}}` ve `{{message}}` kullanın
- **Kontrol**: EmailJS dashboard'da template parametrelerini kontrol edin

### Public Key Hatası
- .env dosyasında `REACT_APP_EMAILJS_PUBLIC_KEY` doğru ayarlandı mı?
- Uygulama yeniden başlatıldı mı?

### Template Parametreleri
- Template'de sadece gerekli parametreleri kullanın
- Fazla parametre 422 hatasına neden olur
- Basit template ile başlayın, sonra geliştirin
