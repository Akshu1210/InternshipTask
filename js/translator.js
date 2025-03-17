class Translator {
    constructor() {
        // Using LibreTranslate API
        this.API_URL = 'https://translate.argosopentech.com/translate';
        this.initializeElements();
        this.addEventListeners();
        this.loadingStates = {
            translating: false,
            speaking: false
        };
        this.translationHistory = this.loadHistory();
        this.renderHistory();
        this.initializeSpeechSynthesis();
    }

    initializeElements() {
        this.sourceLang = document.getElementById('sourceLanguage');
        this.targetLang = document.getElementById('targetLanguage');
        this.sourceText = document.getElementById('sourceText');
        this.targetText = document.getElementById('targetText');
        this.translateBtn = document.getElementById('translateBtn');
        this.swapBtn = document.getElementById('swapLanguages');
        this.speakSourceBtn = document.getElementById('speakSourceBtn');
        this.speakTargetBtn = document.getElementById('speakTargetBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.clearSourceBtn = document.getElementById('clearSourceBtn');

        // Add history section to HTML
        const historySection = document.createElement('div');
        historySection.className = 'history-section';
        historySection.innerHTML = `
            <h3><i class="fas fa-history"></i> Translation History</h3>
            <div class="history-list"></div>
        `;
        document.querySelector('.translator-container').appendChild(historySection);

        // Add download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadBtn';
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Translation';
        document.querySelector('.button-group').appendChild(downloadBtn);

        // Add auto-resize event listeners
        this.sourceText.addEventListener('input', () => this.autoResize(this.sourceText));
        this.targetText.addEventListener('input', () => this.autoResize(this.targetText));
    }

    addEventListeners() {
        this.translateBtn.addEventListener('click', () => this.translate());
        this.swapBtn.addEventListener('click', () => this.swapLanguages());
        this.speakSourceBtn.addEventListener('click', () => this.speak(this.sourceText.value, this.sourceLang.value));
        this.speakTargetBtn.addEventListener('click', () => this.speak(this.targetText.value, this.targetLang.value));
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.clearSourceBtn.addEventListener('click', () => this.clearSource());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadTranslation());
        
        // Auto translate after typing stops
        let typingTimer;
        this.sourceText.addEventListener('input', () => {
            clearTimeout(typingTimer);
            if (this.sourceText.value) {
                typingTimer = setTimeout(() => this.translate(), 1000);
            }
        });

        // Handle language change
        this.sourceLang.addEventListener('change', () => {
            if (this.sourceText.value) this.translate();
        });
        this.targetLang.addEventListener('change', () => {
            if (this.sourceText.value) this.translate();
        });
    }

    async translate() {
        const text = this.sourceText.value.trim();
        if (!text || this.loadingStates.translating) return;

        const container = document.querySelector('.translator-container');
        container.classList.add('loading');
        this.loadingStates.translating = true;
        this.translateBtn.disabled = true;

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: this.sourceLang.value,
                    target: this.targetLang.value
                })
            });

            if (!response.ok) {
                throw new Error('Translation request failed');
            }

            const data = await response.json();
            
            if (data.translatedText) {
                this.targetText.value = data.translatedText;
                this.saveToHistory(text, data.translatedText);
            } else {
                throw new Error('Invalid translation response');
            }
        } catch (error) {
            console.error('Translation error:', error);
            
            // Try fallback API if first one fails
            try {
                const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${this.sourceLang.value}|${this.targetLang.value}`;
                const fallbackResponse = await fetch(fallbackUrl);
                const fallbackData = await fallbackResponse.json();
                
                if (fallbackData.responseStatus === 200) {
                    this.targetText.value = fallbackData.responseData.translatedText;
                    this.saveToHistory(text, fallbackData.responseData.translatedText);
                } else {
                    throw new Error('Fallback translation failed');
                }
            } catch (fallbackError) {
                console.error('Fallback translation error:', fallbackError);
                this.showToast('Translation failed. Please try again.');
                this.targetText.value = 'Error: Could not translate text. Please try again later.';
            }
        } finally {
            container.classList.remove('loading');
            this.loadingStates.translating = false;
            this.translateBtn.disabled = false;
        }
    }

    speak(text, lang) {
        if (!text || this.loadingStates.speaking) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        try {
            this.loadingStates.speaking = true;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            
            // Get available voices
            const voices = window.speechSynthesis.getVoices();
            
            // Try to find a matching voice for the language
            const voice = voices.find(v => v.lang.startsWith(lang)) || 
                         voices.find(v => v.lang.startsWith(lang.split('-')[0]));
            
            if (voice) {
                utterance.voice = voice;
            }

            // Adjust speech parameters for faster speech
            utterance.rate = 1.2;  // Slightly faster speed
            utterance.pitch = 1.0; // Normal pitch
            utterance.volume = 1.0; // Full volume

            utterance.onstart = () => {
                const speakBtn = lang === this.sourceLang.value ? this.speakSourceBtn : this.speakTargetBtn;
                speakBtn.classList.add('speaking');
                speakBtn.innerHTML = '<i class="fas fa-pause"></i>'; // Change icon while speaking
            };

            utterance.onend = () => {
                this.loadingStates.speaking = false;
                const speakBtn = lang === this.sourceLang.value ? this.speakSourceBtn : this.speakTargetBtn;
                speakBtn.classList.remove('speaking');
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>'; // Reset icon
            };

            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                this.loadingStates.speaking = false;
                const speakBtn = lang === this.sourceLang.value ? this.speakSourceBtn : this.speakTargetBtn;
                speakBtn.classList.remove('speaking');
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>'; // Reset icon
                this.showToast('Text-to-speech failed. Please try again.');
            };

            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('Speech error:', error);
            this.loadingStates.speaking = false;
            this.showToast('Text-to-speech is not supported in your browser');
        }
    }

    async copyToClipboard() {
        if (!this.targetText.value) return;

        try {
            await navigator.clipboard.writeText(this.targetText.value);
            this.showToast('Text copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text:', err);
            this.showToast('Failed to copy text');
        }
    }

    clearSource() {
        this.sourceText.value = '';
        this.targetText.value = '';
    }

    swapLanguages() {
        if (this.loadingStates.translating) return;
        
        const tempLang = this.sourceLang.value;
        this.sourceLang.value = this.targetLang.value;
        this.targetLang.value = tempLang;
        
        const tempText = this.sourceText.value;
        this.sourceText.value = this.targetText.value;
        this.targetText.value = tempText;
        
        // Adjust textarea heights after swapping
        this.autoResize(this.sourceText);
        this.autoResize(this.targetText);
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    saveToHistory(sourceText, translatedText) {
        const translation = {
            timestamp: new Date().toISOString(),
            sourceText,
            translatedText,
            sourceLang: this.sourceLang.value,
            targetLang: this.targetLang.value
        };

        this.translationHistory.unshift(translation);
        if (this.translationHistory.length > 10) {
            this.translationHistory.pop();
        }

        localStorage.setItem('translationHistory', JSON.stringify(this.translationHistory));
        this.renderHistory();
    }

    loadHistory() {
        const saved = localStorage.getItem('translationHistory');
        return saved ? JSON.parse(saved) : [];
    }

    renderHistory() {
        const historyList = document.querySelector('.history-list');
        historyList.innerHTML = this.translationHistory.map(item => `
            <div class="history-item">
                <div class="history-time">${new Date(item.timestamp).toLocaleString()}</div>
                <div class="history-text">
                    <div class="source-text">${item.sourceText}</div>
                    <div class="translated-text">${item.translatedText}</div>
                </div>
                <div class="history-languages">
                    ${item.sourceLang} → ${item.targetLang}
                </div>
            </div>
        `).join('');
    }

    downloadTranslation() {
        if (!this.sourceText.value || !this.targetText.value) {
            this.showToast('No translation to download');
            return;
        }

        const content = `Source Text (${this.sourceLang.value}):\n${this.sourceText.value}\n\nTranslated Text (${this.targetLang.value}):\n${this.targetText.value}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translation_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // Add this method to initialize speech synthesis
    initializeSpeechSynthesis() {
        // Force loading of voices
        window.speechSynthesis.getVoices();
        
        // Add event listener for the voiceschanged event
        window.speechSynthesis.addEventListener('voiceschanged', () => {
            const voices = window.speechSynthesis.getVoices();
            console.log('Available voices:', voices.length);
        });
    }
}

// Initialize the translator when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Translator();
}); 