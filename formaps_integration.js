// formaps_integration.js - Logica per l'integrazione Formaps

document.addEventListener('DOMContentLoaded', () => {
    // Variabili globali
    let currentAddress = '';
    let waitingForPaste = false;
    let chapters = JSON.parse(localStorage.getItem('storebot_formapsChapters')) || [];
    let chapterIdCounter = Date.now();
    let savedMaps = JSON.parse(localStorage.getItem('storebot_formapsMaps')) || [];
    let mapIdCounter = Date.now() + 1000000;

    function initializeFormaps() {
        lucide.createIcons();
        StorebotUtils.checkApiKeysAndNotify();

        // Carica indirizzo
        currentAddress = localStorage.getItem('storebot_currentAddress') || '';
        updateAddressDisplay();

        // Carica note salvate
        const notesTextarea = document.getElementById('formapsNotes');
        const savedNotes = localStorage.getItem('storebot_formapsNotes');
        if (savedNotes && notesTextarea) {
            notesTextarea.value = savedNotes;
        }

        // Renderizza contenuti esistenti
        renderChapters();
        renderMaps();

        // Setup tutti gli event listeners
        setupEventListeners();
        setupGlobalPasteListener();

        // CREA IL MODAL FORMAPS
        createFormapsModal();
    }

    function createFormapsModal() {
        // Nascondi vecchio container se esiste
        const oldContainer = document.getElementById('formapsContainer');
        if (oldContainer) {
            oldContainer.style.display = 'none';
        }

        // Crea modal HTML
        const modalHTML = `
            <div id="formapsModal" class="formaps-modal" style="display: none;">
                <div class="formaps-modal-content">
                    <div class="formaps-modal-header">
                        <h3>🗺️ Formaps - Analisi Territoriale</h3>
                        <div class="modal-controls">
                            <button class="btn-icon-small" onclick="minimizeFormapsModal()" title="Minimizza">
                                <i data-lucide="minus"></i>
                            </button>
                            <button class="btn-icon-small" onclick="maximizeFormapsModal()" title="Massimizza">
                                <i data-lucide="maximize-2"></i>
                            </button>
                            <button class="btn-icon-small" onclick="closeFormapsModal()" title="Chiudi">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    </div>
                    <div class="formaps-modal-body">
                        <iframe 
                            id="formapsFrame"
                            src="https://www.formaps.it/" 
                            title="Formaps"
                            style="width: 100%; height: 100%; border: none;"
                        ></iframe>
                    </div>
                </div>
            </div>
            
            <button id="openFormapsBtn" class="formaps-float-btn" onclick="openFormapsModal()" title="Apri Formaps">
                <i data-lucide="map"></i>
            </button>
        `;

        // Aggiungi al body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Aggiungi stili CSS
        addFormapsModalStyles();

        // Reinizializza icone
        lucide.createIcons();

        // Apri automaticamente
        setTimeout(() => {
            openFormapsModal();
        }, 500);
    }

    function addFormapsModalStyles() {
        if (document.getElementById('formaps-modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'formaps-modal-styles';
        styles.textContent = `
            .formaps-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                justify-content: center;
                align-items: center;
            }
            
            .formaps-modal-content {
                background: white;
                width: 80vw;
                height: 80vh;
                max-width: 1200px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
            }
            
            .formaps-modal-header {
                background: #f8f9fa;
                padding: 15px 20px;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #e9ecef;
            }
            
            .formaps-modal-header h3 {
                margin: 0;
                color: #2c3e50;
                font-size: 18px;
            }
            
            .modal-controls {
                display: flex;
                gap: 8px;
            }
            
            .formaps-modal-body {
                flex: 1;
                overflow: hidden;
                border-radius: 0 0 12px 12px;
            }
            
            .formaps-float-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #1ABC9C;
                color: white;
                border: none;
                box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4);
                cursor: pointer;
                z-index: 9998;
                display: none;
                transition: all 0.3s ease;
            }
            
            .formaps-float-btn:hover {
                background: #16A085;
                transform: scale(1.1);
            }
            
            .formaps-float-btn i {
                width: 24px;
                height: 24px;
            }
        `;
        document.head.appendChild(styles);
    }

    // Funzioni globali per il modal
    window.openFormapsModal = function() {
        const modal = document.getElementById('formapsModal');
        const floatBtn = document.getElementById('openFormapsBtn');
        if (modal) {
            modal.style.display = 'flex';
            if (floatBtn) floatBtn.style.display = 'none';
            
            if (currentAddress) {
                StorebotUtils.showTemporaryMessage(
                    `📍 Cerca "${currentAddress}" in Formaps per l'analisi territoriale`,
                    'info',
                    5000
                );
            }
        }
    };

    window.closeFormapsModal = function() {
        const modal = document.getElementById('formapsModal');
        const floatBtn = document.getElementById('openFormapsBtn');
        if (modal) modal.style.display = 'none';
        if (floatBtn) floatBtn.style.display = 'block';
    };

    window.minimizeFormapsModal = function() {
        const modal = document.querySelector('.formaps-modal-content');
        if (modal) {
            modal.style.width = '400px';
            modal.style.height = '300px';
        }
    };

    window.maximizeFormapsModal = function() {
        const modal = document.querySelector('.formaps-modal-content');
        if (modal) {
            modal.style.width = '90vw';
            modal.style.height = '90vh';
        }
    };

    function updateAddressDisplay() {
        const currentAddressDisplay = document.getElementById('currentAddressDisplay');
        const copyAddressBtn = document.getElementById('copyAddressBtn');
        const addressBar = document.getElementById('addressBar');
        
        if (currentAddress && currentAddressDisplay) {
            currentAddressDisplay.textContent = currentAddress;
            currentAddressDisplay.classList.add('has-address');
            if (copyAddressBtn) copyAddressBtn.style.display = 'flex';
            if (addressBar) addressBar.classList.add('has-address');
        } else if (currentAddressDisplay) {
            currentAddressDisplay.textContent = 'Nessun indirizzo selezionato';
            currentAddressDisplay.classList.remove('has-address');
            if (copyAddressBtn) copyAddressBtn.style.display = 'none';
            if (addressBar) addressBar.classList.remove('has-address');
        }
    }

    function setupEventListeners() {
        // Bottone copia indirizzo
        const copyAddressBtn = document.getElementById('copyAddressBtn');
        if (copyAddressBtn) {
            copyAddressBtn.addEventListener('click', copyAddress);
        }

        // Bottone refresh (ora apre/riapre il modal)
        const refreshBtn = document.getElementById('refreshFormapsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const frame = document.getElementById('formapsFrame');
                if (frame) {
                    frame.src = frame.src; // Ricarica
                }
                openFormapsModal();
            });
        }

        // Bottone nuova finestra (ora apre il modal)
        const openNewWindowBtn = document.getElementById('openNewWindowBtn');
        if (openNewWindowBtn) {
            openNewWindowBtn.addEventListener('click', () => {
                openFormapsModal();
            });
        }

        // Bottone fullscreen
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                maximizeFormapsModal();
                openFormapsModal();
            });
        }

        // Screenshot
        const screenshotBtn = document.getElementById('screenshotBtn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', activateScreenshotMode);
        }

        // AI Analysis
        const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
        if (aiAnalyzeBtn) {
            aiAnalyzeBtn.addEventListener('click', handleAIAnalysis);
        }

        // Save Map
        const saveMapBtn = document.getElementById('saveMapBtn');
        if (saveMapBtn) {
            saveMapBtn.addEventListener('click', handleSaveAsMap);
        }

        // Note
        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', saveNotes);
        }

        const notesTextarea = document.getElementById('formapsNotes');
        if (notesTextarea) {
            notesTextarea.addEventListener('input', debounce(() => {
                localStorage.setItem('storebot_formapsNotes', notesTextarea.value);
            }, 1000));
        }

        // Bottoni capitoli
        setupChapterButtons();
        
        // Bottoni mappe
        setupMapButtons();
    }

    function setupChapterButtons() {
        const collapseAllBtn = document.getElementById('collapseAllBtn');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                chapters.forEach(chapter => {
                    const content = document.getElementById(`chapter-content-${chapter.id}`);
                    const toggle = document.querySelector(`[data-chapter-id="${chapter.id}"] .chapter-toggle`);
                    if (content) content.style.display = 'none';
                    if (toggle) toggle.style.transform = 'rotate(-90deg)';
                });
            });
        }

        const expandAllBtn = document.getElementById('expandAllBtn');
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                chapters.forEach(chapter => {
                    const content = document.getElementById(`chapter-content-${chapter.id}`);
                    const toggle = document.querySelector(`[data-chapter-id="${chapter.id}"] .chapter-toggle`);
                    if (content) content.style.display = 'block';
                    if (toggle) toggle.style.transform = 'rotate(0deg)';
                });
            });
        }

        const clearAllChaptersBtn = document.getElementById('clearAllChaptersBtn');
        if (clearAllChaptersBtn) {
            clearAllChaptersBtn.addEventListener('click', () => {
                if (chapters.length === 0) {
                    StorebotUtils.showTemporaryMessage('Nessun capitolo da eliminare', 'info');
                    return;
                }
                
                if (confirm(`Sei sicuro di voler eliminare tutti i ${chapters.length} capitoli?`)) {
                    chapters = [];
                    saveChapters();
                    renderChapters();
                    StorebotUtils.showTemporaryMessage('Tutti i capitoli eliminati', 'success');
                }
            });
        }

        const transferToReportBtn = document.getElementById('transferToReportBtn');
        if (transferToReportBtn) {
            transferToReportBtn.addEventListener('click', () => {
                const reportData = {
                    timestamp: new Date().toISOString(),
                    address: currentAddress,
                    chapters: chapters,
                    manualNotes: document.getElementById('formapsNotes')?.value || '',
                    maps: savedMaps
                };
                
                localStorage.setItem('storebot_formapsReportData', JSON.stringify(reportData));
                StorebotUtils.showTemporaryMessage('Dati pronti per il Report Consolidato', 'success');
                
                if (confirm('Vuoi aprire il Report Consolidato ora?')) {
                    window.location.href = 'full_report.html';
                }
            });
        }
    }

    function setupMapButtons() {
        const clearAllMapsBtn = document.getElementById('clearAllMapsBtn');
        if (clearAllMapsBtn) {
            clearAllMapsBtn.addEventListener('click', () => {
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
    }

    function setupGlobalPasteListener() {
        document.addEventListener('paste', async (e) => {
            if (!waitingForPaste) return;
            
            e.preventDefault();
            const items = e.clipboardData.items;
            
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    waitingForPaste = false;
                    const screenshotBtn = document.getElementById('screenshotBtn');
                    if (screenshotBtn) screenshotBtn.classList.remove('active');
                    
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
        const screenshotBtn = document.getElementById('screenshotBtn');
        if (screenshotBtn) screenshotBtn.classList.add('active');
        
        StorebotUtils.showTemporaryMessage(
            '📸 Usa Win+Shift+S (o Cmd+Shift+4 su Mac) per catturare, poi premi Ctrl+V',
            'info',
            8000
        );
        
        setTimeout(() => {
            if (waitingForPaste) {
                waitingForPaste = false;
                if (screenshotBtn) screenshotBtn.classList.remove('active');
                StorebotUtils.showTemporaryMessage('Modalità cattura disattivata', 'warning');
            }
        }, 30000);
    }

    async function handleAIAnalysis() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            let imageFound = false;
            
            for (const item of clipboardItems) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
                    const reader = new FileReader();
                    
                    reader.onload = async (e) => {
                        await analyzeScreenshotWithGemini(e.target.result, true);
                    };
                    
                    reader.readAsDataURL(blob);
                    imageFound = true;
                    break;
                }
            }
            
            if (!imageFound) {
                StorebotUtils.showTemporaryMessage('Nessuna immagine trovata negli appunti', 'warning');
            }
        } catch (error) {
            StorebotUtils.showTemporaryMessage('Errore accesso clipboard', 'error');
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
                StorebotUtils.showTemporaryMessage('Nessuna immagine trovata negli appunti', 'warning');
            }
        } catch (error) {
            StorebotUtils.showTemporaryMessage('Errore accesso clipboard', 'error');
        }
    }

    function saveImageAsMap(imageDataUrl) {
        const newMap = {
            id: mapIdCounter++,
            title: `Mappa ${new Date().toLocaleString('it-IT')}`,
            imageUrl: imageDataUrl,
            timestamp: new Date().toISOString(),
            address: currentAddress,
            notes: ''
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
        
        StorebotUtils.showGlobalLoading('Analisi screenshot con AI...');
        
        const prompt = `Analizza questa schermata da Formaps e estrai TUTTI i dati visibili.`;

        try {
            const imagePart = {
                inlineData: {
                    mimeType: 'image/png',
                    data: imageDataUrl.split(',')[1]
                }
            };
            
            const result = await StorebotUtils.callGeminiAPI(prompt, [imagePart]);
            
            if (saveAsChapter) {
                let title = 'Analisi Formaps';
                const lines = result.split('\n');
                for (let line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        title = trimmed.substring(0, 60);
                        break;
                    }
                }
                
                const newChapter = {
                    id: chapterIdCounter++,
                    title: title,
                    content: result,
                    timestamp: new Date().toISOString(),
                    address: currentAddress
                };
                
                chapters.unshift(newChapter);
                saveChapters();
                renderChapters();
                
                StorebotUtils.showTemporaryMessage('✅ Analisi completata e salvata!', 'success');
            } else {
                const notesTextarea = document.getElementById('formapsNotes');
                if (notesTextarea) {
                    const currentNotes = notesTextarea.value;
                    const timestamp = new Date().toLocaleString('it-IT');
                    const separator = currentNotes ? '\n\n' + '='.repeat(50) + '\n\n' : '';
                    
                    notesTextarea.value = currentNotes + separator + 
                        `📸 ANALISI FORMAPS - ${timestamp}\n` +
                        `📍 Indirizzo: ${currentAddress || 'Non specificato'}\n\n` + 
                        result;
                    
                    localStorage.setItem('storebot_formapsNotes', notesTextarea.value);
                    notesTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    StorebotUtils.showTemporaryMessage('✅ Dati estratti e aggiunti alle note!', 'success');
                }
            }
        } catch (error) {
            StorebotUtils.showTemporaryMessage('❌ Errore analisi', 'error');
        } finally {
            StorebotUtils.hideGlobalLoading();
        }
    }

    function copyAddress() {
        if (!currentAddress) return;

        navigator.clipboard.writeText(currentAddress).then(() => {
            const copyAddressBtn = document.getElementById('copyAddressBtn');
            if (copyAddressBtn) {
                const originalHTML = copyAddressBtn.innerHTML;
                copyAddressBtn.innerHTML = '<i data-lucide="check"></i> Copiato!';
                copyAddressBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyAddressBtn.innerHTML = originalHTML;
                    copyAddressBtn.classList.remove('copied');
                    lucide.createIcons();
                }, 2000);
            }
            
            StorebotUtils.showTemporaryMessage('Indirizzo copiato!', 'success');
        }).catch(err => {
            StorebotUtils.showTemporaryMessage('Errore copia', 'error');
        });
    }

    function saveNotes() {
        const notesTextarea = document.getElementById('formapsNotes');
        if (notesTextarea) {
            const notes = notesTextarea.value.trim();
            localStorage.setItem('storebot_formapsNotes', notes);
            
            const formapsAnalysis = {
                timestamp: new Date().toISOString(),
                notes: notes,
                currentAddress: currentAddress || null
            };
            localStorage.setItem('storebot_formapsAnalysis', JSON.stringify(formapsAnalysis));
            
            StorebotUtils.showTemporaryMessage('Note salvate!', 'success');
        }
    }

    function saveChapters() {
        localStorage.setItem('storebot_formapsChapters', JSON.stringify(chapters));
    }

    function saveMaps() {
        localStorage.setItem('storebot_formapsMaps', JSON.stringify(savedMaps));
    }

    function renderChapters() {
        const container = document.getElementById('chaptersContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (chapters.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nessun capitolo salvato.</p>';
            return;
        }
        
        chapters.forEach(chapter => {
            container.appendChild(createChapterElement(chapter));
        });
        
        lucide.createIcons();
    }

    function renderMaps() {
        const container = document.getElementById('mapsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (savedMaps.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nessuna mappa salvata.</p>';
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

    function formatChapterContent(content) {
        let html = content;
        
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        html = html.replace(/^#### (.*?)$/gm, '<h5>$1</h5>');
        html = html.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^# (.*?)$/gm, '<h2>$1</h2>');
        
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    // Funzioni globali
    window.toggleChapter = function(id) {
        const content = document.getElementById(`chapter-content-${id}`);
        const toggle = document.querySelector(`[data-chapter-id="${id}"] .chapter-toggle`);
        
        if (content && toggle) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.style.transform = 'rotate(0deg)';
            } else {
                content.style.display = 'none';
                toggle.style.transform = 'rotate(-90deg)';
            }
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
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    };

    window.copyChapterContent = function(id) {
        const chapter = chapters.find(ch => ch.id == id);
        if (!chapter) return;
        
        const textContent = `${chapter.title}\n${new Date(chapter.timestamp).toLocaleString('it-IT')}\n\n${chapter.content}`;
        
        navigator.clipboard.writeText(textContent).then(() => {
            StorebotUtils.showTemporaryMessage('Contenuto copiato!', 'success');
        });
    };

    window.deleteChapter = function(id) {
        if (confirm('Eliminare questo capitolo?')) {
            chapters = chapters.filter(ch => ch.id != id);
            saveChapters();
            renderChapters();
            StorebotUtils.showTemporaryMessage('Capitolo eliminato', 'info');
        }
    };

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
        link.download = `mappa_${new Date().toISOString().slice(0,10)}.png`;
        link.click();
    };

    window.deleteMap = function(id) {
        if (confirm('Eliminare questa mappa?')) {
            savedMaps = savedMaps.filter(m => m.id != id);
            saveMaps();
            renderMaps();
        }
    };

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

    // Listener per aggiornamenti indirizzo
    window.addEventListener('storage', (e) => {
        if (e.key === 'storebot_currentAddress') {
            currentAddress = localStorage.getItem('storebot_currentAddress') || '';
            updateAddressDisplay();
        }
    });

    // INIZIALIZZA TUTTO
    initializeFormaps();
});
