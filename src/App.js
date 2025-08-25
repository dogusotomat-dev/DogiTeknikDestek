import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AIService from './services/aiService';

// AI servis instance'ı oluştur
const aiService = new AIService();

const MessageModal = ({ message, icon, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="glass-effect rounded-2xl p-8 max-w-md w-full mx-4 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-gray-800 mb-6 font-medium">{message}</p>
      <button 
        onClick={onClose}
        className="btn-primary text-white px-6 py-3 rounded-xl font-semibold"
      >
        Tamam
      </button>
    </div>
  </div>
);

const ChatSection = ({ chatHistory, onSendMessage, loading, aiStatus }) => {
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef(null);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="space-y-4">
      {/* AI Durum Göstergesi */}
      <div className="mb-6 text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full ${
          aiStatus.isInitialized ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          <div className={`w-3 h-3 rounded-full mr-2 animate-pulse ${
            aiStatus.isInitialized ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className={`font-medium ${
            aiStatus.isInitialized ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {aiStatus.isInitialized ? '🤖 AI Aktif - Akıllı Teknik Destek' : '🔧 AI Başlatılıyor...'}
          </span>
        </div>
        
        {aiStatus.isInitialized && (
          <div className="mt-2 text-xs text-gray-500">
            💡 Token optimizasyonu aktif - Verimli sohbet
          </div>
        )}
        
        {aiStatus.userType && (
          <div className="mt-2 text-sm font-medium">
            {aiStatus.userType === 'customer' ? '👤 Müşteri Modu' : '🔧 Operatör Modu'}
            <span className="ml-2 text-xs text-gray-500">
              ({aiStatus.chatHistoryLength} mesaj geçmişi)
            </span>
          </div>
        )}
      </div>
      
      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="chat-container rounded-2xl p-6 h-96 overflow-y-auto mb-4 scroll-smooth"
      >
        {chatHistory.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-2xl max-w-4xl mb-4 shadow-sm ${
              msg.role === 'user' ? 'user-message ml-auto' : 'ai-message'
            }`}
          >
            <strong>{msg.role === 'user' ? '👤 Siz:' : '🤖 Dogi AI:'}</strong>
            <br />
            <div className="mt-2">
              {/* Mesaj içeriğini güvenli şekilde göster */}
              {msg.content ? (
                msg.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))
              ) : (
                <span className="text-gray-500 italic">Mesaj yüklenemedi</span>
              )}
            </div>
            <div className={`text-xs text-gray-400 mt-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
              {new Date().toLocaleTimeString('tr-TR')}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Mesaj Giriş Alanı */}
      <div className="flex gap-3 p-4 glass-effect rounded-2xl">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
          placeholder={
            !aiStatus.userType 
              ? "Müşteri misiniz yoksa operatör müsünüz?" 
              : aiStatus.userType === 'customer'
                ? "Dondurma alamadınız mı? Sorununuzu açıklayın..."
                : "Hata kodunuzu veya teknik sorununuzu belirtin..."
          }
          className="input-field flex-grow p-4 rounded-xl focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !message.trim()}
          className="btn-primary text-white px-6 py-4 rounded-xl font-semibold whitespace-nowrap disabled:opacity-50"
        >
          {loading ? '⏳ Analiz...' : '📤 Gönder'}
        </button>
      </div>
      
      {/* Yükleme Göstergesi */}
      {loading && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-600 font-medium">
              {aiStatus.userType === 'customer' 
                ? 'AI müşteri desteği analiz ediyor...' 
                : 'AI teknik çözüm üretiyor...'
              }
            </span>
          </div>
        </div>
      )}

      {/* Hızlı İpuçları */}
      {!aiStatus.userType && chatHistory.length <= 2 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Hızlı Başlangıç:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button 
              onClick={() => setMessage('Müşteri - Dondurma alamadım')}
              className="text-left p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors"
            >
              👤 Müşteri Desteği
            </button>
            <button 
              onClick={() => setMessage('Operatör - Hata kodu var')}
              className="text-left p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors"
            >
              🔧 Operatör Desteği
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FeaturesSection = () => (
  <div className="grid md:grid-cols-3 gap-6 mb-8">
    {[
      { icon: '🤖', title: 'AI Destekli', desc: 'Gemini-2.0-flash ile optimize edilmiş akıllı çözümler' },
      { icon: '⚡', title: 'Hızlı Yanıt', desc: 'Düşük token kullanımı ile hızlı ve etkili destek' },
      { icon: '🎯', title: 'Odaklı Sistem', desc: 'Gereksiz sorular engellenir, sadece çözüm odaklı' }
    ].map((feature, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="feature-card p-6 rounded-xl text-center"
      >
        <div className="text-3xl mb-3">{feature.icon}</div>
        <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
        <p className="text-sm text-gray-600">{feature.desc}</p>
      </motion.div>
    ))}
  </div>
);

const Footer = () => (
  <footer className="text-center mt-8 pt-6 border-t border-gray-200">
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📞 Bize Ulaşın</h3>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start">
            <span className="font-semibold text-green-600 mr-2">📱 Satış:</span>
            <a href="tel:+905389125858" className="text-blue-600 hover:underline font-medium">+90 538 912 58 58</a>
          </div>
          <div className="flex items-center justify-center md:justify-start">
            <span className="font-semibold text-blue-600 mr-2">✉️ E-posta:</span>
            <a href="mailto:info@dogusotomat.com" className="text-blue-600 hover:underline">info@dogusotomat.com</a>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start">
            <span className="font-semibold text-gray-700 mr-2">🌐 Web:</span>
            <a href="https://dogisofticecream.com.tr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dogisofticecream.com.tr</a>
          </div>
          <div className="flex items-center justify-center md:justify-start">
            <span className="font-semibold text-gray-700 mr-2">🏢 Otomat:</span>
            <a href="https://dogusotomat.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dogusotomat.com</a>
          </div>
        </div>
      </div>
    </div>
    
    <p className="text-sm text-gray-500">
      © 2025 Doğuş Otomat - Dogi Soft Ice Cream Teknik Destek Merkezi
      <br />
      <span className="text-xs">Powered by Gemini-2.0-flash • Token Optimizasyonu Aktif</span>
    </p>
  </footer>
);

const App = () => {
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', icon: '⚠️' });
  const [aiStatus, setAiStatus] = useState({
    isInitialized: false,
    hasApiKey: false,
    userType: null,
    chatHistoryLength: 0
  });

  // BAŞLANGIÇ MESAJI - Daha kısa ve öz
  const welcomeMessage = {
    role: 'bot',
    content: `🔧 DOGI TEKNİK DESTEK'e Hoş Geldiniz!

Ben Doğuş Otomat'ın AI destekli teknik destek asistanıyım.

🎯 Size nasıl yardımcı olabilirim:
• Müşteri desteği (iade, şikayet)
• Operatör desteği (hata kodları, teknik sorunlar)

⚡ AI sistemi token optimizasyonu ile hızlı yanıt veriyor...

❗ Elektrik işleri için mutlaka yetkili servisi arayın: 0538 912 58 58`
  };

  useEffect(() => {
    initializeAIService();
    // Başlangıç mesajını ekle
    setChatHistory([welcomeMessage]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeAIService = async () => {
    try {
      // AI durumunu kontrol et
      const status = aiService.getStatus();
      setAiStatus(status);
      
      // Eğer initialize edilmemişse tekrar dene
      if (!status.isInitialized && status.hasApiKey) {
        await aiService.initializeAI();
        // Güncellenen durumu al
        setTimeout(() => {
          const newStatus = aiService.getStatus();
          setAiStatus(newStatus);
        }, 2000); // 2 saniye bekle
      }
    } catch (error) {
      // Hata durumunda sessizce devam et, modal gösterme
      console.warn('AI servisi başlatılamadı:', error.message);
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;
    
    setLoading(true);
    
    // Kullanıcı mesajını ekle
    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      if (!aiStatus.isInitialized) {
        const errorMsg = {
          role: 'bot',
          content: '🤖 AI sistemi henüz başlatılıyor. Lütfen birkaç saniye bekleyin ve tekrar deneyin.'
        };
        setChatHistory(prev => [...prev, errorMsg]);
        return;
      }

      // AI'dan yanıt al
      const response = await aiService.getResponse(message);
      
      // AI yanıtını ekle
      const aiMessage = { role: 'bot', content: response };
      setChatHistory(prev => [...prev, aiMessage]);

      
      
      // AI durumunu güncelle
      const newStatus = aiService.getStatus();
      setAiStatus(newStatus);

    } catch (error) {
      const errorMsg = {
        role: 'bot',
        content: `❌ Bir hata oluştu: ${error.message}

🆘 Acil durumda direkt iletişim:
📞 0538 912 58 58
✉️ info@dogusotomat.com`
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    aiService.clearChatHistory();
    setChatHistory([welcomeMessage]); // welcomeMessage'ı koru
    setAiStatus(prev => ({ ...prev, userType: null, chatHistoryLength: 0 }));
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-effect rounded-3xl p-8 w-full max-w-4xl shadow-2xl"
      >
        {/* Header */}
        <header className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="logo-container inline-block"
            style={{
              background: 'linear-gradient(135deg, #ff6b9d, #c44569)',
              padding: '20px',
              borderRadius: '20px',
              marginBottom: '30px',
              boxShadow: '0 10px 30px rgba(196, 69, 105, 0.3)'
            }}
          >
            <img 
              src="https://dogisofticecream.com.tr/wp-content/uploads/2025/02/dogilogo.png" 
              alt="Dogi Soft Ice Cream Logo" 
              className="w-32 h-auto mx-auto"
            />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Dogi Teknik Destek Merkezi
          </h1>
          <p className="text-lg text-gray-600 mb-2">Doğuş Otomat Profesyonel Çözümler</p>
          <p className="text-sm text-gray-500">
            {aiStatus.isInitialized ? '⚡ Token Optimizasyonu Aktif - Hızlı AI Destek' : '🔄 AI Sistemi Başlatılıyor...'}
          </p>
        </header>

        {!showChat ? (
          <>
            <FeaturesSection />
            <div className="glass-effect rounded-2xl p-8 text-center mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  🤖 AI Teknik Destek Sistemi
                </h2>
                <p className="text-gray-600 mb-6">
                  {aiStatus.isInitialized 
                    ? '⚡ Gemini-2.0-flash ile optimize edilmiş AI sistemi hazır!'
                    : '🔄 AI sistemi başlatılıyor ve optimizasyonlar aktif ediliyor...'
                  }
                </p>
                
                {/* API Key Status */}
                <div className={`inline-flex items-center px-4 py-2 rounded-full mb-4 ${
                  aiStatus.hasApiKey ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    aiStatus.hasApiKey ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    aiStatus.hasApiKey ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {aiStatus.hasApiKey ? '🔑 API Key Aktif' : '❌ API Key Eksik'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setShowChat(true)}
                  disabled={!aiStatus.hasApiKey}
                  className="btn-success text-white px-8 py-4 rounded-xl text-lg font-semibold disabled:opacity-50"
                >
                  🚀 Teknik Desteği Başlat
                </button>
                
                {aiStatus.hasApiKey && (
                  <button 
                    onClick={clearChat}
                    className="btn-primary text-white px-8 py-4 rounded-xl text-lg font-semibold"
                  >
                    🔄 Chat'i Temizle
                  </button>
                )}
              </div>
              
              {!aiStatus.hasApiKey && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ AI sistemi çalışması için .env dosyasında REACT_APP_GEMINI_API_KEY değişkenini ayarlayın.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setShowChat(false)}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Ana Sayfaya Dön
              </button>
              <button 
                onClick={clearChat}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                🔄 Chat'i Temizle
              </button>
            </div>
            
            <ChatSection 
              chatHistory={chatHistory} 
              onSendMessage={sendMessage} 
              loading={loading}
              aiStatus={aiStatus}
            />
          </>
        )}

        <Footer />
      </motion.div>

      {/* Modal */}
      {modal.show && (
        <MessageModal 
          message={modal.message} 
          icon={modal.icon} 
          onClose={() => setModal({ ...modal, show: false })} 
        />
      )}
    </div>
  );
};

export default App;