// marketing_description_generator.js - Logica per generare descrizioni marketing

document.addEventListener('DOMContentLoaded', () => {
    // Elementi DOM
    const fileInput = document.getElementById('marketingImagesInput');
    const uploadArea = document.getElementById('uploadArea');
    const imageUrlInput = document.getElementById('imageUrlInput');
    const addImageUrlBtn = document.getElementById('addImageUrlBtn');
    const urlList = document.getElementById('urlList');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const propertyDetailsTextarea = document.getElementById('propertyDetailsForMarketing');
    const neighborhoodContextTextarea = document.getElementById('neighborhoodContextForMarketing');
    const generateBtn = document.getElementById('generateDescriptionBtn');
    const outputDiv = document.getElementById('marketingOutput');
    const copyBtn = document.getElementById('copyMarketingTextBtn');
    const downloadBtn = document.getElementById('downloadMarkdownBtn');
    const resultActions = document.querySelector('.result-actions');

    let uploadedImagesBase64 = []; // Array di { name, dataUrl, mimeType, type, id }
    let lastGeneratedMarkdown = ''; // Salva l'ultimo markdown generato

    function initializeGenerator() {
        lucide.createIcons();
        StorebotUtils.checkApiKeysAndNotify();

        // Pre-compila i campi se i dati esistono in localStorage
        const propertyDetails = localStorage.getItem('storebot_propertyDetails');
        if (propertyDetails) {
            try {
                propertyDetailsTextarea.value = JSON.stringify(JSON.parse(propertyDetails), null, 2);
            } catch (e) {  
                propertyDetailsTextarea.value = propertyDetails;
            }
        }
        const neighborhoodContext = localStorage.getItem('storebot_contextAISummary');
        if (neighborhoodContext) {
            neighborhoodContextTextarea.value = neighborhoodContext;
        }

        // Setup event listeners
        setupImageUploadHandlers();
        setupTabHandlers();
        
        if (generateBtn) generateBtn.addEventListener('click', generateDescription);
        if (copyBtn) copyBtn.addEventListener('click', copyGeneratedText);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadMarkdown);
        if (addImageUrlBtn) addImageUrlBtn.addEventListener('click', addImageUrl);
        
        // Enter key per URL input
        if (imageUrlInput) {
            imageUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageUrl();
                }
            });
        }
        
        console.log('Marketing Description Generator initialized');
    }

    function setupTabHandlers() {
        document.querySelectorAll('.image-tabs .tab-link').forEach(tabLink => {
            tabLink.addEventListener('click', (e) => {
                e.preventDefault();
                const clickedTab = e.target.closest('.tab-link');
                const targetTabId = clickedTab.getAttribute('data-tab');
                
                // Rimuovi active da tutti i tab e contenuti
                document.querySelectorAll('.image-tabs .tab-link').forEach(tl => tl.classList.remove('active'));
                document.querySelectorAll('.tabs-container .tab-content').forEach(tc => tc.classList.remove('active'));
                
                // Attiva il tab selezionato
                clickedTab.classList.add('active');
                const targetTab = document.getElementById(targetTabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
                
                lucide.createIcons(); // Re-render icons
            });
        });
    }

    function setupImageUploadHandlers() {
        if (!uploadArea || !fileInput) {
            console.error('Upload area o file input non trovati');
            return;
        }
        
        // Click per aprire file dialog
        uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        // Drag and drop handlers
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }

    function handleFiles(files) {
        if (!files || files.length === 0) {
            console.log('Nessun file da gestire');
            return;
        }
        
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        console.log(`Gestione ${validFiles.length} immagini valide`);
        
        if (uploadedImagesBase64.length + validFiles.length > 5) {
            StorebotUtils.showTemporaryMessage("Puoi caricare massimo 5 immagini.", "warning");
            return;
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImagesBase64.push({
                    name: file.name,
                    dataUrl: e.target.result,
                    mimeType: file.type,
                    type: 'file',
                    id: Date.now() + Math.random()
                });
                displayImages();
                console.log(`Immagine caricata: ${file.name}`);
            };
            reader.onerror = (error) => {
                console.error('Errore lettura file:', error);
                StorebotUtils.showTemporaryMessage("Errore nel caricamento del file", "error");
            };
            reader.readAsDataURL(file);
        });
    }

    async function addImageUrl() {
        const url = imageUrlInput.value.trim();
        
        if (!url) {
            StorebotUtils.showTemporaryMessage("Inserisci un URL valido", "error");
            return;
        }

        if (uploadedImagesBase64.length >= 5) {
            StorebotUtils.showTemporaryMessage("Puoi caricare massimo 5 immagini", "warning");
            return;
        }

        try {
            imageUrlInput.disabled = true;
            addImageUrlBtn.disabled = true;
            StorebotUtils.showTemporaryMessage("Caricamento immagine...", "info");
            
            // Usa un proxy CORS
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) throw new Error('Impossibile caricare l\'immagine');
            
            const blob = await response.blob();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                uploadedImagesBase64.push({
                    dataUrl: e.target.result,
                    originalUrl: url,
                    mimeType: blob.type || 'image/jpeg',
                    type: 'url',
                    id: Date.now() + Math.random()
                });
                displayImages();
                updateUrlList();
                imageUrlInput.value = '';
                StorebotUtils.showTemporaryMessage("Immagine aggiunta con successo!", "success");
            };
            
            reader.readAsDataURL(blob);
            
        } catch (error) {
            console.error('Errore:', error);
            StorebotUtils.showTemporaryMessage("Errore nel caricamento dell'immagine. Verifica l'URL.", "error");
        } finally {
            imageUrlInput.disabled = false;
            addImageUrlBtn.disabled = false;
        }
    }

    function updateUrlList() {
        const urlImages = uploadedImagesBase64.filter(img => img.type === 'url');
        urlList.innerHTML = '';
        
        urlImages.forEach(img => {
            const urlItem = document.createElement('div');
            urlItem.className = 'url-item';
            
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'link');
            icon.style.width = '16px';
            icon.style.height = '16px';
            
            const span = document.createElement('span');
            span.style.flex = '1';
            span.style.overflow = 'hidden';
            span.style.textOverflow = 'ellipsis';
            span.style.whiteSpace = 'nowrap';
            span.textContent = img.originalUrl;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Rimuovi';
            removeBtn.addEventListener('click', () => {
                removeImage(img.id);
            });
            
            urlItem.appendChild(icon);
            urlItem.appendChild(span);
            urlItem.appendChild(removeBtn);
            urlList.appendChild(urlItem);
        });
        
        lucide.createIcons();
    }

    function displayImages() {
        imagePreviewContainer.innerHTML = '';
        
        uploadedImagesBase64.forEach(img => {
            const imgItem = document.createElement('div');
            imgItem.className = 'image-preview-item';
            
            const imgEl = document.createElement('img');
            imgEl.src = img.dataUrl;
            imgEl.alt = img.name || 'Immagine';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-img-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', () => {
                removeImage(img.id);
            });
            
            imgItem.appendChild(imgEl);
            imgItem.appendChild(removeBtn);
            imagePreviewContainer.appendChild(imgItem);
        });
    }

    function removeImage(id) {
        uploadedImagesBase64 = uploadedImagesBase64.filter(img => img.id !== id);
        displayImages();
        updateUrlList();
    }

async function generateDescription() {
    const geminiApiKey = StorebotUtils.getApiKey('gemini');
    if (!geminiApiKey) {
        StorebotUtils.showTemporaryMessage("Gemini API Key non configurata.", "error");
        return;
    }

    const propertyJson = propertyDetailsTextarea.value.trim();
    const neighborhoodText = neighborhoodContextTextarea.value.trim();

    let prompt = `Sei un copywriter immobiliare esperto nel settore commerciale. Genera una descrizione marketing professionale, dettagliata e accattivante per un immobile commerciale.
La descrizione deve essere in italiano, ben strutturata, e mirata a potenziali locatari o acquirenti business (brand, retailer, imprenditori).

STRUTTURA RICHIESTA (usa questi titoli esatti con ##):
## Opportunità Commerciale Esclusiva
Un titolo accattivante che catturi l'attenzione

## Panoramica dell'Immobile
2-3 paragrafi che presentano l'immobile evidenziando i punti di forza principali

## Posizione Strategica
Descrizione dettagliata della location e del contesto di quartiere

## Caratteristiche Tecniche
- Superficie commerciale: XXX mq
- Numero vetrine: X
- Piano: 
- Altri dettagli tecnici rilevanti in formato lista

## Punti di Forza
- Elenco puntato dei principali vantaggi
- Visibilità e accessibilità
- Dotazioni e impianti
- Stato dell'immobile

## Target di Riferimento
Descrizione delle tipologie di attività commerciali ideali per questo spazio

## Informazioni Commerciali
Dettagli su prezzo/canone e condizioni contrattuali

Considera i seguenti dati (se forniti):
DATI IMMOBILE (JSON):
${propertyJson || "Nessun dato JSON fornito."}

CONTESTO QUARTIERE:
${neighborhoodText || "Nessuna analisi del contesto fornita."}
`;

    const imagePartsForAPI = uploadedImagesBase64.map(img => ({
        inlineData: {
            mimeType: img.mimeType,
            data: img.dataUrl.split(',')[1] // Rimuovi prefisso data URI
        }
    }));

    if (imagePartsForAPI.length > 0) {
        prompt += "\n\nAnalizza anche le seguenti immagini per arricchire la descrizione con dettagli visivi (luminosità, stato, finiture, vetrine, spazi).";
    }
    prompt += "\n\nRispondi SOLO con la descrizione marketing strutturata come richiesto sopra. Usa i titoli con ## e formatta con elenchi puntati dove indicato. Mantieni un tono professionale e persuasivo.";


    StorebotUtils.showGlobalLoading("Generazione descrizione marketing...");
    outputDiv.classList.add('placeholder');
    outputDiv.textContent = "Generazione in corso...";
    copyBtn.style.display = 'none';

    try {
        const description = await StorebotUtils.callGeminiAPI(prompt, imagePartsForAPI);
        plainTextDescription = description; // Salva per il copy
        outputDiv.classList.remove('placeholder');
        displayFormattedDescription(description);
        copyBtn.style.display = 'inline-flex';
        localStorage.setItem('storebot_marketingDescription', description);
        StorebotUtils.showTemporaryMessage("Descrizione generata!", "success");
    } catch (error) {
        StorebotUtils.showTemporaryMessage(`Errore: ${error.message}`, "error");
        outputDiv.textContent = "Errore durante la generazione.";
    } finally {
        StorebotUtils.hideGlobalLoading();
    }
}

function displayFormattedDescription(description) {
    outputDiv.className = "ai-output-box marketing-description-output";
    
    // Mappa delle icone per ogni sezione
    const sectionIcons = {
        'Opportunità Commerciale Esclusiva': 'trending-up',
        'Panoramica dell\'Immobile': 'building-2',
        'Posizione Strategica': 'map-pin',
        'Caratteristiche Tecniche': 'file-text',
        'Punti di Forza': 'star',
        'Target di Riferimento': 'target',
        'Informazioni Commerciali': 'banknote'
    };
    
    // Formatta il testo markdown-like in HTML elegante
    let formattedHtml = description
        // Titoli principali con icone
        .replace(/^## (.*$)/gim, function(match, title) {
            const iconName = sectionIcons[title.trim()] || 'chevron-right';
            return `<h3 class="marketing-section-title"><i data-lucide="${iconName}"></i> ${title}</h3>`;
        })
        // Sottotitoli
        .replace(/^### (.*$)/gim, '<h4 class="marketing-subsection-title">$1</h4>')
        // Liste puntate
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Grassetto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // A capo
        .replace(/\n/g, '<br>');

    // Wrapping corretto delle liste
    formattedHtml = formattedHtml.replace(/(<li>.*?<\/li>)(<br>)?(?!<li>)/gs, '<ul class="marketing-list">$1</ul>$2');
    formattedHtml = formattedHtml.replace(/(<br>)+<ul/g, '<ul'); // Rimuovi br extra prima delle liste
    formattedHtml = formattedHtml.replace(/<\/ul>(<br>)+/g, '</ul><br>'); // Un solo br dopo le liste
    
    // Wrapping dei paragrafi
    formattedHtml = formattedHtml.replace(/(<\/h[34]>)<br>([^<])/g, '$1<p class="marketing-paragraph">$2');
    formattedHtml = formattedHtml.replace(/(<br><br>)([^<])/g, '</p><p class="marketing-paragraph">$2');
    
    // Pulizia finale
    formattedHtml = formattedHtml.replace(/<br><h/g, '</p><h'); // Chiudi paragrafi prima dei titoli
    formattedHtml = formattedHtml.replace(/<p class="marketing-paragraph"><\/p>/g, ''); // Rimuovi paragrafi vuoti
    
    // Se il testo non inizia con un titolo, wrappalo in un paragrafo
    if (!formattedHtml.startsWith('<h')) {
        formattedHtml = '<p class="marketing-paragraph">' + formattedHtml;
    }
    
    // Chiudi l'ultimo paragrafo se necessario
    if (!formattedHtml.endsWith('</p>') && !formattedHtml.endsWith('</ul>') && !formattedHtml.endsWith('</h3>') && !formattedHtml.endsWith('</h4>')) {
        formattedHtml += '</p>';
    }

    outputDiv.innerHTML = formattedHtml;
    lucide.createIcons(); // Importante per renderizzare le icone
}

    function convertMarkdownToHtml(markdown) {
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold e Italic
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Lists
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        
        // Fix lists
        html = html.replace(/(<li>.*?<\/li>)(?=<\/p>)/gs, '</p><ul>$1</ul><p>');
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[123]>)/g, '$1');
        html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
        
        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/g, '');
        
        return html;
    }

function copyGeneratedText() {
    const textToCopy = plainTextDescription || outputDiv.innerText; // Usa il testo plain salvato
    if (navigator.clipboard && textToCopy) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => StorebotUtils.showTemporaryMessage("Testo copiato!", "success"))
            .catch(err => StorebotUtils.showTemporaryMessage("Errore copia.", "error"));
    }
}

    function downloadMarkdown() {
        if (!lastGeneratedMarkdown) {
            StorebotUtils.showTemporaryMessage("Nessuna descrizione da scaricare", "error");
            return;
        }

        const currentAddress = localStorage.getItem('storebot_currentAddress') || "immobile";
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `descrizione_marketing_${StorebotUtils.normalizeString(currentAddress).replace(/\s/g, '_')}_${timestamp}.md`;
        
        const blob = new Blob([lastGeneratedMarkdown], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        StorebotUtils.showTemporaryMessage("Descrizione scaricata in formato Markdown!", "success");
    }

    // Inizializza
    initializeGenerator();
});