// property_data_extractor.js - Logica per estrazione/inserimento dati immobile

document.addEventListener('DOMContentLoaded', () => {
    // Elementi DOM
    const pdfFileInput = document.getElementById('propertyPdfFile');
    const extractPdfBtn = document.getElementById('extractFromPdfBtn');
    const pdfOutputDiv = document.getElementById('pdfExtractionOutput');
    const jsonInputArea = document.getElementById('propertyJsonInputArea');
    const loadJsonBtn = document.getElementById('loadFromJsonBtn');
    const manualAddressInput = document.getElementById('manualAddress');
    // ... altri campi manuali ...
    const saveManualBtn = document.getElementById('saveManualDataBtn');
    const summaryDiv = document.getElementById('propertyDataSummary');
    
    // Elementi per API Storebot
    const storebotAssetIdInput = document.getElementById('storebotAssetId');
    const loadFromStorebotBtn = document.getElementById('loadFromStorebotBtn');
    const storebotLoadingStatus = document.getElementById('storebotLoadingStatus');
    const storebotApiOutput = document.getElementById('storebotApiOutput');

    let currentPropertyData = JSON.parse(localStorage.getItem('storebot_propertyDetails')) || null;

    // Inizializzazione
    function initializePropertyExtractor() {
        lucide.createIcons();
        StorebotUtils.checkApiKeysAndNotify();
        updateSummaryDisplay();

        extractPdfBtn.addEventListener('click', handlePdfExtraction);
        loadJsonBtn.addEventListener('click', handleJsonLoad);
        if (saveManualBtn) saveManualBtn.addEventListener('click', handleManualSave); // Se implementato
        
        if (loadFromStorebotBtn) {
            console.log("Bottone Storebot trovato, aggiungo listener");
            loadFromStorebotBtn.addEventListener('click', handleStorebotLoad);
        } else {
            console.error("Bottone loadFromStorebotBtn non trovato!");
        }

        // Gestione Tabs (copiato da suite.js, potrebbe essere messo in common_utils)
        document.querySelectorAll('.tabs .tab-link').forEach(tabLink => {
            tabLink.addEventListener('click', (e) => {
                const tabContainer = e.target.closest('.tabs-container');
                const targetTabId = e.target.dataset.tab;

                tabContainer.querySelectorAll('.tabs .tab-link').forEach(tl => tl.classList.remove('active'));
                e.target.classList.add('active');

                tabContainer.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                tabContainer.querySelector(`#${targetTabId}`).classList.add('active');
            });
        });

        // Pre-compila JSON area se dati esistono
        if (currentPropertyData) {
            jsonInputArea.value = JSON.stringify(currentPropertyData, null, 2);
            // Potresti anche pre-compilare i campi manuali se desiderato
        }
    }

    async function handlePdfExtraction() {
        if (!pdfFileInput.files || pdfFileInput.files.length === 0) {
            StorebotUtils.showTemporaryMessage("Seleziona un file PDF.", "error");
            return;
        }
        const file = pdfFileInput.files[0];
        const geminiApiKey = StorebotUtils.getApiKey('gemini');
        if (!geminiApiKey) {
            StorebotUtils.showTemporaryMessage("Gemini API Key non configurata.", "error");
            return;
        }

        StorebotUtils.showGlobalLoading("Estrazione da PDF...");
        pdfOutputDiv.classList.remove('placeholder');
        pdfOutputDiv.innerHTML = "Estrazione testo dal PDF in corso...";
        try {
            const text = await extractTextFromPdf(file);
            pdfOutputDiv.innerHTML = "Testo estratto. Invio all'AI per analisi dati...";
            
            const prompt = `Dato il seguente testo estratto da un annuncio immobiliare commerciale, estrai i dati chiave in formato JSON. Includi: "indirizzo", "superficie_mq", "prezzo_richiesto_vendita", "canone_mensile_locazione", "numero_vetrine", "piano_immobile", "categoria_catastale", "classe_energetica", "descrizione_sintetica_immobile", "punti_di_forza_commerciali". Se un dato non è presente, usa null o ometti la chiave. Testo:\n---\n${text}\n---\nRispondi SOLO con il JSON pulito.`;
            const jsonString = await StorebotUtils.callGeminiAPI(prompt);
            
            currentPropertyData = JSON.parse(jsonString.replace(/```json\s*|\s*```/g, '').trim());
            localStorage.setItem('storebot_propertyDetails', JSON.stringify(currentPropertyData));
            pdfOutputDiv.innerHTML = `<h3>Dati Estratti:</h3><pre>${JSON.stringify(currentPropertyData, null, 2)}</pre>`;
            updateSummaryDisplay();
            StorebotUtils.showTemporaryMessage("Dati estratti da PDF con successo!", "success");

        } catch (error) {
            console.error("Errore estrazione PDF:", error);
            StorebotUtils.showTemporaryMessage(`Errore: ${error.message}`, "error");
            pdfOutputDiv.innerHTML = `<p class="error-text">Errore durante l'estrazione: ${error.message}</p>`;
        } finally {
            StorebotUtils.hideGlobalLoading();
        }
    }

    function extractTextFromPdf(file) { // Usa pdf.js
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const typedArray = new Uint8Array(event.target.result);
                    const pdfDoc = await pdfjsLib.getDocument(typedArray).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdfDoc.numPages; i++) {
                        const page = await pdfDoc.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                    }
                    resolve(fullText);
                } catch (e) { reject(e); }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    function handleJsonLoad() {
        try {
            const jsonData = JSON.parse(jsonInputArea.value.trim());
            currentPropertyData = jsonData;
            localStorage.setItem('storebot_propertyDetails', JSON.stringify(currentPropertyData));
            updateSummaryDisplay();
            StorebotUtils.showTemporaryMessage("Dati JSON caricati con successo!", "success");
        } catch (error) {
            StorebotUtils.showTemporaryMessage("Errore nel parsing del JSON: " + error.message, "error");
        }
    }

    function handleManualSave() {
        // Raccogli i dati dai campi del form manuale
        currentPropertyData = {
            indirizzo: manualAddressInput.value,
            superficie_mq: parseInt(document.getElementById('manualSurface').value) || null,
            // ... altri campi ...
        };
        localStorage.setItem('storebot_propertyDetails', JSON.stringify(currentPropertyData));
        updateSummaryDisplay();
        StorebotUtils.showTemporaryMessage("Dati manuali salvati!", "success");
    }

    async function handleStorebotLoad() {
        console.log("handleStorebotLoad chiamata"); // Debug
        
        const assetId = storebotAssetIdInput.value.trim();
        if (!assetId) {
            StorebotUtils.showTemporaryMessage("Inserisci un ID immobile valido.", "error");
            storebotAssetIdInput.focus();
            return;
        }

        // Feedback immediato
        StorebotUtils.showTemporaryMessage("Connessione all'API Storebot in corso...", "info");
        
        // Mostra stato caricamento
        storebotLoadingStatus.style.display = 'flex';
        storebotApiOutput.classList.add('placeholder');
        storebotApiOutput.innerHTML = 'Scaricamento lista completa immobili da Storebot...';

        try {
            // Chiamata API per recuperare TUTTI gli asset
            const apiUrl = `https://admin-dev.storebook.io/api/ai/asset`;
            console.log("Chiamata API a:", apiUrl); // Debug
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            console.log("Risposta ricevuta:", response.status); // Debug
            
            if (!response.ok) {
                throw new Error(`Errore API: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log("Dati completi ricevuti:", responseData); // Debug
            
            // Cerca l'asset con l'ID specificato
            let data = null;
            
            // L'API restituisce un oggetto con 'items' che contiene l'array degli asset
            if (responseData.items && Array.isArray(responseData.items)) {
                data = responseData.items.find(item => item.id === assetId);
                console.log(`Trovati ${responseData.items.length} asset totali`); // Debug
                console.log("Asset cercato con ID:", assetId); // Debug
                console.log("Asset trovato:", data); // Debug
            } else {
                throw new Error("Formato risposta API non valido - 'items' non trovato");
            }
            
            // Verifica che l'asset esista
            if (!data) {
                throw new Error(`Immobile con ID ${assetId} non trovato tra i ${responseData.items.length} asset disponibili`);
            }
            
            if (!data.currentDetails) {
                throw new Error("L'immobile trovato non ha dettagli correnti (currentDetails)");
            }

            // Mappa i dati dal formato Storebot al nostro formato
            const mappedData = mapStorebotDataToStandard(data);
            console.log("Dati mappati:", mappedData); // Debug
            
            // Salva i dati
            currentPropertyData = mappedData;
            localStorage.setItem('storebot_propertyDetails', JSON.stringify(currentPropertyData));
            
            // Mostra i dati caricati
            storebotApiOutput.classList.remove('placeholder');
            storebotApiOutput.innerHTML = `<h3>Dati Caricati da Storebot:</h3>
                                          <p style="color: #566573; font-size: 14px; margin-bottom: 10px;">
                                            Asset selezionato da un totale di ${responseData.items.length} immobili disponibili
                                          </p>
                                          <pre>${JSON.stringify(mappedData, null, 2)}</pre>`;
            
            // Aggiorna il riepilogo
            updateSummaryDisplay();
            
            StorebotUtils.showTemporaryMessage("Dati caricati da Storebot con successo!", "success");

        } catch (error) {
            console.error("Errore dettagliato:", error); // Debug
            console.error("Stack trace:", error.stack); // Stack trace completo
            
            // Messaggi di errore più specifici
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = "Impossibile connettersi all'API Storebot. Verifica la connessione.";
            } else if (error.message.includes('non trovato')) {
                errorMessage = `ID immobile non trovato: ${assetId}. Verifica che l'ID sia corretto.`;
            }
            
            StorebotUtils.showTemporaryMessage(`Errore: ${errorMessage}`, "error", 5000);
            storebotApiOutput.classList.remove('placeholder');
            storebotApiOutput.innerHTML = `<p class="error-text">Errore durante il caricamento: ${errorMessage}</p>`;
        } finally {
            storebotLoadingStatus.style.display = 'none';
            lucide.createIcons(); // Refresh delle icone
        }
    }

    function mapStorebotDataToStandard(storebotData) {
        const item = storebotData;
        const details = item.currentDetails || {};
        
        // Costruisci l'indirizzo completo
        let indirizzo = item.address || '';
        if (item.city) indirizzo += `, ${item.city}`;
        if (item.province) indirizzo += ` (${item.province})`;
        
        // Mappa i dati
        const mappedData = {
            // Dati base
            indirizzo: indirizzo.trim(),
            città: item.city || null,
            provincia: item.province || null,
            
            // Dati catastali
            foglio_catastale: item.catastoFoglio || null,
            particella: item.catastoParticella || null,
            subalterno: item.catastoSubalterno || null,
            categoria_catastale: item.catastoCategoria || null,
            
            // Dimensioni e caratteristiche
            superficie_mq: details.gla || null,
            numero_vetrine: details.shopWindows || 0,
            altezza_m: details.height || null,
            posti_auto: details.parkingSlots || 0,
            
            // Prezzi
            tipo_contratto: details.contractType || null, // LEASE o BUY
            prezzo_richiesto_vendita: details.contractType === 'BUY' ? details.price : null,
            canone_mensile_locazione: details.contractType === 'LEASE' ? details.price : null,
            spese_condominiali: details.fees || null,
            
            // Caratteristiche
            classe_energetica: details.energyClass || null,
            aria_condizionata: details.airConditioning || false,
            sistema_antincendio: details.fireProtection || false,
            servizi_igienici: details.toilet || false,
            
            // Stato e posizione
            stato_disponibilità: details.status || null,
            posizione: details.position || null, // URBAN, etc.
            divisibile: details.divisible || false,
            
            // Coordinate
            latitudine: item.location?.latitude || null,
            longitudine: item.location?.longitude || null,
            
            // Piani (se disponibili)
            piani: details.floors && details.floors.length > 0 ? details.floors : null,
            
            // Metadata
            storebot_id: item.id || null,
            landlord_nome: item.landlordFirstName || null,
            landlord_cognome: item.landlordLastName || null,
            ultimo_aggiornamento: details.lastUpdate || null,
            
            // Link esterni (se presenti)
            link_annunci: item.links && item.links.length > 0 ? item.links : null
        };
        
        // Rimuovi campi null per pulizia (opzionale)
        Object.keys(mappedData).forEach(key => {
            if (mappedData[key] === null || mappedData[key] === undefined) {
                delete mappedData[key];
            }
        });
        
        return mappedData;
    }

    function updateSummaryDisplay() {
        summaryDiv.classList.remove('placeholder');
        if (currentPropertyData) {
            summaryDiv.innerHTML = `<h3>Dati Immobile Attuali:</h3><pre>${JSON.stringify(currentPropertyData, null, 2)}</pre>`;
        } else {
            summaryDiv.innerHTML = "<p>Nessun dato immobile attualmente caricato.</p>";
        }
    }

    initializePropertyExtractor();
});