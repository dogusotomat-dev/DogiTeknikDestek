import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmailService } from './emailService.js';

export class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.model = null;
    this.isInitialized = false;
    this.chatHistory = [];
    this.userType = null;
    this.customerInfo = {
      machineSerial: null,
      issueDate: null,
      complaint: null,
      contactInfo: null
    };
    
    this.operatorInfo = {
      machineSerial: null,
      errorCode: null
    };
    
    // Rate limiting için
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.maxRequestsPerMinute = 10;
    
    // EmailJS servisini başlat
    this.emailService = new EmailService();
    
    // EmailJS yapılandırmasını kontrol et
    this.emailService.getStatus();
    
    // Chat history'yi localStorage'dan yükle
    this.loadChatHistory();
    
    // AI'ı başlat (async olarak)
    this.initializeAI().catch(() => {
      // Hata durumunda sessizce devam et
    });
  }

  async initializeAI() {
    try {
      if (!this.apiKey) {
        console.error('API anahtarı bulunamadı');
        return false;
      }

      const genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.1,  // Çok düşük - deterministik yanıtlar
          topK: 10,          // Çok düşük - sadece en iyi seçenekler
          topP: 0.5,         // Çok düşük - gereksiz detay yok
          maxOutputTokens: 300,  // DAHA DA DÜŞÜK - maksimum tasarruf
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      });

      await this.model.generateContent('test');
      this.isInitialized = true;
      return true;

    } catch (error) {
      return false;
    }
  }

  async getResponse(userMessage) {
    try {
      if (!this.isInitialized) {
        return 'AI servisi henüz başlatılamadı. Lütfen birkaç saniye bekleyin ve tekrar deneyin.';
      }

      // Rate limiting kontrolü
      const now = Date.now();
      if (now - this.lastRequestTime < 60000) { // 1 dakika içinde
        if (this.requestCount >= this.maxRequestsPerMinute) {
          return '⚠️ Çok fazla istek yapıldı. Lütfen 1 dakika bekleyin ve tekrar deneyin.';
        }
      } else {
        // 1 dakika geçti, sayacı sıfırla
        this.requestCount = 0;
        this.lastRequestTime = now;
      }
      
      this.requestCount++;

      // Kullanıcı tipini belirle (sadece ilk mesajda)
      if (!this.userType) {
        this.userType = this.determineUserType(userMessage);
        this.conversationStep = 'type_determined';
      }

      // ULTRA MINIMAL PROMPT - Maximum token tasarrufu
      let response = await this.processUserInput(userMessage);
      
      // AI yanıtını kontrol et ve gereksiz bilgi isterse düzelt
      response = this.validateAIResponse(response, userMessage);
      
      // Chat history'ye ekle
      this.chatHistory.push(
        { role: 'user', content: userMessage },
        { role: 'model', content: response }
      );

      // Chat history'yi localStorage'a kaydet
      this.saveChatHistory();

      // AI yanıtında "Raporunuz iletildi" varsa mail gönder (sadece conversation tamamlandığında)
      if (response.includes('Raporunuz') && response.includes('iletildi') && this.conversationStep === 'completed') {
        // Customer info'yu güncelle
        this.updateCustomerInfo(userMessage, response);
        
        // Sadece seri numara ve tarih varsa mail gönder
        if (this.customerInfo.machineSerial && this.customerInfo.issueDate) {
          await this.sendCustomerComplaintEmail();
        }
      }

      return response;

    } catch (error) {
      return this.getErrorResponse(error);
    }
  }

  // TOKEN TASARRUFİ İÇİN KURAL TABANLI SİSTEM
  async processUserInput(userMessage) {
    const input = userMessage.toLowerCase();

    if (this.userType === 'customer') {
      return this.handleCustomer(input, userMessage);
    } else {
      return await this.handleOperator(input, userMessage);
    }
  }

  handleCustomer(input, originalMessage) {
    // Müşteri akışı - sadece gerekli bilgileri topla
    switch (this.conversationStep) {
      case 'type_determined':
        if (input.includes('alamadım') || input.includes('gelmedi') || input.includes('iade')) {
          this.conversationStep = 'ask_refund_status';
          return `🔍 DONDURMA ALMA SORUNU TESPİT EDİLDİ

❓ İade işlemi yapıldı mı? 
• Banka hesabınızı kontrol ettiniz mi?
• Para iadesi geldi mi?

"Evet para geldi" veya "Hayır para gelmedi" şeklinde yanıtlayın.`;
        }
        return this.getGeneralCustomerHelp();

      case 'ask_refund_status':
        if (input.includes('geldi') || input.includes('evet') || input.includes('yapıldı')) {
          return `✅ İade işleminiz tamamlanmış.

🤔 Başka bir sorunuz var mı?
📞 **Destek:** 0538 912 58 58`;
        } else {
          this.conversationStep = 'ask_machine_serial';
          return `❌ İade henüz yapılmamış.

📱 Makine seri numarası nedir?
• Ekranın sol üst köşesinde 10 haneli numara
• Örnek: 2503180076

Seri numarayı yazın:`;
        }

      case 'ask_machine_serial':
        const serialMatch = originalMessage.match(/\b\d{10}\b/);
        if (serialMatch) {
          this.customerInfo.machineSerial = serialMatch[0];
          this.conversationStep = 'ask_issue_date';
          return `✅ Seri numara kaydedildi: ${serialMatch[0]}

📅 İşlem tarih-saati nedir?
• Örnek: "23.01.2025 14:30"
• Veya "dün saat 15:00"

Tarih ve saati yazın:`;
        } else {
          return `❌ Seri numara bulunamadı.

🔍 Lütfen makine ekranının sol üst köşesindeki 10 haneli numarayı yazın.
Örnek: 2503180076`;
        }

      case 'ask_issue_date':
        this.customerInfo.issueDate = originalMessage;
        this.conversationStep = 'completed';
        
        // E-posta raporu oluştur
        const report = this.generateCustomerReport();
        
        return `✅ BİLGİLERİNİZ KAYDED İLDİ

📧 **Raporunuz info@dogusotomat.com adresine iletildi:**
• Seri No: ${this.customerInfo.machineSerial}
• Tarih: ${this.customerInfo.issueDate}
• Sorun: İade işlemi yapılmadı

⏱️ **İade süreci:** 5 iş günü içinde otomatik yapılır

📞 **Takip:** 0538 912 58 58`;

      default:
        return this.getGeneralCustomerHelp();
    }
  }

  async handleOperator(input, originalMessage) {
    // Operatör akışı - teknik destek
    switch (this.conversationStep) {
      case 'type_determined':
        this.conversationStep = 'ask_machine_serial_op';
        return `🔧 OPERATÖR DESTEK AKTIF

📱 İlk olarak makine seri numarası?
• Ekranın sol üst köşesi: 10 haneli numara
• Örnek: 2503180076`;

      case 'ask_machine_serial_op':
        const serialMatch = originalMessage.match(/\b\d{10}\b/);
        if (serialMatch) {
          this.operatorInfo.machineSerial = serialMatch[0];
          this.conversationStep = 'ask_error_code';
          return `✅ Seri: ${serialMatch[0]}

❓ Hata kodu var mı?
• Örnek: "03", "240", "16" 
• Hata kodu yoksa "yok" yazın
• Arıza tarifi de yazabilirsiniz`;
        } else {
          return `❌ Seri numara bulunamadı. 10 haneli numarayı yazın.`;
        }

      case 'ask_error_code':
        const solution = this.findTechnicalSolution(input, originalMessage);
        if (solution) {
          return solution;
        } else {
          // Çözüm bulunamadı - rapor gönder
          this.generateOperatorReport(originalMessage);
          
          // Operatör raporu maili gönder
          await this.sendOperatorReportEmail(originalMessage);
          
          return `📧 **RAPOR İLETİLDİ**

Arıza kaydınız teknik@dogusotomat.com adresine gönderildi:
• Seri: ${this.operatorInfo.machineSerial}
• Sorun: ${originalMessage}

📞 **Acil:** 0538 912 58 58`;
        }

      default:
        return `🔧 Operatör destek aktif. Seri numarası ve hata kodunu belirtin.`;
    }
  }

  findTechnicalSolution(input, originalMessage) {
    // Hata kodu kontrolü
    const errorCodeMatch = originalMessage.match(/\b(\d{1,3})\b/);
    if (errorCodeMatch) {
      const code = errorCodeMatch[1].padStart(2, '0');
      return this.getErrorCodeSolution(code);
    }

    // Yaygın sorunlar için hızlı çözüm
    if (input.includes('dondurma') && (input.includes('çıkmıyor') || input.includes('gelmiyor'))) {
      return `🦦 DONDURMA SORUNU

**HIZLI ÇÖZÜM:**
1. Machine Settings → Mode → "Automatic" 
2. Karışım deposu dolu mu?
3. Makineyi kapat-aç (30sn bekle)

**KONTROL ET:**
• Hata kodu var mı ekranda?
• 03: Dondurma sistemi kapalı
• 05: Dondurma modülü hatası

📞 **Devam ederse:** 0538 912 58 58`;
    }

    if (input.includes('bardak')) {
      return `🥤 BARDAK SORUNU  

**ÇÖZÜM:**
1. Bardak stoğu kontrol
2. Sıkışma var mı kontrol
3. Bardak yolunu temizle

**HATA KODLARI:**
• 16-17: Sensör problemi
• 19: Bardak tespit edilmiyor

📞 **Destek:** 0538 912 58 58`;
    }

    return null; // Çözüm bulunamadı
  }

  getErrorCodeSolution(code) {
    const errorCodes = {
      '01': '🍯 REÇEL EKSİKLİĞİ\n• Reçel deposunu doldurun\n• Hortum bağlantısını kontrol edin',
      '03': '🦦 DONDURMA SİSTEMİ KAPALI\n• Machine Settings → Mode → "Automatic"\n• Makineyi yeniden başlatın',
      '05': '⚠️ DONDURMA MODÜLÜ HATASI\n• Makineyi kapat, 5dk bekle, aç\n• Devam ederse servis: 0538 912 58 58',
      '17': '👁️ BARDAK SENSÖR SORUNU\n• Sensörü temizleyin\n• Leke kontrolü yapın',
      '19': '🥤 BARDAK SORUNU\n• Bardak stoğu kontrol edin\n• Yeni bardak ekleyin',
      '25': '🥤 BARDAK SORUNU\n• Bardak dispanseri sıkışması\n• Sıkışan bardakları temizleyin',
      '240': '💾 BELLEK HATASI\n• ACIL SERVİS: 0538 912 58 58\n• Veri kaybı riski!'
    };

    if (errorCodes[code]) {
      return `🔧 HATA KODU: ${code}\n\n${errorCodes[code]}\n\n📞 **Destek:** 0538 912 58 58`;
    }

    return `❓ Bilinmeyen hata kodu: ${code}\n\n📧 Rapor teknik@dogusotomat.com adresine iletildi\n📞 **Acil:** 0538 912 58 58`;
  }

  determineUserType(userInput) {
    const input = userInput.toLowerCase();
    
    if (input.includes('müşteri') || input.includes('alamadım') || 
        input.includes('para') || input.includes('iade')) {
      return 'customer';
    }
    
    if (input.includes('operatör') || input.includes('hata') || 
        input.includes('arıza') || input.includes('tekniker')) {
      return 'operator';  
    }
    
    return 'customer'; // Varsayılan
  }

  getGeneralCustomerHelp() {
    return `🎯 DOGI MÜŞTERİ DESTEK

Sorununuz nedir?
• "Dondurma alamadım" 
• "Para iadesi gelmedi"
• "Makine bozuk"

📞 **Direkt Destek:** 0538 912 58 58`;
  }

  generateCustomerReport() {
    return {
      to: 'info@dogusotomat.com',
      subject: `İade Talebi - Seri: ${this.customerInfo.machineSerial}`,
      body: `Makine Seri: ${this.customerInfo.machineSerial}
İşlem Tarihi: ${this.customerInfo.issueDate}
Sorun: İade işlemi yapılmadı
Durum: 5 iş günü içinde otomatik iade yapılacak`
    };
  }

  generateOperatorReport(issueDescription) {
    return {
      to: 'teknik@dogusotomat.com', 
      subject: `Teknik Arıza - Seri: ${this.operatorInfo.machineSerial}`,
      body: `Makine Seri: ${this.operatorInfo.machineSerial}
Arıza Tarifi: ${issueDescription}
Operatör Raporu: Teknik müdahale gerekli`
    };
  }

  getErrorResponse(error) {
    if (error.message.includes('QUOTA')) {
      return '⚠️ API kotası doldu. Lütfen daha sonra tekrar deneyin.';
    }
    if (error.message.includes('429') || error.status === 429) {
      return '⚠️ Çok fazla istek yapıldı. Lütfen 1 dakika bekleyin ve tekrar deneyin.';
    }
    if (error.message.includes('API_KEY')) {
      return '⚠️ API anahtarı hatası. Lütfen yönetici ile iletişime geçin.';
    }
    return '⚠️ Teknik sorun yaşıyorum. Direkt 0538 912 58 58 arayın.';
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasApiKey: !!this.apiKey,
      userType: this.userType,
      chatHistoryLength: 0, // Hiç chat history tutmuyoruz
      customerInfo: this.customerInfo,
      operatorInfo: this.operatorInfo,
      conversationStep: this.conversationStep
    };
  }

  clearChatHistory() {
    this.userType = null;
    this.customerInfo = { machineSerial: null, issueDate: null, complaint: null, contactInfo: null };
    this.operatorInfo = { machineSerial: null, errorCode: null };
    this.conversationStep = 'initial';
  }

  // Müşteri şikayet maili gönder
  async sendCustomerComplaintEmail() {
    try {
      // EmailJS servisinin durumunu kontrol et
      const emailStatus = this.emailService.getStatus();
      
      if (!emailStatus.configured) {
        return { success: false, message: 'EmailJS yapılandırılmamış' };
      }

      // Sadece gerekli bilgiler varsa mail gönder
      if (!this.customerInfo.machineSerial || !this.customerInfo.issueDate) {
        return { success: false, message: 'Seri numara veya tarih eksik' };
      }

      const customerInfo = {
        machineSerial: this.customerInfo.machineSerial,
        issueDate: this.customerInfo.issueDate,
        complaint: 'Dondurma alınamadı - İade işlemi yapılmadı'
      };
      
      // EmailJS servisini kullanarak mail gönder
      const result = await this.emailService.sendCustomerReport(customerInfo);
      
      if (result.success) {
        return result;
      } else {
        return result;
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Operatör teknik rapor maili gönder
  async sendOperatorReportEmail(issueDescription) {
    try {
      const operatorInfo = {
        machineSerial: this.operatorInfo.machineSerial || 'Belirtilmemiş',
        errorCode: this.operatorInfo.errorCode || 'Belirtilmemiş'
      };

      const result = await this.emailService.sendOperatorReport(operatorInfo, issueDescription);
      
      if (result.success) {
        return result;
      } else {
        return result;
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Chat history'yi localStorage'a kaydet
  saveChatHistory() {
    try {
      localStorage.setItem('dogi_chat_history', JSON.stringify(this.chatHistory));
    } catch (error) {
      // Hata durumunda sessizce devam et
    }
  }

  // Chat history'yi localStorage'dan yükle
  loadChatHistory() {
    try {
      const saved = localStorage.getItem('dogi_chat_history');
      if (saved) {
        this.chatHistory = JSON.parse(saved);
      }
    } catch (error) {
      this.chatHistory = [];
    }
  }

  // AI yanıtını kontrol et ve gereksiz bilgi isterse düzelt
  validateAIResponse(response, userMessage) {
    const input = userMessage.toLowerCase();
    if (this.userType === 'customer') {
      if (response.includes('seri numarası') && !this.customerInfo.machineSerial) {
        return `📱 Makine seri numarası nedir?
• Ekranın sol üst köşesinde 10 haneli numara
• Örnek: 2503180076

Seri numarayı yazın:`;
      }
      if (response.includes('işlem tarih-saati') && !this.customerInfo.issueDate) {
        return `📅 İşlem tarih-saati nedir?
• Örnek: "23.01.2025 14:30"
• Veya "dün saat 15:00"

Tarih ve saati yazın:`;
      }
    }
    return response;
  }



  // AI yanıtında "Raporunuz iletildi" varsa customer info'yu güncelle
  updateCustomerInfo(userMessage, response) {
    if (this.userType === 'customer') {
      if (response.includes('seri numarası') && response.includes('kaydedildi')) {
        const serialMatch = userMessage.match(/\b\d{10}\b/);
        if (serialMatch) {
          this.customerInfo.machineSerial = serialMatch[0];
        }
      }
      if (response.includes('işlem tarih-saati') && response.includes('kaydedildi')) {
        this.customerInfo.issueDate = userMessage;
      }
    }
  }
}

// Default export - App.js'de import edilebilmesi için
export default AIService;