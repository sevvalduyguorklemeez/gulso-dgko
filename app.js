// ========================================
// DOĞUM GÜNÜ MESAJ SİTESİ - APP.JS
// ========================================

// JSONBin.io Yapılandırması (ÜCRETSİZ ve KOLAY!)
// 1. https://jsonbin.io adresine git
// 2. Ücretsiz hesap aç
// 3. Dashboard'dan "Create a Bin" tıkla, içine [] yaz (boş array)
// 4. Bin ID'sini kopyala (URL'deki son kısım)
// 5. Settings > API Keys > X-Master-Key'i kopyala
// 6. Aşağıdaki değerleri değiştir:

const JSONBIN_BIN_ID = '69415097d0ea881f402d4399';
const JSONBIN_API_KEY = '$2a$10$KePvmsYVd/cenj6JV0nsRuBdNxXBRA4FRooCgUw05DfDD2vlwGQMK';

// Test modu - JSONBin kurulmadan önce localStorage kullanır
const USE_LOCAL_STORAGE = JSONBIN_BIN_ID === 'YOUR_BIN_ID';

// ========================================
// KONFETTI EFEKTİ
// ========================================

function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    const colors = ['#ff6b9d', '#7c4dff', '#ffab40', '#00e676', '#00bcd4', '#e040fb', '#ff5252'];
    const shapes = ['■', '●', '▲', '★', '♦'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.opacity = Math.random() * 0.8 + 0.2;
            
            const size = Math.random() * 10 + 5;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }, i * 50);
    }
}

// Sayfa yüklendiğinde konfetti
document.addEventListener('DOMContentLoaded', () => {
    createConfetti();
    
    // Her 15 saniyede konfetti
    setInterval(createConfetti, 15000);
});

// ========================================
// FORM İŞLEMLERİ
// ========================================

const messageForm = document.getElementById('messageForm');
const messageTextarea = document.getElementById('message');
const charCount = document.getElementById('charCount');

if (messageTextarea && charCount) {
    messageTextarea.addEventListener('input', () => {
        charCount.textContent = messageTextarea.value.length;
    });
}

if (messageForm) {
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = messageForm.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        
        // Loading durumu
        submitBtn.disabled = true;
        btnText.textContent = 'Gönderiliyor...';
        
        const messageData = {
            id: Date.now().toString(),
            message: document.getElementById('message').value.trim(),
            hint: document.getElementById('hint').value.trim() || null,
            timestamp: new Date().toISOString(),
            guessedBy: null
        };
        
        try {
            await saveMessage(messageData);
            
            // Başarılı
            document.querySelector('.message-form-section').classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
            createConfetti();
            createConfetti();
            
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
            alert('Mesaj gönderilemedi, lütfen tekrar deneyin.');
            submitBtn.disabled = false;
            btnText.textContent = originalText;
        }
    });
}

// ========================================
// VERİ İŞLEMLERİ
// ========================================

async function saveMessage(messageData) {
    if (USE_LOCAL_STORAGE) {
        // localStorage kullan (test için)
        const messages = JSON.parse(localStorage.getItem('birthdayMessages') || '[]');
        messages.push(messageData);
        localStorage.setItem('birthdayMessages', JSON.stringify(messages));
        return messageData;
    } else {
        // JSONBin.io kullan
        // Önce mevcut mesajları al
        const messages = await getMessages();
        messages.push(messageData);
        
        // Güncellenmiş listeyi kaydet
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(messages)
        });
        
        if (!response.ok) throw new Error('API Error');
        return messageData;
    }
}

async function getMessages() {
    if (USE_LOCAL_STORAGE) {
        return JSON.parse(localStorage.getItem('birthdayMessages') || '[]');
    } else {
        // JSONBin.io'dan al
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.record || [];
    }
}

async function updateMessageGuess(messageId, guessedBy) {
    if (USE_LOCAL_STORAGE) {
        const messages = JSON.parse(localStorage.getItem('birthdayMessages') || '[]');
        const index = messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
            messages[index].guessedBy = guessedBy;
            localStorage.setItem('birthdayMessages', JSON.stringify(messages));
        }
        return messages[index];
    } else {
        // JSONBin.io'da güncelle
        const messages = await getMessages();
        const index = messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
            messages[index].guessedBy = guessedBy;
            
            const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                },
                body: JSON.stringify(messages)
            });
            
            if (!response.ok) throw new Error('API Error');
        }
        return messages[index];
    }
}

// Mesaj silme fonksiyonu
async function deleteMessage(messageId) {
    if (!confirm('Bu mesajı silmek istediğine emin misin?')) return;
    
    try {
        if (USE_LOCAL_STORAGE) {
            const messages = JSON.parse(localStorage.getItem('birthdayMessages') || '[]');
            const filtered = messages.filter(m => m.id !== messageId);
            localStorage.setItem('birthdayMessages', JSON.stringify(filtered));
        } else {
            const messages = await getMessages();
            const filtered = messages.filter(m => m.id !== messageId);
            
            const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                },
                body: JSON.stringify(filtered)
            });
            
            if (!response.ok) throw new Error('API Error');
        }
        
        loadMessages(); // Sayfayı yenile
    } catch (error) {
        console.error('Mesaj silinemedi:', error);
        alert('Mesaj silinemedi, tekrar deneyin.');
    }
}

// ========================================
// MESAJLARI GÖRÜNTÜLEME
// ========================================

async function loadMessages() {
    const loadingEl = document.getElementById('loading');
    const noMessagesEl = document.getElementById('noMessages');
    const messagesContainer = document.getElementById('messagesContainer');
    const totalMessagesEl = document.getElementById('totalMessages');
    const guessedCountEl = document.getElementById('guessedCount');
    
    if (!messagesContainer) return;
    
    try {
        const messages = await getMessages();
        
        if (loadingEl) loadingEl.classList.add('hidden');
        
        if (messages.length === 0) {
            if (noMessagesEl) noMessagesEl.classList.remove('hidden');
            return;
        }
        
        if (noMessagesEl) noMessagesEl.classList.add('hidden');
        
        // İstatistikler
        if (totalMessagesEl) totalMessagesEl.textContent = messages.length;
        if (guessedCountEl) {
            const guessed = messages.filter(m => m.guessedBy).length;
            guessedCountEl.textContent = guessed;
        }
        
        // Mesaj kartlarını oluştur
        messagesContainer.innerHTML = messages.map((msg, index) => {
            const date = new Date(msg.timestamp);
            const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            
            return `
                <div class="message-card" style="animation-delay: ${index * 0.1}s" data-id="${msg.id}">
                    <div class="message-number">#${messages.length - index}</div>
                    <button class="delete-btn" onclick="deleteMessage('${msg.id}')" title="Mesajı Sil">🗑️</button>
                    <div class="message-content">${escapeHtml(msg.message)}</div>
                    ${msg.hint ? `
                        <div class="message-hint">
                            <span class="hint-icon">🔍</span>
                            <span class="hint-text">İpucu: ${escapeHtml(msg.hint)}</span>
                        </div>
                    ` : ''}
                    <div class="message-footer">
                        <span class="message-time">🕐 ${timeStr} • ${dateStr}</span>
                        <div class="guess-section">
                            ${msg.guessedBy ? `
                                <div class="guessed-name">
                                    <span>✅</span>
                                    <span>${escapeHtml(msg.guessedBy)}</span>
                                </div>
                            ` : `
                                <input type="text" class="guess-input" placeholder="Kim yazdı?" data-id="${msg.id}">
                                <button class="guess-btn" onclick="makeGuess('${msg.id}')">Tahmin Et</button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Mesajlar yüklenemedi:', error);
        if (loadingEl) loadingEl.innerHTML = '<p style="color: #ff5252;">Mesajlar yüklenemedi. Sayfayı yenileyin.</p>';
    }
}

async function makeGuess(messageId) {
    const input = document.querySelector(`.guess-input[data-id="${messageId}"]`);
    const guess = input.value.trim();
    
    if (!guess) {
        input.style.borderColor = '#ff5252';
        setTimeout(() => input.style.borderColor = '', 2000);
        return;
    }
    
    try {
        await updateMessageGuess(messageId, guess);
        createConfetti();
        loadMessages(); // Yenile
    } catch (error) {
        console.error('Tahmin kaydedilemedi:', error);
        alert('Tahmin kaydedilemedi, tekrar deneyin.');
    }
}

// XSS koruması
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter tuşu ile tahmin
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('guess-input')) {
        const messageId = e.target.dataset.id;
        makeGuess(messageId);
    }
});

