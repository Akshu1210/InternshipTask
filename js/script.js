// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Enhanced translation functionality
const codeTranslator = {
    translations: {
        'javascript-python': {
            'console.log': 'print',
            'const': '',
            'let': '',
            'var': '',
            'function': 'def',
            '===': '==',
            '`${': 'f"{',
            '}`': '}"',
            '.length': 'len()',
            'true': 'True',
            'false': 'False',
            'null': 'None'
        },
        'python-javascript': {
            'print': 'console.log',
            'def': 'function',
            'elif': 'else if',
            'True': 'true',
            'False': 'false',
            'None': 'null',
            'len(': '.length'
        }
    },

    translateCode(sourceCode, fromLang, toLang) {
        const translationKey = `${fromLang}-${toLang}`;
        const rules = this.translations[translationKey];
        
        if (!rules) {
            return 'Translation not supported for these languages';
        }

        let translatedCode = sourceCode;

        // Apply translation rules
        Object.entries(rules).forEach(([from, to]) => {
            translatedCode = translatedCode.replace(new RegExp(from, 'g'), to);
        });

        // Format code based on target language
        return this.formatCode(translatedCode, toLang);
    },

    formatCode(code, language) {
        // Basic code formatting
        switch (language) {
            case 'python':
                return code.replace(/[{][\s\S]*?[}]/g, (match) => {
                    return match.replace(/[{}]/g, '')
                        .split('\n')
                        .map(line => '    ' + line.trim())
                        .join('\n');
                });
            case 'javascript':
                return code.replace(/^\s{4}/gm, '');
            default:
                return code;
        }
    }
};

// DOM Elements
const sourceLanguageSelect = document.getElementById('sourceLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const sourceCode = document.getElementById('sourceCode');
const targetCode = document.getElementById('targetCode');
const translateBtn = document.getElementById('translateBtn');
const swapLanguagesBtn = document.getElementById('swapLanguages');

// Event Listeners
translateBtn.addEventListener('click', () => {
    const translated = codeTranslator.translateCode(
        sourceCode.value,
        sourceLanguageSelect.value,
        targetLanguageSelect.value
    );
    targetCode.value = translated;
});

swapLanguagesBtn.addEventListener('click', () => {
    const tempLang = sourceLanguageSelect.value;
    sourceLanguageSelect.value = targetLanguageSelect.value;
    targetLanguageSelect.value = tempLang;
    
    const tempCode = sourceCode.value;
    sourceCode.value = targetCode.value;
    targetCode.value = tempCode;
});

// Add syntax highlighting (you'll need to include Prism.js or similar library)
function highlightCode() {
    if (window.Prism) {
        Prism.highlightAll();
    }
} 