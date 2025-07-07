// common_utils.js
const StorebotUtils = {
    API_KEYS_PREFIX: 'storebot_suite_',

    saveApiKey: function(keyName, keyValue) {
        localStorage.setItem(this.API_KEYS_PREFIX + keyName, keyValue.trim());
    },

    getApiKey: function(keyName) {
        return localStorage.getItem(this.API_KEYS_PREFIX + keyName);
    },

    showTemporaryMessage: function(message, type = 'info', duration = 3500) {
        let container = document.getElementById('messageContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dynamicMessageContainer'; // Assicurati che sia unico se ce ne possono essere multipli
            document.body.appendChild(container);
        }
        // Rimuovi classi di tipo precedenti
        container.className = 'message-banner'; // Reset base
        container.classList.add(type); // Aggiungi nuova classe di tipo

        container.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'}"></i> ${message}`;
        lucide.createIcons(); // Renderizza l'icona
        container.style.display = 'block';

        setTimeout(() => {
            container.style.display = 'none';
            if (container.id === 'dynamicMessageContainer') container.remove();
        }, duration);
    },

    // Funzione per aggiornare lo stato visivo delle API Key
    // Accetta l'elemento DOM dove mostrare lo stato generale
    // e opzionalmente elementi specifici per ogni chiave se vuoi semafori individuali
    updateApiKeyStatusIndicator: async function(generalStatusDivElement, gmapsStatusEl, geminiStatusEl, botIdStatusEl) {
        if (!generalStatusDivElement) return;

        generalStatusDivElement.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i> Verifica stato API in corso...`;
        lucide.createIcons();

        const results = {
            gmaps: { key: this.getApiKey('gmaps'), valid: false, element: gmapsStatusEl, name: "Google Maps" },
            gemini: { key: this.getApiKey('gemini'), valid: false, element: geminiStatusEl, name: "Gemini" },
            botId: { key: this.getApiKey('botId'), valid: false, element: botIdStatusEl, name: "Storebot Bot ID" }
        };

        // Esegui i test in parallelo
        await Promise.all([
            this.testGmapsApiKey(results.gmaps.key).then(isValid => results.gmaps.valid = isValid),
            this.testGeminiApiKey(results.gemini.key).then(isValid => results.gemini.valid = isValid),
            this.testStorebotBotId(results.botId.key).then(isValid => results.botId.valid = isValid)
        ]);

        let allOk = true;
        let summaryMessage = "Stato API: ";
        const missingOrInvalid = [];

        for (const keyType in results) {
            const res = results[keyType];
            if (res.element) { // Aggiorna semaforo individuale se l'elemento è fornito
                res.element.innerHTML = `<span class="api-dot ${res.valid ? 'valid' : 'invalid'}"></span> ${res.name}: ${res.valid ? 'Valida' : (res.key ? 'Non Valida/Errore' : 'Mancante')}`;
            }
            if (!res.valid) {
                allOk = false;
                if (!res.key) missingOrInvalid.push(`${res.name} (Mancante)`);
                else missingOrInvalid.push(`${res.name} (Non Valida)`);
            }
        }

        if (allOk) {
            summaryMessage += "Tutte configurate e valide.";
            generalStatusDivElement.className = 'api-status-indicator success';
        } else {
            summaryMessage += `Problemi rilevati: ${missingOrInvalid.join(', ')}.`;
            generalStatusDivElement.className = 'api-status-indicator error';
        }
        generalStatusDivElement.innerHTML = summaryMessage; // Rimuovi lo spinner
    },

    // Funzione di notifica se le chiavi non sono configurate/valide (chiamata dalle pagine)
    checkApiKeysAndNotify: async function(showSuccess = false) {
        const gmapsKey = this.getApiKey('gmaps');
        const geminiKey = this.getApiKey('gemini');
        const botIdKey = this.getApiKey('botId');

        let gmapsValid = false, geminiValid = false, botIdValid = false;

        if (gmapsKey) gmapsValid = await this.testGmapsApiKey(gmapsKey);
        if (geminiKey) geminiValid = await this.testGeminiApiKey(geminiKey);
        if (botIdKey) botIdValid = await this.testStorebotBotId(botIdKey);

        const allValid = gmapsValid && geminiValid && botIdValid;
        const anyMissing = !gmapsKey || !geminiKey || !botIdKey;

        if (!allValid || anyMissing) {
            let message = 'Attenzione: ';
            const issues = [];
            if (!gmapsKey) issues.push("Google Maps API Key mancante");
            else if (!gmapsValid) issues.push("Google Maps API Key non valida");

            if (!geminiKey) issues.push("Gemini API Key mancante");
            else if (!geminiValid) issues.push("Gemini API Key non valida");

            if (!botIdKey) issues.push("Storebot Bot ID mancante");
            else if (!botIdValid) issues.push("Storebot Bot ID non valido");

            message += issues.join(', ') + '. Vai alla pagina "Configurazione API".';
            this.showTemporaryMessage(message, 'warning', 7000);
            return false;
        } else if (showSuccess) {
            this.showTemporaryMessage('Tutte le API Key sono configurate e valide!', 'success');
        }
        return true;
    },

    // --- Funzioni di Test API Key ---
    testGmapsApiKey: async function(apiKey) {
        if (!apiKey || apiKey.length < 10) return false;
        // Per testare la chiave Maps, proviamo a geocodificare un indirizzo semplice.
        // È necessario che l'API Google Maps sia caricata.
        // Questa funzione presuppone che `ensureGoogleMapsApiLoaded` (specifica per pagina)
        // sia stata chiamata e abbia inizializzato un geocoder globale temporaneo o locale.
        // Per un test generico qui, potremmo dover caricare l'API solo per il test.
        try {
            // Tentativo di caricare l'API solo per il test se non già fatto globalmente
            if (!(window.google && window.google.maps && window.google.maps.Geocoder)) {
                await new Promise((resolve, reject) => {
                    window.googleMapsApiTestCallback = () => {
                        delete window.googleMapsApiTestCallback; resolve();
                    };
                    const script = document.createElement('script');
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geocoding&callback=googleMapsApiTestCallback`;
                    script.onerror = reject;
                    document.head.appendChild(script);
                    // Rimuovi lo script dopo un po' per evitare conflitti se la pagina lo ricarica
                    setTimeout(() => script.remove(), 5000);
                });
            }
             if (!(window.google && window.google.maps && window.google.maps.Geocoder)) {
                console.warn("Google Maps SDK non completamente pronto per il test.");
                return false; // Non possiamo testare senza SDK
            }

            const geocoderTest = new google.maps.Geocoder();
            await new Promise((resolve, reject) => {
                geocoderTest.geocode({ address: "1600 Amphitheatre Parkway, Mountain View, CA" }, (results, status) => {
                    if (status === 'OK') resolve(true);
                    else if (status === 'REQUEST_DENIED') resolve(false); // Chiave probabilmente non valida o non abilitata
                    else resolve(true); // Altri errori potrebbero non essere legati alla chiave in sé (es. OVER_QUERY_LIMIT)
                });
            });
            return true; // Se la geocodifica non lancia un errore specifico di chiave
        } catch (error) {
            console.warn("Errore test Google Maps API Key:", error);
            return false;
        }
    },

    testGeminiApiKey: async function(apiKey) {
        if (!apiKey || apiKey.length < 10) return false;
        const testPrompt = "Ciao"; // Un prompt molto semplice
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: testPrompt }] }] })
            });
            return response.ok; // Se la risposta è OK (2xx), la chiave è probabilmente valida
        } catch (error) {
            console.warn("Errore test Gemini API Key:", error);
            return false;
        }
    },

    testStorebotBotId: async function(botId) {
        // Per il Bot ID, assumiamo che se è presente e non vuoto, sia "valido" ai fini della configurazione.
        // Un test reale richiederebbe una chiamata all'endpoint /api/bots/{bot_id} o simile
        // che al momento non sembra esistere o non è documentato per un semplice check.
        // Per ora, un semplice controllo di presenza.
        if (!botId || botId.length < 10) return false;

        // Facciamo una chiamata di test con un messaggio semplice
        const apiUrl = 'https://scanchat-dev.bflows.ai/api/chat/message';
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Test connettività", bot_id: botId, streaming: false })
            });
            // Se la risposta non è 401 (Unauthorized) o 404 (Not Found for bot), la consideriamo ok per il test.
            // Idealmente, l'API dovrebbe dare un errore specifico se il bot_id è malformato o non esiste.
            return response.ok || (response.status !== 401 && response.status !== 404 && response.status !== 403);
        } catch (error) {
            console.warn("Errore test Storebot Bot ID:", error);
            return false; // Errore di rete, ecc.
        }
    },

    // --- Funzioni di Utility Varie (normalizeString, calculateDistanceHaversine come prima) ---
    normalizeString: function(str) {
        if (!str) return '';
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, "").replace(/\s\s+/g, ' ').trim();
    },

    calculateDistanceHaversine: function(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // --- Funzioni per chiamate API effettive (come definite prima) ---
    showGlobalLoading: function(text = "Caricamento...") { /* ... implementazione ... */ },
    hideGlobalLoading: function() { /* ... implementazione ... */ },
    callStorebotChatAPI: async function(prompt, botIdOverride = null) {
        const botId = botIdOverride || this.getApiKey('botId');
        // ... (implementazione come prima, ma usa this.showTemporaryMessage per errori)
        if (!botId) { this.showTemporaryMessage('ID Bot Storebot Chat non configurato.', 'error'); throw new Error("Bot ID mancante"); }
        const apiUrl = 'https://scanchat-dev.bflows.ai/api/chat/message';
        this.showGlobalLoading("Elaborazione AI Storebot Chat...");
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt, bot_id: botId, streaming: false })
            });
            this.hideGlobalLoading();
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({detail: `Errore server ${response.status}`}));
                throw new Error(`Errore API Storebot Chat ${response.status}: ${errorData.detail || response.statusText}`);
            }
            const result = await response.json();
            return result.message || result.response || result.content || JSON.stringify(result);
        } catch (error) {
            this.hideGlobalLoading();
            this.showTemporaryMessage(`Errore API Storebot Chat: ${error.message}`, 'error');
            throw error;
        }
    },
    callGeminiAPI: async function(prompt, imageParts = []) {
        const apiKey = this.getApiKey('gemini');
        // ... (implementazione come prima, ma usa this.showTemporaryMessage per errori)
        if (!apiKey) { this.showTemporaryMessage('Google Gemini API Key non configurata.', 'error'); throw new Error("Gemini API Key mancante"); }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        this.showGlobalLoading("Elaborazione con Gemini AI...");
        const contents = [{ parts: [{ text: prompt }] }];
        if (imageParts.length > 0) imageParts.forEach(imgPart => contents[0].parts.push(imgPart));
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.4, maxOutputTokens: 2048 } })
            });
            this.hideGlobalLoading();
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errMsg = `Errore API Gemini ${response.status}: ${errorData.error?.message || errorData.detail || response.statusText}`;
                throw new Error(errMsg);
            }
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) return result.candidates[0].content.parts[0].text;
            if (result.promptFeedback?.blockReason) throw new Error(`Richiesta bloccata da Gemini: ${result.promptFeedback.blockReason}`);
            throw new Error("Formato risposta da Gemini non valido.");
        } catch (error) {
            this.hideGlobalLoading();
            this.showTemporaryMessage(`Errore API Gemini: ${error.message}`, 'error');
            throw error;
        }
    }
};

// Aggiungi un'icona per lo spinner se non presente in Lucide (o usa Lucide)
if (document.getElementById('globalLoader')) { // Esempio di come usare l'icona spin di lucide
    document.getElementById('globalLoader').querySelector('.spinner').innerHTML = '<i data-lucide="loader-2" class="spin-icon-actual"></i>';
}