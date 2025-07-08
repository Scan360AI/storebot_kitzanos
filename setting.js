// settings.js - Gestione pagina configurazione API

document.addEventListener('DOMContentLoaded', () => {
    // Elementi DOM
    const gmapsInput = document.getElementById('gmapsApiKey');
    const geminiInput = document.getElementById('geminiApiKey');
    const botIdInput = document.getElementById('botIdApiKey');
    const openrouterInput = document.getElementById('openrouterApiKey');
    const modelSelect = document.getElementById('openrouterModel');
    
    const saveGmapsBtn = document.getElementById('saveGmapsKeyBtn');
    const saveGeminiBtn = document.getElementById('saveGeminiKeyBtn');
    const saveBotIdBtn = document.getElementById('saveBotIdBtn');
    const saveOpenrouterBtn = document.getElementById('saveOpenrouterKeyBtn');
    const testAllBtn = document.getElementById('testAllApisBtn');
    
    const generalStatus = document.getElementById('generalApiStatus');
    const gmapsStatus = document.getElementById('gmapsStatus');
    const geminiStatus = document.getElementById('geminiStatus');
    const botIdStatus = document.getElementById('botIdStatus');
    const openrouterStatus = document.getElementById('openrouterStatus');
    
    const modelDescription = document.getElementById('modelDescription');
    const modelPrice = document.getElementById('modelPrice');
    
    // Informazioni sui modelli
    const modelInfo = {
        'google/gemini-2.0-flash': {
            description: 'Modello veloce ed economico',
            price: '~$0.00015/1K token'
        },
        'google/gemini-pro': {
            description: 'Bilanciato tra qualità e costo',
            price: '~$0.00125/1K token'
        },
        'anthropic/claude-3.5-sonnet': {
            description: 'Alta qualità, ottimo per report dettagliati',
            price: '~$0.003/1K token'
        },
        'openai/gpt-4o': {
            description: 'Modello premium OpenAI',
            price: '~$0.0025/1K token'
        },
        'meta-llama/llama-3.2-3b-instruct': {
            description: 'Molto economico, qualità base',
            price: '~$0.00006/1K token'
        }
    };
    
    // Inizializzazione
    function init() {
        lucide.createIcons();
        loadExistingKeys();
        updateApiStatus();
        
        // Event listeners
        saveGmapsBtn.addEventListener('click', () => saveApiKey('gmaps', gmapsInput));
        saveGeminiBtn.addEventListener('click', () => saveApiKey('gemini', geminiInput));
        saveBotIdBtn.addEventListener('click', () => saveApiKey('botId', botIdInput));
        saveOpenrouterBtn.addEventListener('click', () => saveOpenrouterKey());
        testAllBtn.addEventListener('click', testAllApis);
        
        // Model selection change
        modelSelect.addEventListener('change', updateModelInfo);
        
        // Toggle password visibility
        addPasswordToggle(gmapsInput);
        addPasswordToggle(geminiInput);
        addPasswordToggle(openrouterInput);
    }
    
    // Carica chiavi esistenti
    function loadExistingKeys() {
        const gmapsKey = StorebotUtils.getApiKey('gmaps');
        const geminiKey = StorebotUtils.getApiKey('gemini');
        const botId = StorebotUtils.getApiKey('botId');
        const openrouterKey = StorebotUtils.getApiKey('openrouter');
        const savedModel = StorebotUtils.getApiKey('openrouterModel');
        
        if (gmapsKey) gmapsInput.value = gmapsKey;
        if (geminiKey) geminiInput.value = geminiKey;
        if (botId) botIdInput.value = botId;
        if (openrouterKey) openrouterInput.value = openrouterKey;
        if (savedModel) modelSelect.value = savedModel;
        
        updateModelInfo();
    }
    
    // Salva API key generica
    async function saveApiKey(keyName, inputElement) {
        const apiKey = inputElement.value.trim();
        
        if (!apiKey) {
            StorebotUtils.showTemporaryMessage('Inserisci una chiave valida', 'error');
            return;
        }
        
        StorebotUtils.saveApiKey(keyName, apiKey);
        StorebotUtils.showTemporaryMessage(`${getKeyDisplayName(keyName)} salvata!`, 'success');
        
        // Test immediato
        await testSingleApi(keyName, apiKey);
        updateApiStatus();
    }
    
    // Salva OpenRouter key e modello
    async function saveOpenrouterKey() {
        const apiKey = openrouterInput.value.trim();
        const selectedModel = modelSelect.value;
        
        if (!apiKey) {
            StorebotUtils.showTemporaryMessage('Inserisci una chiave OpenRouter valida', 'error');
            return;
        }
        
        StorebotUtils.saveApiKey('openrouter', apiKey);
        StorebotUtils.saveApiKey('openrouterModel', selectedModel);
        
        StorebotUtils.showTemporaryMessage('OpenRouter API Key e modello salvati!', 'success');
        
        // Test immediato
        await testSingleApi('openrouter', apiKey);
        updateApiStatus();
    }
    
    // Test singola API
    async function testSingleApi(keyName, apiKey) {
        let statusElement;
        let isValid = false;
        
        switch(keyName) {
            case 'gmaps':
                statusElement = gmapsStatus;
                isValid = await StorebotUtils.testGmapsApiKey(apiKey);
                break;
            case 'gemini':
                statusElement = geminiStatus;
                isValid = await StorebotUtils.testGeminiApiKey(apiKey);
                break;
            case 'botId':
                statusElement = botIdStatus;
                isValid = await StorebotUtils.testStorebotBotId(apiKey);
                break;
            case 'openrouter':
                statusElement = openrouterStatus;
                isValid = await StorebotUtils.testOpenRouterApiKey(apiKey);
                break;
        }
        
        if (statusElement) {
            updateSingleStatus(statusElement, getKeyDisplayName(keyName), isValid);
        }
        
        return isValid;
    }
    
    // Test tutte le API
    async function testAllApis() {
        StorebotUtils.showTemporaryMessage('Test di tutte le API in corso...', 'info');
        
        const results = await Promise.all([
            testSingleApi('gmaps', StorebotUtils.getApiKey('gmaps')),
            testSingleApi('gemini', StorebotUtils.getApiKey('gemini')),
            testSingleApi('botId', StorebotUtils.getApiKey('botId')),
            testSingleApi('openrouter', StorebotUtils.getApiKey('openrouter'))
        ]);
        
        const allValid = results.slice(0, 3).every(r => r); // Solo le prime 3 sono obbligatorie
        
        if (allValid) {
            StorebotUtils.showTemporaryMessage('Tutte le API obbligatorie sono valide!', 'success');
        } else {
            StorebotUtils.showTemporaryMessage('Alcune API hanno problemi. Controlla lo stato.', 'warning');
        }
        
        updateApiStatus();
    }
    
    // Aggiorna stato generale
    async function updateApiStatus() {
        // Per le API obbligatorie
        await StorebotUtils.updateApiKeyStatusIndicator(
            generalStatus,
            gmapsStatus,
            geminiStatus,
            botIdStatus
        );
        
        // Test separato per OpenRouter (opzionale)
        const openrouterKey = StorebotUtils.getApiKey('openrouter');
        if (openrouterKey) {
            const isValid = await StorebotUtils.testOpenRouterApiKey(openrouterKey);
            updateSingleStatus(openrouterStatus, 'OpenRouter', isValid);
        } else {
            openrouterStatus.innerHTML = '<span class="api-dot invalid"></span> OpenRouter: Non configurata (opzionale)';
        }
    }
    
    // Aggiorna stato singolo
    function updateSingleStatus(element, name, isValid) {
        element.innerHTML = `<span class="api-dot ${isValid ? 'valid' : 'invalid'}"></span> ${name}: ${isValid ? 'Valida' : 'Non valida'}`;
    }
    
    // Aggiorna info modello
    function updateModelInfo() {
        const selectedModel = modelSelect.value;
        const info = modelInfo[selectedModel];
        
        if (info) {
            modelDescription.textContent = info.description;
            modelPrice.textContent = info.price;
        }
    }
    
    // Toggle password visibility
    function addPasswordToggle(input) {
        const wrapper = input.parentElement;
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn-secondary';
        toggleBtn.innerHTML = '<i data-lucide="eye"></i>';
        toggleBtn.style.marginLeft = '-50px';
        toggleBtn.style.zIndex = '10';
        toggleBtn.type = 'button';
        
        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i data-lucide="eye-off"></i>';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i data-lucide="eye"></i>';
            }
            lucide.createIcons();
        });
        
        wrapper.style.position = 'relative';
        wrapper.appendChild(toggleBtn);
    }
    
    // Helper per nomi display
    function getKeyDisplayName(keyName) {
        const names = {
            'gmaps': 'Google Maps API Key',
            'gemini': 'Gemini API Key',
            'botId': 'Storebot Bot ID',
            'openrouter': 'OpenRouter API Key'
        };
        return names[keyName] || keyName;
    }
    
    // Inizializza
    init();
});
