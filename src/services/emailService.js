// EmailJS servis entegrasyonu
// npm install @emailjs/browser

import emailjs from '@emailjs/browser';

export class EmailService {
  constructor() {
    // EmailJS ayarları - .env dosyasına ekleyin
    this.serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    this.publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    
    // Template ID'leri
    this.customerTemplateId = process.env.REACT_APP_EMAILJS_CUSTOMER_TEMPLATE;
    this.operatorTemplateId = process.env.REACT_APP_EMAILJS_OPERATOR_TEMPLATE;
    
    if (this.serviceId && this.publicKey) {
      emailjs.init(this.publicKey);
    }
  }

  async sendCustomerReport(customerInfo) {
    if (!this.isConfigured()) {
      return { success: false, message: 'Mail servisi yapılandırılmamış' };
    }

    try {
      // EmailJS standart template parametreleri
      const templateParams = {
        to_name: 'Doğuş Otomat Ekibi',
        to_email: 'info@dogusotomat.com',
        from_name: 'Dogi AI Destek Sistemi',
        reply_to: 'noreply@dogusotomat.com',
        subject: `İade Talebi - Seri: ${customerInfo.machineSerial}`,
        message: `

Müşteri İade Talebi:
- Makine Seri Numarası: ${customerInfo.machineSerial}
- İşlem Tarihi: ${customerInfo.issueDate}
- Sorun: Dondurma alındı ancak iade işlemi yapılmadı
- Sistem Notu: 5 iş günü içinde otomatik iade yapılmalı
- Talep Zamanı: ${new Date().toLocaleString('tr-TR')}

Saygılarımızla,
        `
      };

      const result = await emailjs.send(
        this.serviceId,
        this.customerTemplateId,
        templateParams
      );

      return { success: true, messageId: result.text };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendOperatorReport(operatorInfo, issueDescription) {
    if (!this.isConfigured()) {
      return { success: false, message: 'Mail servisi yapılandırılmamış' };
    }

    try {
      // EmailJS standart template parametreleri
      const templateParams = {
        to_name: 'Teknik Destek Ekibi',
        to_email: 'teknik@dogusotomat.com',
        from_name: 'Dogi AI Destek Sistemi',
        reply_to: 'noreply@dogusotomat.com',
        subject: `Teknik Arıza - Seri: ${operatorInfo.machineSerial}`,
        message: `

Operatör Teknik Raporu:
- Makine Seri Numarası: ${operatorInfo.machineSerial}
- Hata Kodu: ${operatorInfo.errorCode || 'Yok/Belirtilmedi'}
- Arıza Tarifi: ${issueDescription}
- Durum: Teknik müdahale gerekli
- Rapor Zamanı: ${new Date().toLocaleString('tr-TR')}

Saygılarımızla,
        `
      };

      const result = await emailjs.send(
        this.serviceId,
        this.operatorTemplateId,
        templateParams
      );

      return { success: true, messageId: result.text };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isConfigured() {
    return !!(this.serviceId && this.publicKey && this.customerTemplateId && this.operatorTemplateId);
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      serviceId: !!this.serviceId,
      publicKey: !!this.publicKey,
      templates: {
        customer: !!this.customerTemplateId,
        operator: !!this.operatorTemplateId
      }
    };
  }
}

// Alternatif: Basit fetch ile kendi backend'inize gönderme
export class SimpleEmailService {
  constructor() {
    this.backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  }

  async sendCustomerReport(customerInfo) {
    try {
      const response = await fetch(`${this.backendUrl}/api/send-customer-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'info@dogusotomat.com',
          subject: `İade Talebi - Seri: ${customerInfo.machineSerial}`,
          machineSerial: customerInfo.machineSerial,
          issueDate: customerInfo.issueDate,
          issueType: 'İade işlemi yapılmadı',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendOperatorReport(operatorInfo, issueDescription) {
    try {
      const response = await fetch(`${this.backendUrl}/api/send-operator-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'teknik@dogusotomat.com',
          subject: `Teknik Arıza - Seri: ${operatorInfo.machineSerial}`,
          machineSerial: operatorInfo.machineSerial,
          errorCode: operatorInfo.errorCode,
          issueDescription: issueDescription,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Webhook servisi - Netlify/Vercel functions için
export class WebhookEmailService {
  constructor() {
    this.webhookUrl = process.env.REACT_APP_WEBHOOK_URL;
  }

  async sendCustomerReport(customerInfo) {
    if (!this.webhookUrl) {
      return { success: false, message: 'Webhook yapılandırılmamış' };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'customer_report',
          data: customerInfo,
          timestamp: new Date().toISOString()
        })
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendOperatorReport(operatorInfo, issueDescription) {
    if (!this.webhookUrl) {
      return { success: false, message: 'Webhook yapılandırılmamış' };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'operator_report',
          data: { operatorInfo, issueDescription },
          timestamp: new Date().toISOString()
        })
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
