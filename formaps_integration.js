// formaps_integration.js - Logica per l'integrazione Formaps

document.addEventListener('DOMContentLoaded', () => {
    // Elementi DOM
    const iframe = document.getElementById('formapsIframe');
    const iframeLoading = document.getElementById('iframeLoading');
    const refreshBtn = document.getElementById('refreshFormapsBtn');
    const openNewWindowBtn = document.getElementById('openNewWindowBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const notesTextarea = document.getElementById('formapsNotes');
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    const formapsContainer = document.getElementById('formapsContainer');
    
    // Elementi per la barra indirizzo
    const currentAddressDisplay = document.getElementById('currentAddressDisplay');
    const copyAddressBtn = document.getElementById('copyAddressBtn');
    const addressBar = document.getElementById('addressBar');

    // Elemento per screenshot
    const screenshotBtn = document.getElementById('screenshotBtn');
    let waitingForPaste = false;

    // Variabile per l'indirizzo corrente
    let currentAddress = '';

    // Struttura per gestire i capitoli
    let chapters = JSON.parse(localStorage.getItem('storebot_formapsChapters')) || [];
    let chapterIdCounter = Date.now();

    // Struttura per gestire le mappe
    let savedMaps = JSON.parse(localStorage.getItem('storebot_formapsMaps')) || [];
    let mapIdCounter = Date.now() + 1000000; // Offset per evitare conflitti con chapter IDs

    function initializeFormaps() {
        lucide.createIcons();
        StorebotUtils.checkApiKeysAndNotify();

        // Carica e mostra l'indirizzo corrente
        loadCurrentAddress();

        // Carica note salvate
        const savedNotes = localStorage.getItem('storebot_formapsNotes');
        if (savedNotes) {
            notesTextarea.value = savedNotes;
        }

        // Renderizza capitoli esistenti
        renderChapters();

        // Renderizza mappe esistenti
        renderMaps();

        // Setup event listeners
        setupEventListeners();

        // Setup global paste listener
        setupGlobalPasteListener();

        // Mostra iframe quando caricato
        iframe.addEventListener('load', () => {
            iframeLoading.style.display = 'none';
            iframe.style.display = 'block';
            StorebotUtils.showTemporaryMessage('Formaps caricato con successo', 'success');
        });

        // Gestione errori iframe
        iframe.addEventListener('error', () => {
            iframeLoading.innerHTML = `
                <div class="error-message">
                    <i data-lucide="alert-triangle"></i>
                    <p>Impossibile caricare Formaps. Verifica la connessione internet.</p>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        <i data-lucide="refresh-cw"></i> Riprova
                    </button>
                </div>
            `;
            lucide.createIcons();
        });
    }

    function loadCurrentAddress() {
        currentAddress = localStorage.getItem('storebot_currentAddress') || '';
        
        if (currentAddress) {
            currentAddressDisplay.textContent = currentAddress;
            currentAddressDisplay.classList.add('has-address');
            copyAddressBtn.style.display = 'flex';
            addressBar.classList.add('has-address');
            
            // Mostra suggerimento temporaneo
            StorebotUtils.showTemporaryMessage(
                `Copia l'indirizzo "${currentAddress}" e cercalo in Formaps per l'analisi territoriale`,
                'info',
                6000
            );
        } else {
            currentAddressDisplay.textContent = 'Nessun indirizzo selezionato';
            currentAddressDisplay.classList.remove('has-address');
            copyAddressBtn.style.display = 'none';
            addressBar.classList.remove('has-address');
        }
    }

    function setupEventListeners() {
        // Copia indirizzo
        copyAddressBtn.addEventListener('click', copyAddress);

        // Refresh iframe
        refreshBtn.addEventListener('click', () => {
            iframeLoading.style.display = 'flex';
            iframe.style.display = 'none';
            iframe.src = iframe.src; // Ricarica l'iframe
        });

        // Apri in nuova finestra
        openNewWindowBtn.addEventListener('click', () => {
            window.open('https://www.formaps.it/', '_blank');
        });

        // Schermo intero
        fullscreenBtn.addEventListener('click', toggleFullscreen);

        // Salva note
        saveNotesBtn.addEventListener('click', saveNotes);

        // Auto-save delle note
        notesTextarea.addEventListener('input', debounce(() => {
            localStorage.setItem('storebot_formapsNotes', notesTextarea.value);
        }, 1000));

        // Screenshot - attiva modalità cattura
        screenshotBtn.addEventListener('click', activateScreenshotMode);

        // AI Analysis button
        const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
        aiAnalyzeBtn.addEventListener('click', handleAIAnalysis);

        // Save Map button
        document.getElementById('saveMapBtn').addEventListener('click', handleSaveAsMap);

        // Capitoli controls
        document.getElementById('collapseAllBtn').addEventListener('click', () => {
            chapters.forEach(chapter => {
                const content = document.getElementById(`chapter-content-${chapter.id}`);
                const toggle = document.querySelector(`[data-chapter-id="${chapter.id}"] .chapter-toggle`);
                if (content && toggle) {
                    content.style.display = 'none';
                    toggle.style.transform = 'rotate(-90deg)';
                }
            });
        });

        document.getElementById('expandAllBtn').addEventListener('click', () => {
            chapters.forEach(chapter => {
                const content = document.getElementById(`chapter-content-${chapter.id}`);
                const toggle = document.querySelector(`[data-chapter-id="${chapter.id}"] .chapter-toggle`);
                if (content && toggle) {
                    content.style.display = 'block';
                    toggle.style.transform = 'rotate(0deg)';
                }
            });
        });

        // Clear all chapters button
        document.getElementById('clearAllChaptersBtn').addEventListener('click', () => {
            if (chapters.length === 0) {
                StorebotUtils.showTemporaryMessage('Nessun capitolo da eliminare', 'info');
                return;
            }
            
            if (confirm(`Sei sicuro di voler eliminare tutti i ${chapters.length} capitoli? Questa azione non può essere annullata.`)) {
                chapters = [];
                saveChapters();
                renderChapters();
                StorebotUtils.showTemporaryMessage('Tutti i capitoli sono stati eliminati', 'success');
            }
        });

        // Transfer to Report button
        document.getElementById('transferToReportBtn').addEventListener('click', () => {
            const reportData = {
                timestamp: new Date().toISOString(),
                address: currentAddress,
                chapters: chapters,
                manualNotes: notesTextarea.value,
                maps: savedMaps
            };
            
            // Salva in localStorage per Full Report
            localStorage.setItem('storebot_formapsReportData', JSON.stringify(reportData));
            
            StorebotUtils.showTemporaryMessage('Dati pronti per il trasferimento al Report Consolidato', 'success');
            
            // Opzionale: apri la pagina del report
            if (confirm('Vuoi aprire il Report Consolidato ora?')) {
                window.location.href = 'full_report.html';
            }
        });

        // Clear all maps button
        document.getElementById('clearAllMapsBtn').addEventListener('click', () => {
            if (savedMaps.length === 0) {
                StorebotUtils.showTemporaryMessage('Nessuna mappa da eliminare', 'info');
                return;
            }
            
            if (confirm(`Eliminare tutte le ${savedMaps.length} mappe?`)) {
                savedMaps = [];
                saveMaps();
                renderMaps();
                StorebotUtils.showTemporaryMessage('Tutte le mappe eliminate', 'success');
            }
        });
    }

    function setupGlobalPasteListener() {
        document.addEventListener('paste', async (e) => {
            // Solo se siamo in attesa di uno screenshot
            if (!waitingForPaste) return;
            
            e.preventDefault();
            const items = e.clipboardData.items;
            
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    waitingForPaste = false;
                    screenshotBtn.classList.remove('active');
                    
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    
                    reader.onload = async (event) => {
                        await analyzeScreenshotWithGemini(event.target.result);
                    };
                    
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        });
    }

    function activateScreenshotMode() {
        waitingForPaste = true;
        screenshotBtn.classList.add('active');
        
        // Mostra istruzioni
        StorebotUtils.showTemporaryMessage(
            '📸 Usa Win+Shift+S (o Cmd+Shift+4 su Mac) per catturare, poi premi Ctrl+V per analizzare',
            'info',
            8000
        );
        
        // Timeout dopo 30 secondi
        setTimeout(() => {
            if (waitingForPaste) {
                waitingForPaste = false;
                screenshotBtn.classList.remove('active');
                StorebotUtils.showTemporaryMessage('Modalità cattura disattivata', 'warning');
            }
        }, 30000);
    }

    async function handleAIAnalysis() {
        try {
            // Leggi clipboard
            const clipboardItems = await navigator.clipboard.read();
            let imageFound = false;
            
            for (const item of clipboardItems) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
                    const reader = new FileReader();
                    
                    reader.onload = async (e) => {
                        await analyzeScreenshotWithGemini(e.target.result, true); // true = save as chapter
                    };
                    
                    reader.readAsDataURL(blob);
                    imageFound = true;
                    break;
                }
            }
            
            if (!imageFound) {
                StorebotUtils.showTemporaryMessage('Nessuna immagine trovata negli appunti. Cattura prima uno screenshot.', 'warning');
            }
        } catch (error) {
            console.error('Errore accesso clipboard:', error);
            StorebotUtils.showTemporaryMessage('Errore nell\'accesso agli appunti. Verifica i permessi del browser.', 'error');
        }
    }

    async function handleSaveAsMap() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            let imageFound = false;
            
            for (const item of clipboardItems) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        saveImageAsMap(e.target.result);
                    };
                    
                    reader.readAsDataURL(blob);
                    imageFound = true;
                    break;
                }
            }
            
            if (!imageFound) {
                StorebotUtils.showTemporaryMessage('Nessuna immagine trovata negli appunti. Cattura prima uno screenshot.', 'warning');
            }
        } catch (error) {
            console.error('Errore accesso clipboard:', error);
            StorebotUtils.showTemporaryMessage('Errore nell\'accesso agli appunti.', 'error');
        }
    }

    function saveImageAsMap(imageDataUrl) {
        const newMap = {
            id: mapIdCounter++,
            title: `Mappa ${new Date().toLocaleString('it-IT')}`,
            imageUrl: imageDataUrl,
            timestamp: new Date().toISOString(),
            address: currentAddress,
            notes: '' // Campo per note future sulla mappa
        };
        
        savedMaps.unshift(newMap);
        saveMaps();
        renderMaps();
        
        StorebotUtils.showTemporaryMessage('✅ Mappa salvata con successo!', 'success');
    }

    async function analyzeScreenshotWithGemini(imageDataUrl, saveAsChapter = false) {
        const geminiApiKey = StorebotUtils.getApiKey('gemini');
        if (!geminiApiKey) {
            StorebotUtils.showTemporaryMessage('Gemini API Key non configurata', 'error');
            return;
        }
        
        StorebotUtils.showGlobalLoading('Analisi screenshot con AI in corso...');
        
        const prompt = `Analizza questa schermata catturata da Formaps (piattaforma di analisi territoriale) e:
1. Estrai TUTTI i dati visibili (numeri, percentuali, nomi, valori, metriche)
2. Se ci sono dati demografici, elencali in formato tabella usando la sintassi Markdown
3. Se ci sono informazioni su competitor o attività commerciali, organizzale per categoria
4. Se ci sono grafici o mappe, descrivi dettagliatamente i valori e le informazioni territoriali
5. Organizza tutto in formato strutturato con titoli chiari usando Markdown (##, ###, liste con -, tabelle con |)

IMPORTANTE: 
- Includi SOLO sezioni che contengono dati effettivi
- NON includere sezioni vuote o con frasi tipo "non sono presenti dati"
- Inizia con un titolo breve e descrittivo (max 50 caratteri) che riassuma il contenuto principale della schermata
- Usa formato Markdown per tabelle, liste ed evidenziazioni

Formatta la risposta in Markdown professionale e leggibile.`;

        try {
            // Prepara l'immagine per l'API
            const imagePart = {
                inlineData: {
                    mimeType: 'image/png',
                    data: imageDataUrl.split(',')[1] // Rimuovi il prefisso data:image/png;base64,
                }
            };
            
            // Chiama Gemini usando la funzione esistente
            const result = await StorebotUtils.callGeminiAPI(prompt, [imagePart]);
            
            if (saveAsChapter) {
                // Estrai il titolo dal risultato (prima riga o primo heading)
                let title = 'Analisi Formaps';
                const lines = result.split('\n');
                for (let line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        // Prima riga non vuota e non heading
                        title = trimmed.substring(0, 60);
                        break;
                    } else if (trimmed.startsWith('#')) {
                        // Primo heading
                        title = trimmed.replace(/^#+\s*/, '').substring(0, 60);
                        break;
                    }
                }
                
                // Crea nuovo capitolo
                const newChapter = {
                    id: chapterIdCounter++,
                    title: title,
                    content: result,
                    timestamp: new Date().toISOString(),
                    address: currentAddress
                };
                
                chapters.unshift(newChapter); // Aggiungi all'inizio
                saveChapters();
                renderChapters();
                
                StorebotUtils.showTemporaryMessage('✅ Analisi completata e salvata come nuovo capitolo!', 'success');
            } else {
                // Comportamento esistente per la textarea
                const currentNotes = notesTextarea.value;
                const timestamp = new Date().toLocaleString('it-IT');
                const separator = currentNotes ? '\n\n' + '='.repeat(50) + '\n\n' : '';
                
                notesTextarea.value = currentNotes + separator + 
                    `📸 ANALISI FORMAPS - ${timestamp}\n` +
                    `📍 Indirizzo di riferimento: ${currentAddress || 'Non specificato'}\n\n` + 
                    result;
                
                // Salva automaticamente
                localStorage.setItem('storebot_formapsNotes', notesTextarea.value);
                
                // Scrolla alle note con evidenziazione
                notesTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                notesTextarea.style.backgroundColor = '#E8F8F5';
                notesTextarea.style.transition = 'background-color 0.3s ease';
                setTimeout(() => {
                    notesTextarea.style.backgroundColor = '';
                }, 2000);
                
                StorebotUtils.showTemporaryMessage('✅ Dati Formaps estratti e aggiunti alle note!', 'success');
            }
            
        } catch (error) {
            console.error('Errore analisi Gemini:', error);
            StorebotUtils.showTemporaryMessage('❌ Errore durante l\'analisi dello screenshot', 'error');
        } finally {
            StorebotUtils.hideGlobalLoading();
        }
    }

    function createChapterElement(chapter) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-item';
        chapterDiv.dataset.chapterId = chapter.id;
        
        chapterDiv.innerHTML = `
            <div class="chapter-header">
                <div class="chapter-title-wrapper" onclick="toggleChapter('${chapter.id}')">
                    <i data-lucide="chevron-down" class="chapter-toggle"></i>
                    <span class="chapter-title">${chapter.title}</span>
                    <span class="chapter-date">${new Date(chapter.timestamp).toLocaleString('it-IT')}</span>
                </div>
                <div class="chapter-actions">
                    <button class="btn-icon-small" onclick="viewChapterPopup('${chapter.id}')" title="Visualizza">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="btn-icon-small" onclick="copyChapterContent('${chapter.id}')" title="Copia">
                        <i data-lucide="copy"></i>
                    </button>
                    <button class="btn-icon-small" onclick="deleteChapter('${chapter.id}')" title="Elimina">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="chapter-content" id="chapter-content-${chapter.id}" style="display: none;">
                <div class="chapter-text">${formatChapterContent(chapter.content)}</div>
            </div>
        `;
        
        return chapterDiv;
    }

    function renderChapters() {
        const container = document.getElementById('chaptersContainer');
        container.innerHTML = '';
        
        if (chapters.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nessun capitolo salvato. Usa il pulsante AI per analizzare screenshot.</p>';
            return;
        }
        
        chapters.forEach(chapter => {
            container.appendChild(createChapterElement(chapter));
        });
        
        lucide.createIcons();
    }

    function saveChapters() {
        localStorage.setItem('storebot_formapsChapters', JSON.stringify(chapters));
    }

    function saveMaps() {
        localStorage.setItem('storebot_formapsMaps', JSON.stringify(savedMaps));
    }

   function renderMaps() {
    const container = document.getElementById('mapsContainer');
    container.innerHTML = '';
    
    if (savedMaps.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nessuna mappa salvata. Usa il pulsante mappa per salvare screenshot.</p>';
        return;
    }
    
    savedMaps.forEach(map => {
        const mapDiv = document.createElement('div');
        mapDiv.className = 'map-item';
        mapDiv.innerHTML = `
            <div class="map-thumbnail-wrapper" onclick="viewMapFullscreen('${map.id}')">
                <img src="${map.imageUrl}" alt="${map.title}" class="map-thumbnail">
                <div class="map-overlay">
                    <i data-lucide="maximize-2" class="map-overlay-icon"></i>
                </div>
            </div>
            <div class="map-info">
                <div class="map-title">${map.title}</div>
                <div class="map-actions">
                    <button class="btn-icon-map" onclick="event.stopPropagation(); viewMapFullscreen('${map.id}')" title="Visualizza">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="btn-icon-map" onclick="event.stopPropagation(); downloadMap('${map.id}')" title="Scarica">
                        <i data-lucide="download"></i>
                    </button>
                    <button class="btn-icon-map" onclick="event.stopPropagation(); deleteMap('${map.id}')" title="Elimina">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(mapDiv);
    });
    
    lucide.createIcons();
}

    function formatChapterContent(content) {
        // Parser Markdown avanzato per formattare il contenuto
        let html = content;
        
        // Escape HTML entities per sicurezza
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Headers (dal più grande al più piccolo)
        html = html.replace(/^#### (.*?)$/gm, '<h5 style="color: #374151; margin: 15px 0 10px 0;">$1</h5>');
        html = html.replace(/^### (.*?)$/gm, '<h4 style="color: #1F2937; margin: 20px 0 15px 0;">$1</h4>');
        html = html.replace(/^## (.*?)$/gm, '<h3 style="color: #1ABC9C; margin: 25px 0 15px 0; font-weight: 600;">$1</h3>');
        html = html.replace(/^# (.*?)$/gm, '<h2 style="color: #16A085; margin: 30px 0 20px 0;">$1</h2>');
        
        // Bold e Italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1F2937;">$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #F3F4F6; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 15px 0;"><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`(.*?)`/g, '<code style="background: #E5E7EB; padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>');
        
        // Tabelle Markdown
        html = html.replace(/\n((?:\|.*\|.*\n)+)/g, function(match, table) {
            const rows = table.trim().split('\n');
            let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 15px 0;">';
            
            rows.forEach((row, index) => {
                const cells = row.split('|').filter(cell => cell.trim());
                
                // Skip separator row (contains only dashes)
                if (cells.every(cell => /^[-:\s]+$/.test(cell))) return;
                
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    const tag = index === 0 ? 'th' : 'td';
                    const style = index === 0 
                        ? 'style="background: #F3F4F6; font-weight: 600; padding: 10px; border: 1px solid #E5E7EB; text-align: left;"'
                        : 'style="padding: 10px; border: 1px solid #E5E7EB;"';
                    tableHtml += `<${tag} ${style}>${cell.trim()}</${tag}>`;
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += '</table>';
            return '\n' + tableHtml;
        });
        
        // Liste non ordinate (prima di newlines per preservare struttura)
        html = html.replace(/^[\*\-\+] (.+)$/gm, function(match, item) {
            return `<li style="margin: 5px 0;">${item}</li>`;
        });
        
        // Raggruppa gli <li> in <ul>
        html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)(?!<li)/g, function(match) {
            const items = match.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];
            if (items.length > 0) {
                return '<ul style="margin: 15px 0; padding-left: 25px;">' + items.join('') + '</ul>';
            }
            return match;
        });
        
        // Horizontal rules
        html = html.replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #E5E7EB; margin: 20px 0;">');
        
        // Paragrafi e newlines
        html = html.replace(/\n\n+/g, '</p><p style="margin: 10px 0; line-height: 1.6;">');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragrafo se non inizia con tag HTML
        if (!html.match(/^<[^>]+>/)) {
            html = '<p style="margin: 10px 0; line-height: 1.6;">' + html + '</p>';
        }
        
        // Pulisci paragrafi vuoti
        html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
        
        // Evidenzia numeri e percentuali importanti
        html = html.replace(/\b(\d+(?:\.\d+)?%)\b/g, '<span style="color: #1ABC9C; font-weight: 600;">$1</span>');
        html = html.replace(/\b(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*(€|abitanti|mq|km)/g, '<span style="color: #16A085; font-weight: 600;">$1 $2</span>');
        
        return html;
    }

    // Funzioni globali per i capitoli
    window.toggleChapter = function(id) {
        const content = document.getElementById(`chapter-content-${id}`);
        const toggle = document.querySelector(`[data-chapter-id="${id}"] .chapter-toggle`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.style.transform = 'rotate(0deg)';
        } else {
            content.style.display = 'none';
            toggle.style.transform = 'rotate(-90deg)';
        }
    };

    window.viewChapterPopup = function(id) {
        const chapter = chapters.find(ch => ch.id == id);
        if (!chapter) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'chapter-popup-overlay';
        overlay.innerHTML = `
            <div class="chapter-popup">
                <div class="popup-header">
                    <h3>${chapter.title}</h3>
                    <button class="popup-close" onclick="this.closest('.chapter-popup-overlay').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="popup-content">
                    <div class="chapter-text">${formatChapterContent(chapter.content)}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        lucide.createIcons();
        
        // Chiudi con click fuori
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    };

    window.copyChapterContent = function(id) {
        const chapter = chapters.find(ch => ch.id == id);
        if (!chapter) return;
        
        const textContent = `${chapter.title}\n${new Date(chapter.timestamp).toLocaleString('it-IT')}\n\n${chapter.content}`;
        
        navigator.clipboard.writeText(textContent).then(() => {
            StorebotUtils.showTemporaryMessage('Contenuto copiato negli appunti!', 'success');
        }).catch(err => {
            console.error('Errore copia:', err);
            StorebotUtils.showTemporaryMessage('Errore nella copia del contenuto', 'error');
        });
    };

    window.deleteChapter = function(id) {
        if (confirm('Sei sicuro di voler eliminare questo capitolo?')) {
            chapters = chapters.filter(ch => ch.id != id);
            saveChapters();
            renderChapters();
            StorebotUtils.showTemporaryMessage('Capitolo eliminato', 'info');
        }
    };

    // Funzioni globali per le mappe
    window.viewMapFullscreen = function(id) {
        const map = savedMaps.find(m => m.id == id);
        if (!map) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'map-fullscreen-overlay';
        overlay.innerHTML = `
            <div class="map-fullscreen-container">
                <button class="map-close-btn" onclick="this.closest('.map-fullscreen-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
                <img src="${map.imageUrl}" alt="${map.title}" class="map-fullscreen-image">
                <div class="map-info">
                    <h3>${map.title}</h3>
                    <p>Indirizzo: ${map.address || 'Non specificato'}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        lucide.createIcons();
    };

    window.downloadMap = function(id) {
        const map = savedMaps.find(m => m.id == id);
        if (!map) return;
        
        const link = document.createElement('a');
        link.href = map.imageUrl;
        link.download = `mappa_${map.address ? map.address.replace(/[^a-z0-9]/gi, '_') : 'formaps'}_${new Date().toISOString().slice(0,10)}.png`;
        link.click();
    };

    window.deleteMap = function(id) {
        if (confirm('Eliminare questa mappa?')) {
            savedMaps = savedMaps.filter(m => m.id != id);
            saveMaps();
            renderMaps();
        }
    };

    function copyAddress() {
        if (!currentAddress) return;

        navigator.clipboard.writeText(currentAddress).then(() => {
            // Animazione feedback
            const originalHTML = copyAddressBtn.innerHTML;
            copyAddressBtn.innerHTML = '<i data-lucide="check"></i> Copiato!';
            copyAddressBtn.classList.add('copied');
            
            setTimeout(() => {
                copyAddressBtn.innerHTML = originalHTML;
                copyAddressBtn.classList.remove('copied');
                lucide.createIcons();
            }, 2000);
            
            StorebotUtils.showTemporaryMessage('Indirizzo copiato! Incollalo nella ricerca di Formaps', 'success');
        }).catch(err => {
            console.error('Errore copia:', err);
            // Fallback per browser che non supportano clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = currentAddress;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                StorebotUtils.showTemporaryMessage('Indirizzo copiato!', 'success');
            } catch (e) {
                StorebotUtils.showTemporaryMessage('Errore nella copia dell\'indirizzo', 'error');
            }
            
            document.body.removeChild(textArea);
        });
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            formapsContainer.requestFullscreen().then(() => {
                fullscreenBtn.innerHTML = '<i data-lucide="minimize-2"></i> Esci Schermo Intero';
                lucide.createIcons();
            }).catch(err => {
                console.error('Errore fullscreen:', err);
                StorebotUtils.showTemporaryMessage('Impossibile attivare schermo intero', 'error');
            });
        } else {
            document.exitFullscreen().then(() => {
                fullscreenBtn.innerHTML = '<i data-lucide="maximize-2"></i> Schermo Intero';
                lucide.createIcons();
            });
        }
    }

    function saveNotes() {
        const notes = notesTextarea.value.trim();
        localStorage.setItem('storebot_formapsNotes', notes);
        
        // Salva anche come parte dell'analisi completa
        const formapsAnalysis = {
            timestamp: new Date().toISOString(),
            notes: notes,
            currentAddress: currentAddress || null
        };
        localStorage.setItem('storebot_formapsAnalysis', JSON.stringify(formapsAnalysis));
        
        StorebotUtils.showTemporaryMessage('Note salvate con successo!', 'success');
    }

    // Utility function per debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Listener per aggiornamenti dell'indirizzo da altre pagine
    window.addEventListener('storage', (e) => {
        if (e.key === 'storebot_currentAddress') {
            loadCurrentAddress();
        }
    });

    // Inizializza
    initializeFormaps();
});