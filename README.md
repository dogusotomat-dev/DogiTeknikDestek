# Dogi Teknik Destek - AI Destekli Sistem

Doğuş Otomat firmasının Dogi Soft Ice Cream makinaları için geliştirilmiş AI destekli teknik destek sistemidir.

## 🚀 Özellikler

- **AI Destekli Teknik Destek** - Google Gemini AI entegrasyonu
- **Müşteri/Operatör Ayrımı** - Otomatik kullanıcı tipi belirleme
- **Hata Kodu Analizi** - Dogi makine hata kodları için çözüm önerileri
- **Otomatik Mail Sistemi** - Müşteri şikayetleri otomatik bildirim
- **Frontend Only** - Backend gerektirmez
- **Responsive Tasarım** - Mobil uyumlu

## 📋 Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Environment Variables
`.env` dosyası oluşturun:

```env
# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=your_service_id_here
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_here
REACT_APP_EMAILJS_CUSTOMER_TEMPLATE=your_customer_template_id_here
REACT_APP_EMAILJS_OPERATOR_TEMPLATE=your_operator_template_id_here

# Gemini AI Configuration
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Uygulamayı Başlat
```bash
npm start
```

## 🔧 Kullanım

1. Uygulamayı açın
2. "Teknik Desteği Başlat" butonuna tıklayın
3. Müşteri veya operatör olduğunuzu belirtin
4. Sorununuzu açıklayın
5. AI'dan yardım alın

## 🏗️ Proje Yapısı

```
frontend/
├── src/
│   ├── config/aiConfig.js          # AI konfigürasyonu
│   ├── services/aiService.js       # AI servis mantığı
│   ├── App.js                      # Ana uygulama
│   └── index.js                    # Giriş noktası
├── .env                            # API key
└── package.json                    # Bağımlılıklar
```

## 📞 Destek

- **Telefon**: 0538 912 58 58
- **E-posta**: info@dogusotomat.com
- **Web**: dogusotomat.com

## 📄 Lisans

Bu proje Doğuş Otomat firması için özel olarak geliştirilmiştir.

---

**Geliştirici**: Yağız Mert Bilge, Kutay Kılıç  
**Firma**: Doğuş Otomat  
**Versiyon**: 1.0.0
