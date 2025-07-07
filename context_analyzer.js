// context_analyzer.js - Versione integrata nella suite con gestione brand match e whitelist/blacklist

class EnhancedRealEstatePOIFinder {
    constructor() {
        this.apiKey = '';
        this.map = null;
        this.service = null;
        this.geocoder = null;
        this.markers = [];
        this.currentLocation = null;
        this.currentAddress = '';
        
        this.places = {}; 
        this.allProcessedAttractors = []; 

        this.fuse = null; 
        this.fuseBrandSearchList = []; 
        
        this.currentOpenModalCategoryKey = null; 
        this.botId = ''; // Verrà preso dalla configurazione

        // WHITELIST e BLACKLIST per gestione brand
        this.brandBlacklist = JSON.parse(localStorage.getItem('storebot_brand_blacklist')) || {};
        this.brandWhitelist = JSON.parse(localStorage.getItem('storebot_brand_whitelist')) || {};

        this.categoriesConfig = typeof APP_CATEGORIES_CONFIG !== 'undefined' ? APP_CATEGORIES_CONFIG : {};
        this.allBrandsConfig = typeof ALL_BRANDS_CONFIG !== 'undefined' ? ALL_BRANDS_CONFIG : {};

        if (Object.keys(this.categoriesConfig).length === 0) {
            console.error("APP_CATEGORIES_CONFIG non è stato caricato o è vuoto! Controlla che brands-config.js sia incluso prima di context_analyzer.js e non contenga errori.");
        }
        if (Object.keys(this.allBrandsConfig).length === 0) {
            console.error("ALL_BRANDS_CONFIG non è stato caricato o è vuoto! Controlla che brands-config.js sia incluso prima di context_analyzer.js e non contenga errori.");
        }

        this.prepareFuseSearchList();
        this.initializeEventListeners();
        this.initializeModalEventListeners();
        this.initializeNewEventListeners();
        this.loadStoredAddress();
    }

    // Metodi per gestire la WHITELIST
    addToBrandWhitelist(placeId, normalizedPlaceName, brandKey) {
        if (!this.brandWhitelist[normalizedPlaceName]) {
            this.brandWhitelist[normalizedPlaceName] = [];
        }
        if (!this.brandWhitelist[normalizedPlaceName].includes(brandKey)) {
            this.brandWhitelist[normalizedPlaceName].push(brandKey);
        }
        localStorage.setItem('storebot_brand_whitelist', JSON.stringify(this.brandWhitelist));
    }

    isInWhitelist(normalizedPlaceName, brandKey) {
        return this.brandWhitelist[normalizedPlaceName] && 
               this.brandWhitelist[normalizedPlaceName].includes(brandKey);
    }

    clearWhitelist() {
        if (confirm('Vuoi rimuovere tutti i brand confermati dalla whitelist?')) {
            this.brandWhitelist = {};
            localStorage.removeItem('storebot_brand_whitelist');
            StorebotUtils.showTemporaryMessage('Whitelist pulita. Esegui una nuova ricerca per vedere i cambiamenti.', 'info');
        }
    }

    // Metodi per gestire la BLACKLIST
    addToBrandBlacklist(placeId, normalizedPlaceName, brandKey) {
        if (!this.brandBlacklist[normalizedPlaceName]) {
            this.brandBlacklist[normalizedPlaceName] = [];
        }
        if (!this.brandBlacklist[normalizedPlaceName].includes(brandKey)) {
            this.brandBlacklist[normalizedPlaceName].push(brandKey);
        }
        localStorage.setItem('storebot_brand_blacklist', JSON.stringify(this.brandBlacklist));
    }

    isInBlacklist(normalizedPlaceName, brandKey) {
        return this.brandBlacklist[normalizedPlaceName] && 
               this.brandBlacklist[normalizedPlaceName].includes(brandKey);
    }

    clearBlacklist() {
        if (confirm('Vuoi rimuovere tutti i brand dalla blacklist?')) {
            this.brandBlacklist = {};
            localStorage.removeItem('storebot_brand_blacklist');
            StorebotUtils.showTemporaryMessage('Blacklist pulita. Esegui una nuova ricerca per vedere i cambiamenti.', 'info');
        }
    }

    // NUOVO: Conferma associazione brand
    confirmBrandAssociation(placeId) {
        // Trova il place
        const place = this.allProcessedAttractors.find(p => p.googlePlaceId === placeId);
        if (!place || place.classification.type !== 'brand') return;
        
        // Aggiungi alla whitelist
        const normalizedName = this.normalizeString(place.originalName);
        const brandKey = place.classification.brandKeyFromConfig;
        this.addToBrandWhitelist(placeId, normalizedName, brandKey);
        
        // Aggiorna la classificazione per indicare che è confermato
        place.classification.matchMethod = 'user_confirmed';
        place.classification.isUserConfirmed = true;
        
        // Aggiorna la visualizzazione
        this.refreshDisplay();
        
        // Mostra messaggio di conferma
        StorebotUtils.showTemporaryMessage('Associazione brand confermata', 'success');
    }

    removeBrandAssociation(placeId) {
        // Trova il place
        const place = this.allProcessedAttractors.find(p => p.googlePlaceId === placeId);
        if (!place || place.classification.type !== 'brand') return;
        
        // Aggiungi alla blacklist
        const normalizedName = this.normalizeString(place.originalName);
        const brandKey = place.classification.brandKeyFromConfig;
        this.addToBrandBlacklist(placeId, normalizedName, brandKey);
        
        // Se era nella whitelist, rimuovilo
        if (this.brandWhitelist[normalizedName]) {
            this.brandWhitelist[normalizedName] = this.brandWhitelist[normalizedName].filter(k => k !== brandKey);
            if (this.brandWhitelist[normalizedName].length === 0) {
                delete this.brandWhitelist[normalizedName];
            }
            localStorage.setItem('storebot_brand_whitelist', JSON.stringify(this.brandWhitelist));
        }
        
        // Aggiorna la classificazione
        place.classification = {
            type: 'local',
            assignedMacroCategoryKey: place.classification.assignedMacroCategoryKey,
            brandKeyFromConfig: null,
            brandDisplayName: null,
            brandConfigCategory: null,
            brandConfigSubCategory: null,
            matchMethod: null,
            similarityScore: null,
            isUserConfirmed: false
        };
        
        // Ricostruisci i places per categoria
        this.reorganizePlaces();
        
        // Aggiorna la visualizzazione
        this.refreshDisplay();
        
        // Mostra messaggio di conferma
        StorebotUtils.showTemporaryMessage('Associazione brand rimossa', 'success');
    }

    reorganizePlaces() {
        this.places = {};
        this.allProcessedAttractors.forEach(processedPlace => {
            const mainCategoryKey = processedPlace.classification.assignedMacroCategoryKey;
            if (!this.places[mainCategoryKey]) {
                this.places[mainCategoryKey] = [];
            }
            this.places[mainCategoryKey].push(processedPlace);
        });
        
        // Riordina
        Object.keys(this.places).forEach(categoryKey => {
            this.places[categoryKey].sort((a, b) => {
                const aIsBrand = a.classification.type === 'brand';
                const bIsBrand = b.classification.type === 'brand';
                if (aIsBrand && !bIsBrand) return -1;
                if (!aIsBrand && bIsBrand) return 1;
                return a.distance - b.distance;
            });
        });
    }

    refreshDisplay() {
        this.createSummary();
        this.createCategoryCards();
        this.addMarkersToMap();
        this.updateLucideIcons();
    }

    clearLists() {
        if (confirm('Vuoi pulire sia la whitelist che la blacklist?')) {
            this.brandBlacklist = {};
            this.brandWhitelist = {};
            localStorage.removeItem('storebot_brand_blacklist');
            localStorage.removeItem('storebot_brand_whitelist');
            StorebotUtils.showTemporaryMessage('Liste pulite. Esegui una nuova ricerca per vedere i cambiamenti.', 'info');
        }
    }

    // Helper per generare HTML del brand indicator
    getBrandMatchIndicatorHTML(place) {
        if (place.classification.type !== 'brand') return '';
        
        const isPerfectMatch = place.classification.matchMethod === 'exact_match' || 
                              place.classification.matchMethod === 'whitelist_match' ||
                              place.classification.isUserConfirmed;
        const placeId = place.googlePlaceId;
        
        if (isPerfectMatch) {
            let indicatorClass = 'brand-match-perfect';
            let title = 'BRAND';
            
            if (place.classification.matchMethod === 'whitelist_match') {
                indicatorClass += ' whitelist-match';
                title = 'BRAND (Confermato)';
            } else if (place.classification.isUserConfirmed) {
                indicatorClass += ' user-confirmed';
                title = 'BRAND (Confermato)';
            }
            
            return `<span class="brand-match-indicator ${indicatorClass}" title="${title}">
                <i data-lucide="check-circle" class="brand-match-icon"></i>
                BRAND
            </span>`;
        } else {
            return `<span class="brand-match-indicator brand-match-uncertain" title="Match: ${place.classification.matchMethod}">
                <i data-lucide="help-circle" class="brand-match-icon"></i>
                BRAND?
                <button class="confirm-brand-btn" onclick="window.storebotApp.confirmBrandAssociation('${placeId}')" title="Conferma associazione brand">
                    <i data-lucide="check" class="confirm-brand-icon"></i>
                </button>
                <button class="remove-brand-btn" onclick="window.storebotApp.removeBrandAssociation('${placeId}')" title="Rimuovi associazione brand">
                    <i data-lucide="x" class="remove-brand-icon"></i>
                </button>
            </span>`;
        }
    }

    loadStoredAddress() {
        const storedAddress = localStorage.getItem('storebot_currentAddress');
        if (storedAddress) {
            document.getElementById('address').value = storedAddress;
        }
    }

    prepareFuseSearchList() {
        this.fuseBrandSearchList = Object.entries(this.allBrandsConfig).map(([keyInConfig, brandData]) => {
            const searchTerms = [this.normalizeString(brandData.displayName)];
            if (brandData.aliases) {
                brandData.aliases.forEach(alias => {
                    const normalizedAlias = this.normalizeString(alias);
                    if (normalizedAlias) searchTerms.push(normalizedAlias);
                });
            }
            const normalizedKey = this.normalizeString(keyInConfig);
            if (normalizedKey) searchTerms.push(normalizedKey); 
            
            return {
                keyInConfig: keyInConfig,
                searchTerms: [...new Set(searchTerms.filter(term => term && term.length > 1))],
                brandConfigData: brandData 
            };
        });

        const fuseOptions = {
            keys: ['searchTerms'], 
            includeScore: true,
            threshold: 0.1,
            minMatchCharLength: 2, 
            ignoreLocation: true,
        };
        this.fuse = new Fuse(this.fuseBrandSearchList, fuseOptions);
        console.log("Fuse.js inizializzato con", this.fuseBrandSearchList.length, "brand. Threshold:", fuseOptions.threshold);
    }

    normalizeString(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, "")
            .replace(/\s\s+/g, ' ')
            .trim();
    }

    initializeEventListeners() {
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchAttractions();
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyAttractorsListText();
        });
        document.getElementById('copyJsonBtn').addEventListener('click', () => {
            this.copyJsonData();
        });
        document.getElementById('showAnalysisBtn').addEventListener('click', () => {
            this.showAIAnalysis();
        });
        
        // Event listeners per pulire blacklist e whitelist
        const clearBlacklistBtn = document.getElementById('clearBlacklistBtn');
        if (clearBlacklistBtn) {
            clearBlacklistBtn.addEventListener('click', () => this.clearBlacklist());
        }
        
        const clearWhitelistBtn = document.getElementById('clearWhitelistBtn');
        if (clearWhitelistBtn) {
            clearWhitelistBtn.addEventListener('click', () => this.clearWhitelist());
        }
        
        const clearAllListsBtn = document.getElementById('clearAllListsBtn');
        if (clearAllListsBtn) {
            clearAllListsBtn.addEventListener('click', () => this.clearLists());
        }
    }

    initializeNewEventListeners() {
        document.getElementById('copyExcelBtn').addEventListener('click', () => {
            this.exportToExcel();
        });
        
        this.updateLucideIcons();
    }

    initializeModalEventListeners() {
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeCategoryModal());
        const categoryModalOverlay = document.getElementById('categoryModal');
        if (categoryModalOverlay) {
            categoryModalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'categoryModal') { 
                    this.closeCategoryModal();
                }
            });
        }
        document.getElementById('modalSearchInput').addEventListener('input', () => this.filterAndRenderModalList());
        document.getElementById('modalSubCategoryFilter').addEventListener('change', () => this.filterAndRenderModalList());
    }

    async loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
                console.log("Google Maps API già disponibile.");
                resolve();
                return;
            }
            
            const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existingScript) {
                console.warn("Script Google Maps già presente nel DOM, ma window.google non è pronto. Attendo...");
                let attempts = 0;
                const intervalId = setInterval(() => {
                    attempts++;
                    if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
                        clearInterval(intervalId);
                        console.log("Google Maps API diventata disponibile dopo attesa.");
                        resolve();
                    } else if (attempts > 15) {
                        clearInterval(intervalId);
                        console.error("Timeout attesa script Google Maps. Rimuovo e tento ricaricamento forzato.");
                        existingScript.remove();
                        window.google = undefined; 
                        this.loadGoogleMapsAPI().then(resolve).catch(reject);
                    }
                }, 500);
                return;
            }

            console.log("Inizio caricamento script Google Maps API...");
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geocoding&callback=storebotInitMapApp`;
            script.async = true;
            script.defer = true;
            
            window.storebotInitMapApp = () => { 
                console.log("Google Maps API caricata (callback storebotInitMapApp eseguita).");
                if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
                    resolve();
                } else {
                    reject(new Error('Google Maps API callback eseguita, ma oggetti Google Maps non completamente disponibili.'));
                }
            };
            script.onerror = (event) => {
                console.error("Errore critico durante il caricamento dello script Google Maps API:", event);
                reject(new Error('Impossibile caricare Google Maps API. Controlla API Key, restrizioni (referrer, API abilitate), e connessione internet.'));
            };
            document.head.appendChild(script);
        });
    }

    showLoading(message = "Ricerca attrattori in corso...") {
        StorebotUtils.showGlobalLoading(message);
    }

    hideLoading() {
        StorebotUtils.hideGlobalLoading();
    }

    showError(message) {
        StorebotUtils.showTemporaryMessage(message, 'error', 7000);
        this.hideLoading();
    }

    async searchAttractions() {
        const address = document.getElementById('address').value.trim();
        
        if (!address) { 
            this.showError('Inserisci un indirizzo valido.'); 
            return; 
        }
        
        // Usa le API keys dalla configurazione centrale
        this.apiKey = StorebotUtils.getApiKey('gmaps');
        this.botId = StorebotUtils.getApiKey('botId');
        
        if (!this.apiKey) {
            StorebotUtils.showTemporaryMessage('Google Maps API Key non configurata. Vai in Configurazione.', 'error');
            return;
        }
        
        if (!this.botId) {
            StorebotUtils.showTemporaryMessage('Storebot Bot ID non configurato. Vai in Configurazione.', 'error');
            return;
        }

        this.currentAddress = address;
        localStorage.setItem('storebot_currentAddress', address);

        this.places = {}; 
        this.allProcessedAttractors = []; 
        if (this.markers && this.markers.length > 0) {
            this.markers.forEach(marker => marker.setMap(null)); 
        }
        this.markers = [];

        this.showLoading("Inizializzazione API Google Maps...");

        try {
            await this.loadGoogleMapsAPI();
            console.log("API Google Maps pronta per la ricerca.");
            
            this.showLoading("Geocodifica indirizzo...");
            await this.geocodeAddress(address); 
            console.log("Indirizzo geocodificato:", this.currentLocation.toString());
            
            await this.findNearbyPlacesAndProcess(); 
            console.log("Luoghi trovati e processati:", this.allProcessedAttractors.length);
            
            this.showResults();

        } catch (error) {
            console.error('ERRORE CRITICO in searchAttractions:', error.message, error.stack);
            this.showError(`Errore Ricerca: ${error.message}. Controlla la console per dettagli tecnici.`);
        }
    }

    async showAIAnalysis() {
        const aiSection = document.getElementById('aiAnalysisSection');
        if (aiSection.style.display === 'none') {
            aiSection.style.display = 'block';
            document.getElementById('showAnalysisBtn').innerHTML = '<i data-lucide="chevron-up" class="icon"></i> Nascondi Analisi AI';
            aiSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            this.performAIAnalysisAPI();
        } else {
            aiSection.style.display = 'none';
            document.getElementById('showAnalysisBtn').innerHTML = '<i data-lucide="brain-circuit" class="icon"></i> Analisi AI';
        }
        this.updateLucideIcons();
    }

    async performAIAnalysisAPI() {
        if (this.allProcessedAttractors.length === 0) {
            this.showAIError('Nessun dato da analizzare. Esegui prima una ricerca degli attrattori.');
            return;
        }

        const botContainer = document.querySelector('.bot-container');
        
        try {
            botContainer.innerHTML = `
                <div class="ai-loading">
                    <div class="ai-loading-spinner"></div>
                    <p>Analisi AI in corso...</p>
                </div>
            `;

            const attractorsData = this.formatDataForAI();
            console.log('Invio dati per analisi AI:', attractorsData.substring(0, 200) + '...');
            
            let message;
            let usedFallback = false;
            
            try {
                // Prima prova con Storebot
                message = await StorebotUtils.callStorebotChatAPI(attractorsData, this.botId);
                console.log('Analisi completata con Storebot API');
            } catch (storebotError) {
                console.warn('Storebot API fallita, provo con Gemini:', storebotError);
                
                // Mostra stato fallback
                botContainer.innerHTML = `
                    <div class="ai-loading">
                        <div class="ai-loading-spinner"></div>
                        <p>Utilizzo AI alternativa (Gemini)...</p>
                    </div>
                `;
                
                // Fallback su Gemini
                try {
                    const geminiPrompt = this.formatPromptForGemini(attractorsData);
                    message = await StorebotUtils.callGeminiAPI(geminiPrompt);
                    usedFallback = true;
                    console.log('Analisi completata con Gemini API (fallback)');
                } catch (geminiError) {
                    console.error('Anche Gemini ha fallito:', geminiError);
                    // Se entrambe falliscono, mostra l'errore originale di Storebot
                    throw new Error(`Errore API Storebot: ${storebotError.message}\nErrore Gemini fallback: ${geminiError.message}`);
                }
            }
            
            const result = { message, usedFallback };
            console.log('Risposta AI ricevuta:', result);
            
            this.displayAIResult(result);
            
            // Salva l'analisi AI per il report consolidato
            localStorage.setItem('storebot_contextAISummary', message);
            
            // Se abbiamo usato il fallback, notifica l'utente discretamente
            if (usedFallback) {
                StorebotUtils.showTemporaryMessage('Analisi completata con AI alternativa (Gemini)', 'info', 3000);
            }
            
        } catch (error) {
            console.error('Errore analisi AI:', error);
            this.showAIError(`Errore nell'analisi AI: ${error.message}`);
        }
    }

    formatPromptForGemini(attractorsData) {
        // Gemini potrebbe richiedere un prompt leggermente diverso
        const geminiPrompt = `${attractorsData}

IMPORTANTE: Formatta la risposta seguendo questa struttura:

# PROFILO DEL QUARTIERE - [Nome Zona/Indirizzo]

## CARATTERE SOCIO-ECONOMICO
[Analisi del tessuto sociale ed economico]

## VOCAZIONE DEL QUARTIERE
[Descrizione della vocazione commerciale e caratteristiche principali]

## SERVIZI E COMODITÀ
[Elenco e analisi dei servizi disponibili]

## IDENTITÀ CULTURALE
[Caratterizzazione culturale e atmosfera del quartiere]

## RACCOMANDAZIONI PER FRANCHISING

### IDEALE PER:
- [Elenco tipologie di attività consigliate con motivazioni]

### SCONSIGLIATO PER:
- [Elenco tipologie di attività non consigliate con motivazioni]

### OPPORTUNITÀ SPECIFICHE:
- [Opportunità di business specifiche per la zona]

Usa un linguaggio professionale e fornisci suggerimenti concreti basati sui dati forniti.`;

        return geminiPrompt;
    }

    displayAIResult(aiResult) {
        const botContainer = document.querySelector('.bot-container');
        
        const message = aiResult.message || aiResult.response || aiResult.content || aiResult.text || 'Risposta non disponibile';
        const usedFallback = aiResult.usedFallback || false;
        
        this.lastAIMessage = message;
        
        console.log('Messaggio AI raw:', message);
        console.log('Utilizzato fallback Gemini:', usedFallback);
            
        botContainer.innerHTML = `
            <div class="ai-result-container">
                <div class="ai-result-header">
                    <h4>Analisi AI Completata${usedFallback ? ' (Gemini)' : ''}</h4>
                    <span class="ai-timestamp">${new Date().toLocaleString('it-IT')}</span>
                </div>
                <div class="ai-result-wrapper">
                    ${this.formatAIMessage(message)}
                </div>
                <div class="ai-result-actions">
                    <button class="copy-btn" onclick="window.storebotApp.copyAIAnalysis()">
                        <i data-lucide="copy" class="icon"></i> Copia Testo
                    </button>
                    <button class="copy-btn" onclick="window.storebotApp.retryAIAnalysis()">
                        <i data-lucide="refresh-cw" class="icon"></i> Nuova Analisi
                    </button>
                    <button class="copy-btn" onclick="window.storebotApp.exportAIAnalysis()">
                        <i data-lucide="download" class="icon"></i> Esporta Report
                    </button>
                </div>
            </div>
        `;
        
        this.updateLucideIcons();
    }

    copyAIAnalysis() {
        if (!this.lastAIMessage) {
            alert('Nessuna analisi da copiare');
            return;
        }
        
        this.copyToClipboard(this.lastAIMessage, null, null);
        
        const copyBtn = document.querySelector('.ai-result-actions button:first-child');
        if (copyBtn) {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" class="icon"></i> Copiato!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('copied');
                this.updateLucideIcons();
            }, 2500);
        }
    }

    formatAIMessage(message) {
        if (typeof message !== 'string') {
            message = JSON.stringify(message, null, 2);
        }
        
        console.log('Formattazione messaggio AI...');
        console.log('Tipo messaggio:', typeof message);
        console.log('Lunghezza messaggio:', message.length);
        
        message = message
            .replace(/🎯|📊|🏢|✅|❌|🍕|🚗|🏪|💎|🍷|🏥|🎓|🏛️|🛍️|🍽️|🎪|🏨|🚇|🔧|📈|🌟|💼|🎭|🌍|🎨|🏃|🚶|🌳|🎪|🏠|🚌/g, '')
            .trim();
        
        let formatted = '';
        
        const lines = message.split('\n');
        let inRecommendations = false;
        let currentRecommendationType = '';
        let recommendationsHTML = '';
        let inSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) continue;
            
            if (line.startsWith('# ') || (line.includes('PROFILO DEL QUARTIERE') && i < 3)) {
                const title = line.replace(/^#\s*/, '').replace(/[-–—]/g, ' - ').trim();
                formatted += `<div class="ai-content"><div class="ai-main-title">${title}</div>`;
                console.log('Titolo principale trovato:', title);
                continue;
            }
            
            const sectionPatterns = [
                'CARATTERE SOCIO-ECONOMICO',
                'VOCAZIONE DEL QUARTIERE', 
                'SERVIZI E COMODITÀ',
                'IDENTITÀ CULTURALE',
                'RACCOMANDAZIONI PER FRANCHISING'
            ];
            
            let isSection = false;
            for (const pattern of sectionPatterns) {
                if (line.includes(pattern) || line.startsWith('## ')) {
                    isSection = true;
                    
                    if (inSection && formatted.includes('ai-paragraph') && !formatted.endsWith('</div></div>')) {
                        formatted += '</div></div>';
                    }
                    
                    let sectionTitle = line.replace(/^##\s*/, '').replace(':', '').trim().toLowerCase();
                    console.log('Sezione trovata:', sectionTitle);
                    
                    const sectionIcons = {
                        'carattere socio-economico': 'user-check',
                        'vocazione del quartiere': 'building-2',
                        'servizi e comodità': 'map-pin',
                        'identità culturale': 'users',
                        'raccomandazioni per franchising': 'target'
                    };
                    
                    const icon = sectionIcons[sectionTitle] || 'circle';
                    
                    if (sectionTitle === 'raccomandazioni per franchising') {
                        inRecommendations = true;
                        inSection = false;
                        recommendationsHTML = '<div class="ai-recommendations">';
                        break;
                    }
                    
                    formatted += `<div class="ai-section">
                        <div class="ai-section-title">
                            <div class="ai-icon">
                                <i data-lucide="${icon}"></i>
                            </div>
                            ${sectionTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </div>
                        <div class="ai-paragraph">`;
                    inSection = true;
                    break;
                }
            }
            
            if (isSection) continue;
            
            if (line === 'IDEALE PER:' || line.startsWith('### IDEALE PER')) {
                currentRecommendationType = 'ideale';
                recommendationsHTML += `<div class="ai-category">
                    <div class="ai-category-title">
                        <div class="ai-category-icon">
                            <i data-lucide="check-circle"></i>
                        </div>
                        Ideale per
                    </div>
                    <ul class="ai-list">`;
                continue;
            } else if (line === 'SCONSIGLIATO PER:' || line.startsWith('### SCONSIGLIATO PER')) {
                if (currentRecommendationType === 'ideale') {
                    recommendationsHTML += '</ul></div>';
                }
                currentRecommendationType = 'sconsigliato';
                recommendationsHTML += `<div class="ai-category">
                    <div class="ai-category-title">
                        <div class="ai-category-icon">
                            <i data-lucide="x-circle"></i>
                        </div>
                        Sconsigliato per
                    </div>
                    <ul class="ai-list">`;
                continue;
            } else if (line.includes('OPPORTUNITÀ') || line.startsWith('### OPPORTUNITÀ')) {
                if (currentRecommendationType) {
                    recommendationsHTML += '</ul></div>';
                }
                currentRecommendationType = 'opportunita';
                recommendationsHTML += `<div class="ai-category">
                    <div class="ai-category-title">
                        <div class="ai-category-icon">
                            <i data-lucide="lightbulb"></i>
                        </div>
                        Opportunità specifiche
                    </div>
                    <ul class="ai-list">`;
                continue;
            }
            
            if (line.startsWith('- ')) {
                const listItem = line.substring(2).trim();
                
                const formattedItem = listItem.replace(/\*\*(.*?)\*\*/g, '<span class="ai-bold">$1</span>');
                
                if (inRecommendations && currentRecommendationType) {
                    recommendationsHTML += `<li class="ai-list-item">${formattedItem}</li>`;
                } else {
                    if (!formatted.endsWith('<ul>')) {
                        formatted += '<ul>';
                    }
                    formatted += `<li>${formattedItem}</li>`;
                }
                continue;
            }
            
            if (inRecommendations && currentRecommendationType && line.length > 0) {
                if (line.includes(':') && !line.endsWith(':')) {
                    const formattedItem = line.replace(/\*\*(.*?)\*\*/g, '<span class="ai-bold">$1</span>');
                    recommendationsHTML += `<li class="ai-list-item">${formattedItem}</li>`;
                    continue;
                }
            }
            
            if (line.length > 0 && inSection) {
                let processedLine = line;
                
                processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<span class="ai-bold">$1</span>');
                
                if (/^[A-Z\-\s]{3,}\./.test(processedLine)) {
                    const match = processedLine.match(/^([A-Z\-\s]+)\./);
                    if (match) {
                        const classification = match[1].trim();
                        processedLine = processedLine.replace(/^[A-Z\-\s]+\./, 
                            `<span class="ai-classification">${classification}</span>.`);
                        console.log('Classificazione trovata:', classification);
                    }
                }
                
                processedLine = processedLine.replace(/\b(\d+)\s*(attrattori|metri|m|km|elementi|rilevati|totali?)\b/gi, 
                    '<span class="ai-metric">$1</span> $2');
                
                if (formatted.endsWith('</li>')) {
                    formatted += '</ul>';
                }
                
                if (!inRecommendations) {
                    formatted += processedLine + ' ';
                }
            }
        }
        
        if (inSection && formatted.includes('ai-paragraph') && !formatted.endsWith('</div></div>')) {
            formatted += '</div></div>';
        }
        
        if (inRecommendations && recommendationsHTML) {
            if (currentRecommendationType) {
                recommendationsHTML += '</ul></div>';
            }
            recommendationsHTML += '</div>';
            formatted += recommendationsHTML;
        }
        
        if (!formatted.endsWith('</div>')) {
            formatted += '</div>';
        }
        
        console.log('Formattazione completata');
        return formatted;
    }

    showAIError(errorMessage) {
        const botContainer = document.querySelector('.bot-container');
        
        botContainer.innerHTML = `
            <div class="ai-error-container">
                <div class="ai-error-content">
                    <i data-lucide="alert-triangle" class="icon"></i>
                    <div>
                        <h4>Errore Analisi AI</h4>
                        <p>${errorMessage}</p>
                    </div>
                </div>
                <button class="copy-btn" onclick="window.storebotApp.retryAIAnalysis()" style="margin-top: 16px;">
                    <i data-lucide="refresh-cw" class="icon"></i> Riprova
                </button>
            </div>
        `;
        
        this.updateLucideIcons();
    }

    retryAIAnalysis() {
        this.performAIAnalysisAPI();
    }

    exportAIAnalysis() {
        const analysisText = this.lastAIMessage || 'Analisi non disponibile';
        
        const exportContent = `ANALISI AI STOREBOT
================================
Indirizzo: ${this.currentAddress}
Data: ${new Date().toLocaleDateString('it-IT')}
Ora: ${new Date().toLocaleTimeString('it-IT')}

DATI ANALIZZATI:
${this.formatDataForAI()}

ANALISI AI:
${analysisText}

================================
Report generato da Storebot AI`;

        const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `storebot_ai_analysis_${new Date().toISOString().split('T')[0]}.txt`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        const exportBtn = document.querySelector('.ai-result-actions button:last-child');
        if (exportBtn) {
            const originalHTML = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i data-lucide="check" class="icon"></i> Esportato!';
            exportBtn.classList.add('copied');
            setTimeout(() => {
                exportBtn.innerHTML = originalHTML;
                exportBtn.classList.remove('copied');
                this.updateLucideIcons();
            }, 2500);
        }
    }

    geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            if (!window.google || !google.maps || !google.maps.Geocoder) {
                reject(new Error('Servizio Geocoder Google non disponibile. API Google Maps è stata caricata correttamente?'));
                return;
            }
            if (!this.geocoder) {
                this.geocoder = new google.maps.Geocoder();
            }
            this.geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    this.currentLocation = results[0].geometry.location;
                    this.initializeMap();
                    resolve();
                } else {
                    reject(new Error(`Geocodifica fallita (status: ${status}). L'indirizzo "${address}" è corretto e sufficientemente specifico?`));
                }
            });
        });
    }

    initializeMap() {
         if (!window.google || !google.maps || !google.maps.Map) {
            const errMsg = 'Oggetto Google Maps Map non disponibile. API non caricata.';
            console.error(errMsg); this.showError(errMsg); throw new Error(errMsg);
        }
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            const errMsg = 'Contenitore mappa (#map) non trovato.';
            console.error(errMsg); this.showError(errMsg); throw new Error(errMsg);
        }
        
        if (this.map) {
            this.map.setCenter(this.currentLocation);
            this.map.setZoom(15);
            const centralMarkerTitle = `Punto di Analisi: ${this.currentAddress}`;
            this.markers = this.markers.filter(m => {
                if (m.getTitle() !== centralMarkerTitle && !(m instanceof google.maps.Circle) ) {
                    m.setMap(null); return false;
                }
                return true;
            });
            if (!this.markers.find(m => m.getTitle() === centralMarkerTitle) || !this.markers.find(m => m instanceof google.maps.Circle)) {
                this.addCentralMarkerAndCircle();
            }
        } else {
            const mapOptions = {
                center: this.currentLocation,
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
            };
            this.map = new google.maps.Map(mapContainer, mapOptions);
            this.addCentralMarkerAndCircle();
        }
        
        if (!this.map) {
             const errMsg = 'Creazione istanza mappa fallita.';
             console.error(errMsg); this.showError(errMsg); throw new Error(errMsg);
        }
        if (!this.service || this.service.map !== this.map) {
            this.service = new google.maps.places.PlacesService(this.map);
        }
    }
    
    addCentralMarkerAndCircle() {
        if (!this.map || !this.currentLocation) {
            console.warn("Impossibile aggiungere marker centrale: mappa o locazione mancante.");
            return;
        }
        
        this.markers = this.markers.filter(m => {
            if (m instanceof google.maps.Circle) {
                m.setMap(null);
                return false;
            }
            if (m.getTitle && typeof m.getTitle === 'function' && m.getTitle().startsWith("Punto di Analisi:")) {
                m.setMap(null);
                return false;
            }
            return true;
        });

        const centralMarker = new google.maps.Marker({
            position: this.currentLocation,
            map: this.map,
            title: `Punto di Analisi: ${this.currentAddress}`,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="18" cy="18" r="16" fill="#2C5282" stroke="white" stroke-width="2.5" opacity="0.9"/>
                        <text x="18" y="24.5" text-anchor="middle" fill="white" font-size="19" font-family="sans-serif" font-weight="bold">📍</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(36, 36),
                anchor: new google.maps.Point(18, 36)
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 1
        });
        this.markers.push(centralMarker); 

        const searchCircle = new google.maps.Circle({
            strokeColor: '#2C5282', 
            strokeOpacity: 0.7, 
            strokeWeight: 2,
            fillColor: '#2C5282', 
            fillOpacity: 0.15,
            map: this.map, 
            center: this.currentLocation, 
            radius: 500
        });
        this.markers.push(searchCircle); 
    }

    async findNearbyPlacesAndProcess() {
        let rawPlacesFromGoogle = [];
        this.showLoading("Ricerca luoghi Google Places...");
        
        const searchPromises = Object.entries(this.categoriesConfig).map(async ([categoryKey, categoryInfo]) => {
            const placesForCategory = await this.searchGoogleCategory(categoryKey, categoryInfo);
            rawPlacesFromGoogle.push(...placesForCategory);
        });

        await Promise.all(searchPromises);
        
        this.showLoading("Classificazione e analisi attrattori...");
        const uniqueRawPlaces = this.deduplicateRawPlaces(rawPlacesFromGoogle);
        console.log(`Trovati ${uniqueRawPlaces.length} luoghi unici da Google (pre-processamento).`);

        this.allProcessedAttractors = uniqueRawPlaces.map(place => this.processSinglePlace(place));
        
        // Salva i POI per altri moduli
        localStorage.setItem('storebot_contextPois', JSON.stringify(this.allProcessedAttractors));
        
        this.places = {}; 
        this.allProcessedAttractors.forEach(processedPlace => {
            const mainCategoryKey = processedPlace.classification.assignedMacroCategoryKey;
            if (!this.places[mainCategoryKey]) {
                this.places[mainCategoryKey] = [];
            }
            this.places[mainCategoryKey].push(processedPlace);
        });

        Object.keys(this.places).forEach(categoryKey => {
            this.places[categoryKey].sort((a, b) => {
                const aIsBrand = a.classification.type === 'brand';
                const bIsBrand = b.classification.type === 'brand';
                if (aIsBrand && !bIsBrand) return -1;
                if (!aIsBrand && bIsBrand) return 1;
                return a.distance - b.distance;
            });
        });
        console.log("Processamento completato. Numero attrattori finali:", this.allProcessedAttractors.length);
    }
            
    searchGoogleCategory(categoryKey, categoryInfo) {
        return new Promise((resolve) => {
            let placesFound = [];
            let completedTypes = 0;
            const totalTypes = categoryInfo.types.length;

            if (totalTypes === 0) { resolve(placesFound); return; }
            if (!this.service) {
                 console.warn(`PlacesService non inizializzato per categoria ${categoryKey} (searchGoogleCategory)`);
                 resolve(placesFound); 
                 return;
            }

            categoryInfo.types.forEach(type => {
                const request = {
                    location: this.currentLocation,
                    radius: 750,
                    type: type
                };
                
                this.service.nearbySearch(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        results.forEach(place => {
                            if (!place.geometry || !place.geometry.location) {
                                console.warn("Luogo senza geometria:", place.name);
                                return;
                            }
                            const distance = this.calculateDistance(
                                this.currentLocation.lat(), this.currentLocation.lng(),
                                place.geometry.location.lat(), place.geometry.location.lng()
                            );

                            if (distance <= 500) { 
                                placesFound.push({
                                    ...place, 
                                    distance: Math.round(distance),
                                    suggestedMacroCategoryKey: categoryKey 
                                });
                            }
                        });
                    } else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS &&
                               status !== google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT && 
                               status !== google.maps.places.PlacesServiceStatus.REQUEST_DENIED) { 
                        console.warn(`Nearby Search per tipo '${type}' in categoria '${categoryKey}' ha restituito status: ${status}`);
                    }
                    completedTypes++;
                    if (completedTypes === totalTypes) {
                        resolve(placesFound);
                    }
                });
            });
        });
    }
            
    deduplicateRawPlaces(placesArray) {
        const unique = [];
        const seenPlaceIds = new Set();
        placesArray.forEach(place => {
            if (place.place_id && !seenPlaceIds.has(place.place_id)) {
                seenPlaceIds.add(place.place_id);
                unique.push(place);
            } else if (!place.place_id) { 
                const fallbackKey = `${this.normalizeString(place.name)}-${place.geometry.location.lat().toFixed(5)}-${place.geometry.location.lng().toFixed(5)}`;
                if (!seenPlaceIds.has(fallbackKey)) {
                    seenPlaceIds.add(fallbackKey);
                    unique.push(place);
                }
            }
        });
        return unique;
    }
    
    matchBrand(normalizedPlaceName, googleCategoryKeyForPOI) {
        if (!this.fuse) {
            return { isBrand: false };
        }

        // PRIMA DI TUTTO: Controlla la WHITELIST
        for (const brandEntry of this.fuseBrandSearchList) {
            if (this.isInWhitelist(normalizedPlaceName, brandEntry.keyInConfig)) {
                const matchedBrandConfig = brandEntry.brandConfigData;
                console.log(`WHITELIST MATCH: "${normalizedPlaceName}" -> ${matchedBrandConfig.displayName}`);
                
                return {
                    isBrand: true, 
                    brandData: matchedBrandConfig, 
                    keyInConfig: brandEntry.keyInConfig,
                    matchMethod: 'whitelist_match', 
                    score: 0.0,
                    matchDetails: `Whitelist confirmed match for "${normalizedPlaceName}"`
                };
            }
        }

        // SECONDA: Verifica matching ESATTO COMPLETO (ignora categoria Google)
        for (const brandEntry of this.fuseBrandSearchList) {
            // Controlla blacklist
            if (this.isInBlacklist(normalizedPlaceName, brandEntry.keyInConfig)) {
                console.log(`Brand ${brandEntry.keyInConfig} in blacklist per "${normalizedPlaceName}"`);
                continue; // Salta questo brand
            }
            
            // Ordina i termini di ricerca per lunghezza decrescente per dare priorità ai match più specifici
            const sortedSearchTerms = [...brandEntry.searchTerms].sort((a, b) => b.length - a.length);
            
            for (const searchTerm of sortedSearchTerms) {
                if (searchTerm.length < 2) continue;

                // MATCHING PERFETTO COMPLETO - ignora categoria Google
                if (normalizedPlaceName === searchTerm) {
                    const matchedBrandConfig = brandEntry.brandConfigData;
                    console.log(`MATCH PERFETTO: "${normalizedPlaceName}" === "${searchTerm}" -> ${matchedBrandConfig.displayName}`);
                    
                    return {
                        isBrand: true, 
                        brandData: matchedBrandConfig, 
                        keyInConfig: brandEntry.keyInConfig,
                        matchMethod: 'exact_match', 
                        score: 0.0,
                        matchDetails: `Exact match: "${normalizedPlaceName}" === "${searchTerm}"`
                    };
                }
            }
        }

        // TERZA: Verifica matching con PREFIX (inizio stringa) considerando la categoria
        for (const brandEntry of this.fuseBrandSearchList) {
            // Controlla blacklist
            if (this.isInBlacklist(normalizedPlaceName, brandEntry.keyInConfig)) {
                continue;
            }
            
            const sortedSearchTerms = [...brandEntry.searchTerms].sort((a, b) => b.length - a.length);
            
            for (const searchTerm of sortedSearchTerms) {
                if (searchTerm.length < 2) continue;

                // PREFIX MATCH - qui consideriamo la categoria Google se disponibile
                if (normalizedPlaceName.startsWith(searchTerm) && normalizedPlaceName !== searchTerm) {
                    const matchedBrandConfig = brandEntry.brandConfigData;
                    const brandCategoryInOurConfig = matchedBrandConfig.category;

                    // Se abbiamo una categoria Google, verifichiamo che corrisponda
                    if (googleCategoryKeyForPOI) {
                        if (brandCategoryInOurConfig === googleCategoryKeyForPOI) {
                            console.log(`PREFIX MATCH con categoria: "${normalizedPlaceName}" starts with "${searchTerm}" -> ${matchedBrandConfig.displayName}`);
                            return {
                                isBrand: true, 
                                brandData: matchedBrandConfig, 
                                keyInConfig: brandEntry.keyInConfig,
                                matchMethod: 'prefix_match_with_category', 
                                score: 0.1 
                            };
                        }
                    } else {
                        // Senza categoria Google, accettiamo il prefix match se è sufficientemente lungo
                        const matchRatio = searchTerm.length / normalizedPlaceName.length;
                        if (matchRatio > 0.7) { // Il brand deve essere almeno il 70% del nome
                            console.log(`PREFIX MATCH senza categoria: "${normalizedPlaceName}" starts with "${searchTerm}" -> ${matchedBrandConfig.displayName}`);
                            return {
                                isBrand: true, 
                                brandData: matchedBrandConfig, 
                                keyInConfig: brandEntry.keyInConfig,
                                matchMethod: 'prefix_match_no_category', 
                                score: 0.15 
                            };
                        }
                    }
                }
            }
        }

        // QUARTA: Verifica se il brand è contenuto nel nome (non all'inizio)
        for (const brandEntry of this.fuseBrandSearchList) {
            // Controlla blacklist
            if (this.isInBlacklist(normalizedPlaceName, brandEntry.keyInConfig)) {
                continue;
            }
            
            const sortedSearchTerms = [...brandEntry.searchTerms].sort((a, b) => b.length - a.length);
            
            for (const searchTerm of sortedSearchTerms) {
                if (searchTerm.length < 3) continue; // Per contains richiediamo almeno 3 caratteri

                if (normalizedPlaceName.includes(searchTerm) && !normalizedPlaceName.startsWith(searchTerm)) {
                    const matchedBrandConfig = brandEntry.brandConfigData;
                    const brandCategoryInOurConfig = matchedBrandConfig.category;

                    // Per i match "contains", richiediamo sempre la corrispondenza della categoria
                    if (googleCategoryKeyForPOI && brandCategoryInOurConfig === googleCategoryKeyForPOI) {
                        // Verifichiamo che il brand sia una parola completa nel nome
                        const regex = new RegExp(`\\b${searchTerm}\\b`);
                        if (regex.test(normalizedPlaceName)) {
                            console.log(`CONTAINS MATCH: "${searchTerm}" found in "${normalizedPlaceName}" -> ${matchedBrandConfig.displayName}`);
                            return {
                                isBrand: true, 
                                brandData: matchedBrandConfig, 
                                keyInConfig: brandEntry.keyInConfig,
                                matchMethod: 'contains_match', 
                                score: 0.2 
                            };
                        }
                    }
                }
            }
        }

        // QUINTA: Usa Fuse.js per matching fuzzy
        const fuseResults = this.fuse.search(normalizedPlaceName);
        let bestMatch = null;
        let lowestScore = Infinity;

        if (fuseResults.length > 0) {
            for (const result of fuseResults) {
                // Controlla blacklist
                if (this.isInBlacklist(normalizedPlaceName, result.item.keyInConfig)) {
                    continue;
                }
                
                if (result.score > this.fuse.options.threshold) continue;

                const matchedBrandConfig = result.item.brandConfigData;
                const brandCategoryInOurConfig = matchedBrandConfig.category;

                // Per matching fuzzy con score molto basso (quasi perfetto), ignoriamo la categoria
                if (result.score < 0.05) {
                    console.log(`FUZZY NEAR-PERFECT MATCH: "${normalizedPlaceName}" ~= brand (score: ${result.score}) -> ${matchedBrandConfig.displayName}`);
                    return { 
                        isBrand: true, 
                        brandData: matchedBrandConfig, 
                        keyInConfig: result.item.keyInConfig, 
                        matchMethod: 'fuzzy_near_perfect',
                        score: result.score 
                    };
                }

                // Per altri matching fuzzy, consideriamo la categoria
                if (googleCategoryKeyForPOI && brandCategoryInOurConfig === googleCategoryKeyForPOI) {
                    if (result.score < lowestScore) {
                        lowestScore = result.score;
                        bestMatch = result;
                    }
                } 
                // Se non abbiamo categoria Google, accettiamo solo match molto buoni
                else if (!googleCategoryKeyForPOI && result.score < 0.15) {
                    if (result.score < lowestScore) {
                        lowestScore = result.score;
                        bestMatch = result;
                    }
                }
            }
        }
        
        if (bestMatch) {
            const methodName = bestMatch.score < 0.1 ? 'fuzzy_strong' : 'fuzzy_standard';
            console.log(`FUZZY MATCH: "${normalizedPlaceName}" -> ${bestMatch.item.brandConfigData.displayName} (score: ${bestMatch.score})`);
            return { 
                isBrand: true, 
                brandData: bestMatch.item.brandConfigData, 
                keyInConfig: bestMatch.item.keyInConfig, 
                matchMethod: methodName,
                score: bestMatch.score 
            };
        }

        // Nessun match trovato
        return { isBrand: false };
    }

    processSinglePlace(rawPlace) {
        const normalizedPoiName = this.normalizeString(rawPlace.name);
        const brandMatchResult = this.matchBrand(normalizedPoiName, rawPlace.suggestedMacroCategoryKey);

        let classification = {
            type: 'local',
            assignedMacroCategoryKey: rawPlace.suggestedMacroCategoryKey || Object.keys(this.categoriesConfig)[0], 
            brandKeyFromConfig: null, brandDisplayName: null, brandConfigCategory: null, 
            brandConfigSubCategory: null, matchMethod: null, similarityScore: null,
            isUserConfirmed: false
        };

        if (brandMatchResult.isBrand) {
            classification.type = 'brand';
            classification.brandKeyFromConfig = brandMatchResult.keyInConfig;
            classification.brandDisplayName = brandMatchResult.brandData.displayName;
            classification.brandConfigCategory = brandMatchResult.brandData.category; 
            classification.brandConfigSubCategory = brandMatchResult.brandData.subCategory || null;
            classification.matchMethod = brandMatchResult.matchMethod;
            classification.similarityScore = brandMatchResult.score;
            
            // Se il match viene dalla whitelist, segnalo come confermato
            if (brandMatchResult.matchMethod === 'whitelist_match') {
                classification.isUserConfirmed = true;
            }
            
            classification.assignedMacroCategoryKey = brandMatchResult.brandData.category; 
            if (!this.categoriesConfig[classification.assignedMacroCategoryKey]) {
                console.warn(`Categoria Brand (processSinglePlace) '${classification.assignedMacroCategoryKey}' per '${classification.brandDisplayName}' non è una chiave valida in APP_CATEGORIES_CONFIG. Usato fallback: ${rawPlace.suggestedMacroCategoryKey}.`);
                classification.assignedMacroCategoryKey = (rawPlace.suggestedMacroCategoryKey && this.categoriesConfig[rawPlace.suggestedMacroCategoryKey]) 
                                                            ? rawPlace.suggestedMacroCategoryKey 
                                                            : Object.keys(this.categoriesConfig)[0];
            }
        } else {
            classification.assignedMacroCategoryKey = this.determineLocalCategory(rawPlace, rawPlace.suggestedMacroCategoryKey);
        }

        return {
            googlePlaceId: rawPlace.place_id,
            originalName: rawPlace.name,
            vicinity: rawPlace.vicinity,
            distance: rawPlace.distance,
            latitude: rawPlace.geometry.location.lat(),
            longitude: rawPlace.geometry.location.lng(),
            googleTypes: rawPlace.types || [],
            rating: rawPlace.rating || null,
            userRatingsTotal: rawPlace.user_ratings_total || null,
            classification: classification
        };
    }
            
    determineLocalCategory(place, suggestedCategoryKey) {
        const name = this.normalizeString(place.name);
        const types = place.types || [];

        const typeToCategoryMap = {
            'pharmacy': 'Salute e Benessere', 'hospital': 'Salute e Benessere', 'doctor': 'Salute e Benessere', 'dentist': 'Salute e Benessere',
            'bank': 'Servizi Pubblici e Banche', 'atm': 'Servizi Pubblici e Banche', 'post_office': 'Servizi Pubblici e Banche',
            'school': 'Istruzione', 'university': 'Istruzione', 'library': 'Servizi Pubblici e Banche', 
            'restaurant': 'Ristorazione e Bar', 'cafe': 'Ristorazione e Bar', 'bar': 'Ristorazione e Bar', 'bakery': 'Ristorazione e Bar',
            'supermarket': 'Supermercati', 'grocery_or_supermarket': 'Supermercati',
            'clothing_store': 'Negozi e Shopping', 'electronics_store': 'Negozi e Shopping', 'department_store': 'Negozi e Shopping', 'shopping_mall': 'Negozi e Shopping', 'store': 'Negozi e Shopping', 'shoe_store': 'Negozi e Shopping', 'jewelry_store': 'Negozi e Shopping', 'book_store': 'Negozi e Shopping', 'furniture_store': 'Negozi e Shopping', 'home_goods_store': 'Negozi e Shopping', 'pet_store': 'Negozi e Shopping', 'toy_store': 'Negozi e Shopping', 'gift_store': 'Negozi e Shopping',
            'gym': 'Salute e Benessere', 
            'park': 'Tempo Libero e Cultura', 'movie_theater': 'Tempo Libero e Cultura', 'museum': 'Tempo Libero e Cultura', 'travel_agency': 'Tempo Libero e Cultura',
            'hotel': 'Alloggi', 'lodging': 'Alloggi',
            'gas_station': 'Trasporti',
            'hardware_store': 'Bricolage e Giardinaggio', 
            'beauty_salon': 'Salute e Benessere', 'hair_care': 'Salute e Benessere', 'spa': 'Salute e Benessere'
        };

        const typePriority = ['pharmacy', 'hospital', 'bank', 'supermarket', 'restaurant', 'cafe', 'bar', 'hotel', 'school', 'clothing_store', 'electronics_store', 'shopping_mall', 'gym', 'bakery', 'book_store', 'hardware_store', 'store'];
        
        for (const pType of typePriority) {
            if (types.includes(pType) && typeToCategoryMap[pType]) {
                return typeToCategoryMap[pType];
            }
        }
        for (const type of types) {
            if (typeToCategoryMap[type]) {
                return typeToCategoryMap[type];
            }
        }
        
        if (name.includes('farmacia')) return 'Salute e Benessere';
        if (name.includes('banca') || name.includes('banco')) return 'Servizi Pubblici e Banche';
        if (name.includes('scuola') || name.includes('istituto') || name.includes('liceo') || name.includes('asilo')) return 'Istruzione';
        if (name.includes('ristorante') || name.includes('pizzeria') || name.includes('trattoria') || name.includes('osteria')) return 'Ristorazione e Bar';
        if (name.includes('bar') || name.includes('caffè') || name.includes('caffe')) return 'Ristorazione e Bar';
        if (name.includes('panificio') || name.includes('forno') || name.includes('pasticceria')|| name.includes('panetteria mercato')) return 'Ristorazione e Bar';
        if (name.includes('parrucchiere') || name.includes('estetista') || name.includes('salone bellezza')) return 'Salute e Benessere';
        if (name.includes('tabacchi') || name.includes('tabaccheria')) return 'Negozi e Shopping';
        if (name.includes('hotel') || name.includes('albergo') || name.includes('ostello')) return 'alloggi';

        return (suggestedCategoryKey && this.categoriesConfig[suggestedCategoryKey]) ? suggestedCategoryKey : 'Negozi e Shopping'; 
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
            
    formatDataForAI() {
        const totalPlaces = this.allProcessedAttractors.length;
        let textOutput = `ANALISI CONTESTO STOREBOT PER: ${this.currentAddress}\n`;
        textOutput += `Attrattori rilevati (raggio 500m): ${totalPlaces}\n`;
        textOutput += `---------------------------------------------------\n\n`;

        Object.entries(this.categoriesConfig).forEach(([categoryKey, categoryInfo]) => {
            const placesInCategory = this.places[categoryKey] || [];
            
            if (placesInCategory.length > 0) {
                textOutput += `CATEGORIA: ${categoryKey.toUpperCase()} (${placesInCategory.length} rilevati)\n`;
                
                const brandsInThisCategory = [];
                const localsInThisCategory = [];

                placesInCategory.forEach(place => {
                    if (place.classification.type === 'brand') {
                        brandsInThisCategory.push(place);
                    } else {
                        localsInThisCategory.push(place);
                    }
                });

                if (brandsInThisCategory.length > 0) {
                    textOutput += `  BRAND RICONOSCIUTI:\n`;
                    brandsInThisCategory.forEach((place) => {
                        let brandDisplayName = place.classification.brandDisplayName;
                        // Aggiungi indicatore per match incerti (ma non per whitelist o confermati)
                        if (place.classification.matchMethod && 
                            place.classification.matchMethod !== 'exact_match' && 
                            place.classification.matchMethod !== 'whitelist_match' &&
                            !place.classification.isUserConfirmed) {
                            brandDisplayName += ' (?)';
                        }
                        if (place.classification.brandConfigSubCategory) {
                            brandDisplayName += ` (${place.classification.brandConfigSubCategory})`;
                        }
                        let displayNameForOutput = brandDisplayName;
                        const normOriginal = this.normalizeString(place.originalName);
                        const normBrand = this.normalizeString(place.classification.brandDisplayName);
                        if (normOriginal !== normBrand && !normOriginal.startsWith(normBrand) && !normOriginal.includes(normBrand.split(' ')[0])) { 
                            displayNameForOutput = `${brandDisplayName} [Nome Google: ${place.originalName}]`;
                        }
                        textOutput += `    - ${displayNameForOutput} (${place.distance}m)\n`;
                    });
                }

                if (localsInThisCategory.length > 0) {
                    textOutput += `  ATTRATTORI LOCALI:\n`;
                    localsInThisCategory.forEach((place) => {
                        textOutput += `    - ${place.originalName} (${place.distance}m)\n`;
                    });
                }
                textOutput += `\n`; 
            }
        });

        textOutput += `---------------------------------------------------\n`;
        textOutput += `ISTRUZIONI PER L'AI:\n`;
        textOutput += `Fornisci un'analisi dettagliata del contesto del quartiere che includa:\n`;
        textOutput += `1. Carattere socio-economico della zona\n`;
        textOutput += `2. Vocazione commerciale del quartiere\n`;
        textOutput += `3. Servizi e comodità disponibili\n`;
        textOutput += `4. Identità culturale e atmosfera\n`;
        textOutput += `5. Raccomandazioni per tipologie di franchising adatte\n`;
        textOutput += `Usa un linguaggio professionale e includi suggerimenti concreti per investitori.\n`;
        textOutput += `---------------------------------------------------\n`;
        textOutput += `FINE ANALISI STOREBOT\n`;
        return textOutput;
    }

    showResults() {
        this.hideLoading();
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) resultsSection.style.display = 'block';
        
        this.createSummary();
        this.createCategoryCards(); 
        this.addMarkersToMap();
        
        this.updateLucideIcons();
    }

    createSummary() {
        const totalPlaces = this.allProcessedAttractors.length;
        const totalBrands = this.allProcessedAttractors.filter(p => p.classification.type === 'brand').length;
        const totalLocals = totalPlaces - totalBrands;
        const categoriesWithData = Object.keys(this.places).filter(catKey => this.places[catKey] && this.places[catKey].length > 0).length;

        document.getElementById('totalPlaces').textContent = totalPlaces;
        document.getElementById('totalBrands').textContent = totalBrands;
        document.getElementById('totalLocals').textContent = totalLocals;
        document.getElementById('activeCategories').textContent = `${categoriesWithData}/${Object.keys(this.categoriesConfig).length}`;
        
        this.updateLucideIcons();
    }

    createCategoryCards() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;
        grid.innerHTML = '';

        Object.entries(this.categoriesConfig).forEach(([categoryKey, categoryInfo]) => {
            const placesInCategory = this.places[categoryKey] || [];
            const card = document.createElement('div');
            card.className = 'category-card';
            card.dataset.categoryKey = categoryKey; 
            
            if (placesInCategory.length > 0) { 
                card.addEventListener('click', () => this.openCategoryModal(categoryKey));
            } else {
                card.style.cursor = 'default'; 
                card.style.opacity = '0.65'; 
            }

            card.innerHTML = `
                <div class="category-header">
                    <div class="category-info">
                        <div class="category-details">
                            <h3>${categoryKey}</h3>
                            <div class="category-count">${placesInCategory.length} rilevati nel raggio</div>
                        </div>
                        <div class="category-icon">
                            <i data-lucide="${this.getCategoryIcon(categoryKey)}" class="icon"></i>
                        </div>
                    </div>
                </div>
                <div class="places-list">
                    ${placesInCategory.length === 0 ? '<p style="text-align:center; padding:20px; color: #999; font-style:italic;">Nessun luogo</p>' : 
                        placesInCategory.slice(0, 4).map(place => {
                            // Usa la nuova funzione helper
                            let brandIndicatorHTML = this.getBrandMatchIndicatorHTML(place);
                            return `
                            <div class="place-item">
                                <div class="place-info">
                                    <h4>${place.originalName} ${brandIndicatorHTML}</h4>
                                    <p>${place.vicinity || 'Indirizzo N/D'}</p>
                                </div>
                                <div class="place-distance">${place.distance}m</div>
                            </div>`;
                        }).join('')
                    }
                    ${placesInCategory.length > 4 ? `<div class="place-item-more">Clicca per vedere altri ${placesInCategory.length - 4}...</div>` : ''}
                    ${placesInCategory.length > 0 && placesInCategory.length <= 4 ? `<div class="place-item-more">Clicca per dettagli...</div>` : ''}
                </div>`;
            grid.appendChild(card); 
        });
        
        this.updateLucideIcons();
    }

    getCategoryIcon(categoryKey) {
        const iconMap = {
            'Supermercati': 'shopping-cart',
            'Negozi e Shopping': 'shopping-bag',
            'Ristorazione e Bar': 'utensils',
            'Salute e Benessere': 'heart-pulse',
            'Trasporti': 'car',
            'Istruzione': 'graduation-cap',
            'Servizi Pubblici e Banche': 'building-2',
            'Tempo Libero e Cultura': 'ticket',
            'Alloggi': 'home',
            'Bricolage e Giardinaggio': 'hammer'
        };
        return iconMap[categoryKey] || 'map-pin';
    }

    updateLucideIcons() {
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 100);
        }
    }

    async exportToExcel() {
        try {
            const excelData = this.prepareExcelData();
            this.downloadExcelFile(excelData);
            
            const btn = document.getElementById('copyExcelBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" class="icon"></i> Esportato!';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('copied');
                this.updateLucideIcons();
            }, 2500);
            
        } catch (error) {
            console.error('Errore export Excel:', error);
            this.showError('Errore durante l\'export Excel. Riprova.');
        }
    }

    prepareExcelData() {
        const data = [];
        
        data.push(['STOREBOT ANALYTICS REPORT']);
        data.push(['Indirizzo:', this.currentAddress]);
        data.push(['Data Analisi:', new Date().toLocaleDateString('it-IT')]);
        data.push(['Raggio Analisi:', '500m']);
        data.push([]);
        
        data.push(['RIEPILOGO GENERALE']);
        data.push(['Attrattori Totali:', this.allProcessedAttractors.length]);
        data.push(['Brand Riconosciuti:', this.allProcessedAttractors.filter(p => p.classification.type === 'brand').length]);
        data.push(['Attività Locali:', this.allProcessedAttractors.filter(p => p.classification.type === 'local').length]);
        data.push([]);
        
        Object.entries(this.places).forEach(([categoryKey, places]) => {
            if (places.length > 0) {
                data.push([categoryKey.toUpperCase()]);
                data.push(['Nome', 'Tipo', 'Indirizzo', 'Distanza (m)', 'Brand', 'Sotto-categoria', 'Match Type', 'Confermato']);
                
                places.forEach(place => {
                    data.push([
                        place.originalName,
                        place.classification.type === 'brand' ? 'BRAND' : 'LOCALE',
                        place.vicinity || 'N/D',
                        place.distance,
                        place.classification.brandDisplayName || 'N/D',
                        place.classification.brandConfigSubCategory || 'N/D',
                        place.classification.matchMethod || 'N/D',
                        place.classification.isUserConfirmed ? 'SI' : 'NO'
                    ]);
                });
                data.push([]);
            }
        });
        
        return data;
    }

    downloadExcelFile(data) {
        const csvContent = data.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `storebot_analysis_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    addMarkersToMap() {
        if (!this.map) { 
            console.warn("Mappa non pronta per i marker."); 
            return; 
        }
        
        const centralMarkerTitle = `Punto di Analisi: ${this.currentAddress}`;
        this.markers = this.markers.filter(m => {
            if (m instanceof google.maps.Circle) {
                return true;
            }
            if (m.getTitle && typeof m.getTitle === 'function' && m.getTitle() === centralMarkerTitle) {
                return true;
            }
            if (m.setMap && typeof m.setMap === 'function') {
                m.setMap(null);
            }
            return false;
        });

        this.allProcessedAttractors.forEach(place => {
            const categoryKey = place.classification.assignedMacroCategoryKey;
            const categoryInfo = this.categoriesConfig[categoryKey] || { icon: '❔', color: '#2C5282' }; 
            
            let markerColor = categoryInfo.color;
            let markerIcon = categoryInfo.icon;
            let zIndex = place.classification.type === 'brand' ? 3 : 2;

            // Differenzia marker per match perfetti, confermati e incerti
            if (place.classification.type === 'brand') {
                const isPerfectMatch = place.classification.matchMethod === 'exact_match' || 
                                      place.classification.matchMethod === 'whitelist_match' ||
                                      place.classification.isUserConfirmed;
                
                if (isPerfectMatch) {
                    markerColor = '#27AE60'; // Verde per perfetto/confermato
                    markerIcon = '✓';
                    zIndex = 4;
                } else {
                    markerColor = '#F39C12'; // Arancione per incerto
                    markerIcon = '?';
                    zIndex = 3;
                }
            }

            const marker = new google.maps.Marker({
                position: { lat: place.latitude, lng: place.longitude },
                map: this.map,
                title: `${place.originalName} (${place.distance}m)`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" fill="${markerColor}" stroke="white" stroke-width="1.5" opacity="0.95"/>
                            <text x="16" y="21.5" text-anchor="middle" fill="white" font-size="16" font-family="Arial, sans-serif" font-weight="bold">${markerIcon}</text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 32)
                },
                zIndex: zIndex
            });

            const infoWindow = new google.maps.InfoWindow({ 
                content: `
                <div class="gmaps-infowindow-content">
                    <h4>${place.originalName}</h4>
                    ${place.classification.type === 'brand' ? `<p class="brand"><strong>BRAND: ${place.classification.brandDisplayName}</strong></p>` : ''}
                    ${place.classification.matchMethod && place.classification.matchMethod !== 'exact_match' && place.classification.matchMethod !== 'whitelist_match' ? `<p class="match-type">Match: ${place.classification.matchMethod}</p>` : ''}
                    ${place.classification.isUserConfirmed ? `<p class="confirmed">✓ Confermato dall'utente</p>` : ''}
                    <p><strong>Cat:</strong> ${categoryKey}</p>
                    ${place.classification.brandConfigSubCategory ? `<p><strong>Sotto-Cat:</strong> ${place.classification.brandConfigSubCategory}</p>` : ''}
                    <p><strong>Dist:</strong> ${place.distance}m</p>
                    <p class="address">${place.vicinity || 'Indirizzo N/D'}</p>
                    ${place.rating ? `<p class="rating"><strong>Rating:</strong> ⭐ ${place.rating}/5 (${place.userRatingsTotal || 0})</p>` : ''}
                </div>`
            });

            if (!document.querySelector('style[data-gmaps-styles]')) {
                const style = document.createElement('style');
                style.dataset.gmapsStyles = "true";
                style.innerHTML = `
                    .gmaps-infowindow-content { padding: 8px; font-family: 'Inter', sans-serif; max-width: 280px; line-height: 1.4; font-size: 13px; }
                    .gmaps-infowindow-content h4 { margin-top:0; margin-bottom:6px; color: #2c3e50; font-size:1.1em; }
                    .gmaps-infowindow-content p { margin-bottom:3px; }
                    .gmaps-infowindow-content .brand { font-size:0.95em; color:#E74C3C; margin-bottom:4px; }
                    .gmaps-infowindow-content .match-type { font-size:0.85em; color:#F39C12; font-style:italic; }
                    .gmaps-infowindow-content .confirmed { font-size:0.85em; color:#27AE60; font-weight:bold; }
                    .gmaps-infowindow-content .address { font-size:0.85em; color:#555; }
                    .gmaps-infowindow-content .rating { font-size:0.9em; color:#f39c12; }
                `;
                document.head.appendChild(style);
            }

            marker.addListener('click', () => { 
                infoWindow.open(this.map, marker); 
            });
            
            this.markers.push(marker);
        });
        
        console.log(`Aggiunti ${this.allProcessedAttractors.length} marker POI sulla mappa`);
    }

    copyAttractorsListText() {
        const textOutput = this.formatDataForAI();
        this.copyToClipboard(textOutput, 'copyBtn', '<i data-lucide="file-text" class="icon"></i> Copia Lista Testo');
    }
            
    copyJsonData() {
        try {
            const jsonOutput = JSON.stringify(this.allProcessedAttractors, null, 2);
            this.copyToClipboard(jsonOutput, 'copyJsonBtn', '<i data-lucide="download" class="icon"></i> Scarica Lista');
        } catch (error) {
            console.error("Errore serializzazione JSON:", error);
            this.showError("Errore preparazione dati JSON.");
        }
    }
            
    copyToClipboard(text, buttonId, originalButtonText) {
        navigator.clipboard.writeText(text).then(() => {
            if (buttonId) {
                const btn = document.getElementById(buttonId);
                if (!btn) return;
                const oldText = btn.innerHTML; 
                btn.innerHTML = '<i data-lucide="check" class="icon"></i> Copiato!';
                btn.classList.add('copied');
                setTimeout(() => { 
                    btn.innerHTML = originalButtonText; 
                    btn.classList.remove('copied'); 
                    this.updateLucideIcons();
                }, 2500);
            }
        }).catch(err => {
            console.warn('Copia diretta clipboard fallita:', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed'; textArea.style.opacity = '0'; 
            document.body.appendChild(textArea);
            textArea.focus(); textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (buttonId) {
                    const btn = document.getElementById(buttonId);
                    if (!btn) { document.body.removeChild(textArea); return; }
                    const oldText = btn.innerHTML;
                    btn.innerHTML = successful ? '<i data-lucide="check" class="icon"></i> Copiato!' : '⚠️ Copia Fallita';
                    if(successful) btn.classList.add('copied');
                    setTimeout(() => { 
                        btn.innerHTML = originalButtonText; 
                        btn.classList.remove('copied'); 
                        this.updateLucideIcons();
                    }, 3000);
                }
            } catch (e) {
                console.error('Errore fallback copy:', e);
                this.showError('Copia fallita. Browser non supporta o permessi negati.');
            }
            document.body.removeChild(textArea);
        });
    }

    openCategoryModal(categoryKey) {
        this.currentOpenModalCategoryKey = categoryKey;
        const categoryData = this.categoriesConfig[categoryKey];
        const places = this.places[categoryKey] || [];

        document.getElementById('modalCategoryTitle').textContent = `${categoryData.icon} ${categoryKey}`;
        
        const subCategoryFilter = document.getElementById('modalSubCategoryFilter');
        const subCategories = new Set();
        places.forEach(p => {
            if (p.classification.type === 'brand' && p.classification.brandConfigSubCategory) {
                subCategories.add(p.classification.brandConfigSubCategory);
            }
        });

        if (subCategories.size > 0) {
            subCategoryFilter.innerHTML = '<option value="">Tutte le Sotto-Categorie</option>'; 
            Array.from(subCategories).sort().forEach(subCat => { 
                const option = document.createElement('option');
                option.value = subCat; option.textContent = subCat;
                subCategoryFilter.appendChild(option);
            });
            subCategoryFilter.style.display = 'inline-block';
        } else {
            subCategoryFilter.style.display = 'none';
        }
        subCategoryFilter.value = ''; 
        document.getElementById('modalSearchInput').value = ''; 

        this.filterAndRenderModalList(); 
        document.getElementById('categoryModal').style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').style.display = 'none';
        document.body.style.overflow = 'auto'; 
        this.currentOpenModalCategoryKey = null;
    }

    filterAndRenderModalList() {
        if (!this.currentOpenModalCategoryKey) return;
        let placesToDisplay = [...(this.places[this.currentOpenModalCategoryKey] || [])]; 
        const searchText = this.normalizeString(document.getElementById('modalSearchInput').value);
        const selectedSubCategory = document.getElementById('modalSubCategoryFilter').value;

        if (searchText) {
            placesToDisplay = placesToDisplay.filter(p => 
                this.normalizeString(p.originalName).includes(searchText) ||
                (p.classification.type === 'brand' && this.normalizeString(p.classification.brandDisplayName).includes(searchText))
            );
        }
        if (selectedSubCategory) {
            placesToDisplay = placesToDisplay.filter(p =>
                p.classification.type === 'brand' && p.classification.brandConfigSubCategory === selectedSubCategory
            );
        }
        this.renderModalPlacesList(placesToDisplay);
    }

    renderModalPlacesList(placesArray) {
        const listContainer = document.getElementById('modalPlacesList');
        listContainer.innerHTML = ''; 

        if (placesArray.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #7f8c8d; font-style:italic;">Nessun luogo per i filtri selezionati.</p>';
            document.getElementById('modalItemsCount').textContent = `0 elementi`;
            return;
        }
        
        placesArray.sort((a, b) => {
            const subCatA = (a.classification.type === 'brand' && a.classification.brandConfigSubCategory) ? a.classification.brandConfigSubCategory.toLowerCase() : 'zzzz_locals';
            const subCatB = (b.classification.type === 'brand' && b.classification.brandConfigSubCategory) ? b.classification.brandConfigSubCategory.toLowerCase() : 'zzzz_locals';
            if (subCatA < subCatB) return -1; if (subCatA > subCatB) return 1;
            const typeAIsBrand = a.classification.type === 'brand';
            const typeBIsBrand = b.classification.type === 'brand';
            if (typeAIsBrand && !typeBIsBrand) return -1; if (!typeAIsBrand && typeBIsBrand) return 1;
            const nameA = typeAIsBrand ? this.normalizeString(a.classification.brandDisplayName) : this.normalizeString(a.originalName);
            const nameB = typeBIsBrand ? this.normalizeString(b.classification.brandDisplayName) : this.normalizeString(b.originalName);
            if (nameA < nameB) return -1; if (nameA > nameB) return 1;
            return a.distance - b.distance; 
        });

        placesArray.forEach(place => {
            // Usa la nuova funzione helper
            let brandIndicatorHTML = this.getBrandMatchIndicatorHTML(place);
            let matchedBrandNameHTML = ''; 
            let subCategoryTagHTML = '';
            
            if (place.classification.type === 'brand') {
                matchedBrandNameHTML = `<span class="matched-brand-name">Brand: ${place.classification.brandDisplayName}</span>`;
                if (place.classification.brandConfigSubCategory) {
                     subCategoryTagHTML = `<span class="place-subcategory-tag">${place.classification.brandConfigSubCategory}</span>`;
                }
            }
            
            listContainer.innerHTML += `
                <div class="place-item">
                    <div class="place-info">
                        <h4>${brandIndicatorHTML}${place.originalName} ${subCategoryTagHTML}</h4>
                        ${matchedBrandNameHTML}
                        <p>${place.vicinity || 'Indirizzo N/D'}</p>
                        ${place.rating ? `<p class="rating-modal">⭐ ${place.rating} (${place.userRatingsTotal || 0} val.)</p>` : ''}
                    </div>
                    <div class="place-distance">${place.distance}m</div>
                </div>`;
        });

        if (!document.querySelector('style[data-rating-modal-style]')) {
            const style = document.createElement('style');
            style.dataset.ratingModalStyle = "true";
            style.innerHTML = `.rating-modal { color: #f39c12; font-size:0.9em; }`;
            document.head.appendChild(style);
        }
        document.getElementById('modalItemsCount').textContent = `${placesArray.length} elementi`;
    }
} 

// Espone l'istanza globalmente per i bottoni onclick
window.storebotApp = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof APP_CATEGORIES_CONFIG !== 'undefined' && typeof ALL_BRANDS_CONFIG !== 'undefined') {
        window.storebotApp = new EnhancedRealEstatePOIFinder();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        console.error("ERRORE CRITICO: Manca APP_CATEGORIES_CONFIG o ALL_BRANDS_CONFIG. Assicurati che 'brands-config.js' sia caricato PRIMA di 'context_analyzer.js' e non contenga errori di sintassi.");
        document.body.innerHTML = `<div style="color:red; padding:30px; font-size:1.2em; text-align:center; font-family:sans-serif;"><b>ERRORE DI CONFIGURAZIONE.</b><br>Impossibile avviare l'applicazione.<br>Controllare la console del browser (F12) e il file 'brands-config.js'.</div>`;
    }
});