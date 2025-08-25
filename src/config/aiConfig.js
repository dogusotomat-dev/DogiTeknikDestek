export const AI_CONFIG = {
    API_KEY: process.env.REACT_APP_GEMINI_API_KEY || '',
    
    // DÜŞÜK TOKEN KULLANIMI İÇİN OPTİMİZE EDİLMİŞ
    MODEL_CONFIG: {
      model: 'gemini-2.0-flash-exp', // Experimental sürüm daha kararlı
      temperature: 0.3,    // Düşük = tutarlı yanıtlar
      topP: 0.7,          // Düşük = gereksiz detayları engeller
      topK: 20,           // Düşük = odaklı yanıtlar
      maxOutputTokens: 500, // DÜŞÜK LİMİT = kısa ve öz yanıtlar
    },
    
    // GÜVENLİK AYARLARI - Blokları kaldır
    SAFETY_SETTINGS: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE'
      }
    ],
    
    // MAKİNE BİLGİLERİ
    MACHINE_INFO: {
      brand: 'Dogi',
      type: 'Soft Ice Cream Machine',
      supportPhone: '0538 912 58 58',
      email: 'info@dogusotomat.com'
    }
  };
  
  // MİNİMAL PROMPTLAR - Token tasarrufu için
  export const MINIMAL_PROMPTS = {
    CUSTOMER_FIRST: `Sen Dogi dondurma makinesi müşteri destek botusun.
  
  GÖREV: Sadece 2 bilgi topla:
  1) İade işlemi yapıldı mı?
  2) Makine seri numarası? (ekranın sol üst köşesinde)
  
  YASAK: Ödeme tarihi, konum, ürün türü, dekont, tutar sorma!`,
  
    OPERATOR_FIRST: `Sen Dogi dondurma makinesi operatör destek botusun.
  
  GÖREV: Hata kodu analizi ve çözüm öner.`,
  
    CUSTOMER_FOLLOWUP: `Müşteri destek botu. Sadece iade durumu ve seri numara sor.`,
    
    OPERATOR_FOLLOWUP: `Operatör destek botu. Hata analizi yap.`
  };
  
  // YASAKLI SORULAR - Engellenmesi gereken ifadeler
  export const FORBIDDEN_QUESTIONS = [
    'hangi dondurma', 'ne zaman', 'hangi konum', 'hangi şube',
    'dekont', 'ödeme tarihi', 'tutar', 'hangi ürün', 'nasıl ödeme',
    'sipariş numarası', 'hangi platform', 'ne kadar ödeme'
  ];
  
  // HIZLI YANITLAR - Hazır template'ler
  export const QUICK_RESPONSES = {
    CUSTOMER_REFUND_INFO: `İade işlemi 5 iş günü içerisinde otomatik olarak yapılmaktadır. Banka hesabınızı kontrol etmenizi rica ederiz.`,
    
    CUSTOMER_SERIAL_REQUEST: `Makine seri numarası ekranın sol üst köşesinde yazılıdır (örnek: 2503180076). 10 haneli rakam formatındadır.`,
    
    TECHNICAL_SUPPORT: `Doğuş Otomat teknik destek: 0538 912 58 58 veya teknik@dogusotomat.com`,
    
    FALLBACK: `Üzgünüm, şu anda yardımcı olamıyorum. Doğrudan 0538 912 58 58 numarasını arayabilirsiniz.`
  };