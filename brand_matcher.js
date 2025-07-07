// brand_matcher.js - Logica per la pagina di Matching Brand con visualizzazione avanzata

document.addEventListener('DOMContentLoaded', () => {
    const propertyDetailsTextarea = document.getElementById('propertyDetailsForMatching');
    const neighborhoodContextTextarea = document.getElementById('neighborhoodContextForMatching');
    const runMatchingBtn = document.getElementById('runBrandMatchingBtn');
    const outputDiv = document.getElementById('brandMatchingOutput');
    const copyBtn = document.getElementById('copyBrandMatchTextBtn');
    const downloadBtn = document.getElementById('downloadBrandReportBtn');

    let lastMatchingMessage = ''; // Per salvare il testo plain dell'analisi

    function initializeMatcher() {
        lucide.createIcons();
        StorebotUtils.checkApiKeysAndNotify();
        addMatchingStyles(); // Aggiungi gli stili CSS per le card

        const propertyDetails = localStorage.getItem('storebot_propertyDetails');
        if (propertyDetails) {
             try { propertyDetailsTextarea.value = JSON.stringify(JSON.parse(propertyDetails), null, 2); }
             catch (e) { propertyDetailsTextarea.value = propertyDetails; }
        }
        const neighborhoodContext = localStorage.getItem('storebot_contextAISummary');
        if (neighborhoodContext) {
            neighborhoodContextTextarea.value = neighborhoodContext;
        }

        runMatchingBtn.addEventListener('click', runMatchingAnalysis);
        copyBtn.addEventListener('click', copyAnalysisText);
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadReport);
        }
    }

    // Aggiungi gli stili CSS per le card del matching
    function addMatchingStyles() {
        if (!document.querySelector('style[data-matching-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-matching-styles', 'true');
            style.textContent = `
                /* Matching Cards Styles */
                .matching-content {
                    padding: 24px 0;
                    font-family: 'Inter', sans-serif;
                }
                
                .matching-summary {
                    background: linear-gradient(135deg, #E8F6F3 0%, #D5F4E6 100%);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 32px;
                    border: 1px solid #A3E4D7;
                }
                
                .matching-summary-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #0E7A5C;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .matching-summary-content {
                    color: #117A65;
                    line-height: 1.6;
                }
                
                /* Brand Cards Grid */
                .brand-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                    padding: 24px 0;
                }
                
                .brand-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    padding: 24px;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }
                
                .brand-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                }
                
                .brand-card.expanded {
                    grid-column: span 2;
                    cursor: default;
                    border-color: #1ABC9C;
                    box-shadow: 0 8px 30px rgba(26, 188, 156, 0.15);
                }
                
                @media (max-width: 768px) {
                    .brand-card.expanded {
                        grid-column: span 1;
                    }
                }
                
                .brand-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .brand-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #2C3E50;
                    margin: 0;
                }
                
                .brand-score {
                    font-size: 2rem;
                    font-weight: 900;
                    margin: 0;
                    padding: 8px 16px;
                    border-radius: 12px;
                }
                
                .score-high { 
                    color: #059669; 
                    background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); 
                }
                .score-medium { 
                    color: #D97706; 
                    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); 
                }
                .score-low { 
                    color: #DC2626; 
                    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); 
                }
                
                /* Progress Bar */
                .matching-bar-container {
                    margin-bottom: 20px;
                }
                
                .matching-bar-label {
                    font-size: 0.875rem;
                    color: #718096;
                    margin-bottom: 8px;
                    font-weight: 500;
                }
                
                .matching-bar {
                    height: 12px;
                    background: #E2E8F0;
                    border-radius: 6px;
                    overflow: hidden;
                }
                
                .matching-bar-fill {
                    height: 100%;
                    border-radius: 6px;
                    transition: width 1s ease-out;
                    position: relative;
                    overflow: hidden;
                }
                
                .matching-bar-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
                    animation: shimmer 2s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .bar-low {
                    background: linear-gradient(90deg, #FCA5A5 0%, #EF4444 100%);
                }
                
                .bar-medium {
                    background: linear-gradient(90deg, #FDE047 0%, #F59E0B 100%);
                }
                
                .bar-high {
                    background: linear-gradient(90deg, #86EFAC 0%, #10B981 100%);
                }
                
                /* Brand Details */
                .brand-details {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #E5E7EB;
                }
                
                .brand-detail-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                
                .brand-detail-icon {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                    margin-top: 2px;
                    color: #6B7280;
                }
                
                .brand-detail-icon.score-high {
                    color: #059669;
                }
                
                /* Expanded Card Details */
                .brand-full-details {
                    display: none;
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 2px solid #E5E7EB;
                }
                
                .brand-card.expanded .brand-full-details {
                    display: block;
                    animation: fadeIn 0.3s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .expand-indicator {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    width: 24px;
                    height: 24px;
                    background: #F3F4F6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .brand-card:hover .expand-indicator {
                    background: #E5E7EB;
                }
                
                .brand-card.expanded .expand-indicator {
                    transform: rotate(180deg);
                    background: #E5E7EB;
                }
                
                .brand-card:not(.expanded) .brand-card-header::after {
                    content: 'Clicca per dettagli';
                    position: absolute;
                    bottom: -16px;
                    left: 0;
                    font-size: 0.75rem;
                    color: #9CA3AF;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .brand-card:hover .brand-card-header::after {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async function runMatchingAnalysis() {
        const botId = StorebotUtils.getApiKey('botId');
        if (!botId) {
            StorebotUtils.showTemporaryMessage("Storebot Chat Bot ID non configurato.", "error");
            return;
        }

        const propertyJson = propertyDetailsTextarea.value.trim();
        const neighborhoodText = neighborhoodContextTextarea.value.trim();

        if (!propertyJson || !neighborhoodText) {
            StorebotUtils.showTemporaryMessage("Dati immobile e/o analisi contesto mancanti.", "warning");
            return;
        }

        const prompt = `ANALISI COMPATIBILITÀ BRAND-IMMOBILE PER STOREBOT SUITE

DESCRIZIONE CONTESTO QUARTIERE:
${neighborhoodText}

DATI IMMOBILE (JSON):
${propertyJson}

TASK:
Analizza la compatibilità tra le caratteristiche del quartiere e dell'immobile con i requisiti tipici dei brand commerciali.

Per ogni brand che suggerisci, fornisci:
1. **Nome del Brand** - Compatibilità: X/10 punti
   * Descrizione: breve descrizione del brand o della categoria
   * Punti di forza: perché questo brand è adatto a questa location
   * Requisiti soddisfatti: quali caratteristiche dell'immobile/quartiere sono favorevoli
   * Considerazioni: eventuali aspetti da valutare o migliorare

Identifica almeno 5-8 brand, ordinandoli dal più compatibile al meno compatibile.

Usa esattamente questo formato per ogni brand:
**[NOME BRAND]** - Compatibilità: [NUMERO]/10 punti
* Descrizione: [testo]
* Punti di forza: [testo]
* Requisiti soddisfatti: [testo]
* Considerazioni: [testo]

Concludi con una sintesi finale e raccomandazioni strategiche.`;

        StorebotUtils.showGlobalLoading("Analisi compatibilità brand...");
        outputDiv.classList.add('placeholder');
        outputDiv.textContent = "Analisi in corso...";
        copyBtn.style.display = 'none';
        if (downloadBtn) downloadBtn.style.display = 'none';

        try {
            const report = await StorebotUtils.callGeminiAPI(prompt);
            lastMatchingMessage = report; // Salva il testo plain
            
            outputDiv.classList.remove('placeholder');
            outputDiv.innerHTML = formatMatchingResults(report);
            
            // Anima le barre di progresso dopo un breve delay
            setTimeout(() => {
                const bars = outputDiv.querySelectorAll('.matching-bar-fill');
                bars.forEach(bar => {
                    const targetWidth = bar.getAttribute('data-width');
                    if (targetWidth) {
                        bar.style.width = targetWidth;
                    }
                });
            }, 100);
            
            copyBtn.style.display = 'inline-flex';
            if (downloadBtn) downloadBtn.style.display = 'inline-flex';
            // Mostra la sezione delle azioni
            const resultActions = document.querySelector('.result-actions');
            if (resultActions) {
                resultActions.style.display = 'block';
            }
            localStorage.setItem('storebot_brandMatchingReport', report);
            StorebotUtils.showTemporaryMessage("Analisi matching completata!", "success");
            
            // Aggiorna le icone Lucide
            lucide.createIcons();
            
        } catch (error) {
            StorebotUtils.showTemporaryMessage(`Errore: ${error.message}`, "error");
            outputDiv.textContent = "Errore durante l'analisi.";
            outputDiv.classList.add('placeholder');
        } finally {
            StorebotUtils.hideGlobalLoading();
        }
    }

    function formatMatchingResults(message) {
        const brandData = extractBrandData(message);
        
        if (!brandData || brandData.length === 0) {
            return '<div class="matching-content"><p>Nessun risultato di matching trovato.</p></div>';
        }
        
        let formatted = '<div class="matching-content">';
        
        // Summary section
        const highMatchBrands = brandData.filter(b => b.score >= 7);
        const mediumMatchBrands = brandData.filter(b => b.score >= 5 && b.score < 7);
        
        if (highMatchBrands.length > 0 || mediumMatchBrands.length > 0) {
            formatted += `
                <div class="matching-summary">
                    <div class="matching-summary-title">
                        <i data-lucide="sparkles"></i>
                        Risultati Matching
                    </div>
                    <div class="matching-summary-content">
                        ${highMatchBrands.length > 0 ? 
                        `Abbiamo trovato <strong>${highMatchBrands.length} brand</strong> con alta compatibilità 
                        (punteggio ≥ 7/10) per questo immobile.` : ''}
                        ${mediumMatchBrands.length > 0 ? 
                        `${highMatchBrands.length > 0 ? 'Altri' : 'Trovati'} ${mediumMatchBrands.length} brand con compatibilità media.` : ''}
                        <br><small style="display: block; margin-top: 8px; opacity: 0.8;">💡 Clicca su una card per vedere l'analisi dettagliata</small>
                    </div>
                </div>
            `;
        }
        
        // Grid delle card
        formatted += '<div class="brand-cards-grid">';
        
        brandData.forEach((brand, index) => {
            formatted += createBrandCard(brand, index);
        });
        
        formatted += '</div>';
        
        // Aggiungi eventuali conclusioni finali
        const conclusionsMatch = message.match(/(?:CONCLUSIONI|SINTESI FINALE|RACCOMANDAZIONI STRATEGICHE)[\s\S]*$/i);
        if (conclusionsMatch) {
            formatted += `
                <div style="margin-top: 40px; padding: 20px; background: #F8F9FA; border-radius: 12px; border-left: 4px solid #1ABC9C;">
                    <h3 style="color: #2C3E50; margin-bottom: 15px;">Conclusioni e Raccomandazioni</h3>
                    <div style="color: #566573; line-height: 1.8;">
                        ${formatText(conclusionsMatch[0])}
                    </div>
                </div>
            `;
        }
        
        formatted += '</div>';
        
        return formatted;
    }

    function extractBrandData(message) {
        const brands = [];
        const lines = message.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Cerca pattern: **Nome Brand** - Compatibilità: X/10 punti
            const brandMatch = line.match(/\*\*(.+?)\*\*\s*-\s*Compatibilità:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
            
            if (brandMatch) {
                const brand = {
                    name: brandMatch[1].trim(),
                    score: parseFloat(brandMatch[2]),
                    details: []
                };
                
                // Raccogli i dettagli del brand (le righe successive che iniziano con *)
                let j = i + 1;
                let fullText = [];
                
                while (j < lines.length) {
                    const detailLine = lines[j].trim();
                    
                    // Se troviamo un altro brand o una sezione finale, fermiamoci
                    if (detailLine.match(/\*\*(.+?)\*\*\s*-\s*Compatibilità:/i) || 
                        detailLine.match(/^(CONCLUSIONI|SINTESI FINALE|RACCOMANDAZIONI)/i)) {
                        break;
                    }
                    
                    if (detailLine.startsWith('*')) {
                        fullText.push(detailLine);
                        
                        // Estrai solo i primi due punti per l'anteprima
                        if (brand.details.length < 2) {
                            const cleanDetail = detailLine.substring(1).trim();
                            if (cleanDetail) {
                                brand.details.push(cleanDetail);
                            }
                        }
                    }
                    
                    j++;
                }
                
                brand.fullText = fullText.join('\n');
                brands.push(brand);
            }
        }
        
        // Ordina per punteggio decrescente
        return brands.sort((a, b) => b.score - a.score);
    }

    function createBrandCard(brand, index) {
        const scoreClass = brand.score >= 7 ? 'score-high' : brand.score >= 5 ? 'score-medium' : 'score-low';
        const barClass = brand.score >= 7 ? 'bar-high' : brand.score >= 5 ? 'bar-medium' : 'bar-low';
        const percentage = (brand.score / 10) * 100;
        
        const cardId = `brand-card-${index}`;
        
        return `
            <div id="${cardId}" class="brand-card" style="animation: fadeInUp 0.5s ease-out ${index * 0.1}s both;" onclick="toggleBrandCard('${cardId}')">
                <div class="brand-card-header">
                    <h3 class="brand-name">${formatText(brand.name)}</h3>
                    <div class="brand-score ${scoreClass}">${brand.score.toFixed(1)}</div>
                </div>
                
                <div class="matching-bar-container">
                    <div class="matching-bar-label">Livello di compatibilità</div>
                    <div class="matching-bar">
                        <div class="matching-bar-fill ${barClass}" style="width: 0%; transition-delay: ${0.5 + index * 0.1}s;" data-width="${percentage}%"></div>
                    </div>
                </div>
                
                ${brand.details.length > 0 ? `
                    <div class="brand-details">
                        ${brand.details.slice(0, 2).map((detail) => {
                            const isStrength = detail.toLowerCase().includes('punti di forza') || detail.toLowerCase().includes('descrizione');
                            const icon = isStrength ? 'check-circle' : 'info';
                            const cleanDetail = detail.replace(/^(Descrizione:|Punti di forza:|Requisiti soddisfatti:|Considerazioni:)\s*/i, '');
                            
                            return `
                                <div class="brand-detail-item">
                                    <i data-lucide="${icon}" class="brand-detail-icon ${isStrength ? 'score-high' : ''}"></i>
                                    <div class="brand-detail-text">${formatText(cleanDetail)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
                
                <!-- Dettagli completi (nascosti inizialmente) -->
                <div class="brand-full-details">
                    <h4 style="font-size: 1.125rem; font-weight: 700; color: #2C3E50; margin-bottom: 20px;">
                        Analisi Dettagliata - ${brand.name}
                    </h4>
                    
                    <div style="white-space: pre-wrap; line-height: 1.8; color: #566573;">
                        ${formatFullText(brand.fullText)}
                    </div>
                </div>
                
                <div class="expand-indicator">
                    <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                </div>
            </div>
        `;
    }

    function formatText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function formatFullText(text) {
        if (!text) return '';
        
        const lines = text.split('\n');
        const formattedLines = lines.map(line => {
            if (line.trim().startsWith('*')) {
                let content = line.trim().substring(1).trim();
                
                // Evidenzia le etichette (es. "Descrizione:", "Punti di forza:", etc.)
                content = content.replace(/^([^:]+:)/, '<strong>$1</strong>');
                
                return `<div style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                    <span style="position: absolute; left: 0;">•</span>
                    ${content}
                </div>`;
            }
            return line;
        });
        
        return formattedLines.join('\n');
    }

    // Funzione globale per toggle delle card
    window.toggleBrandCard = function(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;
        
        card.classList.toggle('expanded');
        
        // Chiudi altre card espanse
        const allCards = document.querySelectorAll('.brand-card');
        allCards.forEach(otherCard => {
            if (otherCard.id !== cardId && otherCard.classList.contains('expanded')) {
                otherCard.classList.remove('expanded');
            }
        });
        
        // Aggiorna le icone
        lucide.createIcons();
        
        // Scrolla la card in vista se è espansa
        if (card.classList.contains('expanded')) {
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    };

    function copyAnalysisText() {
        const textToCopy = lastMatchingMessage;
        if (navigator.clipboard && textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i data-lucide="check" style="width: 18px; height: 18px;"></i> Copiato!';
                    copyBtn.style.backgroundColor = '#27AE60';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.backgroundColor = '';
                        lucide.createIcons();
                    }, 2500);
                })
                .catch(err => StorebotUtils.showTemporaryMessage("Errore copia.", "error"));
        }
    }

    function downloadReport() {
        const timestamp = new Date().toLocaleDateString('it-IT');
        const address = localStorage.getItem('storebot_currentAddress') || 'Indirizzo non specificato';
        
        const report = `STOREBOT BRAND MATCHING REPORT
================================
Data: ${timestamp}
Immobile: ${address}

ANALISI COMPATIBILITÀ BRAND
================================

${lastMatchingMessage}

================================
Report generato da Storebot Pro Suite`;

        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `storebot_brand_matching_${timestamp.replace(/\//g, '-')}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        StorebotUtils.showTemporaryMessage("Report scaricato!", "success");
    }

    initializeMatcher();
});