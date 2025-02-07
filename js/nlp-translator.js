// NLP Translation Module
const nlpTranslator = {
    // You'll need to replace this with your actual API key
    API_KEY: 'YOUR_GOOGLE_CLOUD_API_KEY',
    
    async translate(text, sourceLang, targetLang) {
        try {
            const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: sourceLang,
                    target: targetLang,
                    format: 'text'
                })
            });

            const data = await response.json();
            return data.data.translations[0].translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return 'Error: Could not translate text';
        }
    },

    speak(text, lang) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    }
};

// DOM Elements
const nlpSourceLang = document.getElementById('nlpSourceLanguage');
const nlpTargetLang = document.getElementById('nlpTargetLanguage');
const sourceText = document.getElementById('sourceText');
const targetText = document.getElementById('targetText');
const nlpTranslateBtn = document.getElementById('nlpTranslateBtn');
const nlpSwapBtn = document.getElementById('nlpSwapLanguages');
const speakSourceBtn = document.getElementById('speakSourceBtn');
const speakTargetBtn = document.getElementById('speakTargetBtn');

// Event Listeners
nlpTranslateBtn.addEventListener('click', async () => {
    const container = document.querySelector('.translator-container');
    container.classList.add('loading');
    
    try {
        const translated = await nlpTranslator.translate(
            sourceText.value,
            nlpSourceLang.value,
            nlpTargetLang.value
        );
        targetText.value = translated;
    } catch (error) {
        targetText.value = 'Error: Could not translate text';
    } finally {
        container.classList.remove('loading');
    }
});

nlpSwapBtn.addEventListener('click', () => {
    const tempLang = nlpSourceLang.value;
    nlpSourceLang.value = nlpTargetLang.value;
    nlpTargetLang.value = tempLang;
    
    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;
});

speakSourceBtn.addEventListener('click', () => {
    nlpTranslator.speak(sourceText.value, nlpSourceLang.value);
});

speakTargetBtn.addEventListener('click', () => {
    nlpTranslator.speak(targetText.value, nlpTargetLang.value);
});

// Add auto-resize for textareas
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

sourceText.addEventListener('input', () => autoResize(sourceText));
targetText.addEventListener('input', () => autoResize(targetText)); 