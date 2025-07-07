// full_report.js - Logica per la pagina del Report Consolidato

document.addEventListener('DOMContentLoaded', () => {
    const reportAddressDisplay = document.getElementById('reportAddressDisplay');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const exportReportBtn = document.getElementById('exportReportTxtBtn');
    const generateAISheetBtn = document.getElementById('generateAISheetBtn');

    const contextContentDiv = document.getElementById('reportContextContent');
    const propertyContentDiv = document.getElementById('reportPropertyContent');
    const formapsContentDiv = document.getElementById('reportFormapsContent');
    const marketingContentDiv = document.getElementById('reportMarketingContent');
    const brandMatchingContentDiv = document.getElementById('reportBrandMatchingContent');

    function initializeReportPage() {
        lucide.createIcons();
        StorebotUtils.checkApiKeysAndNotify();

        const currentAddress = localStorage.getItem('storebot_currentAddress');
        if (currentAddress) {
            reportAddressDisplay.textContent = currentAddress;
        }

        generateReportBtn.addEventListener('click', displayFullReport);
        exportReportBtn.addEventListener('click', exportReportAsTxt);
        generateAISheetBtn.addEventListener('click', generateAIPropertySheet);

        displayFullReport(); // Mostra il report all'avvio della pagina
    }

    function displayFullReport() {
        const contextSummary = localStorage.getItem('storebot_contextAISummary');
        const propertyDetails = localStorage.getItem('storebot_propertyDetails');
        const marketingDesc = localStorage.getItem('storebot_marketingDescription');
        const brandMatchReport = localStorage.getItem('storebot_brandMatchingReport');

        // Analisi Contesto - con formattazione Markdown
        populateSection(contextContentDiv, contextSummary, "Analisi Contesto Quartiere non disponibile.", 'markdown');
        
        // Dati Immobile - JSON formattato
        if (propertyDetails) {
            try {
                const prettyJson = JSON.stringify(JSON.parse(propertyDetails), null, 2);
                populateSection(propertyContentDiv, prettyJson, "Dati Immobile non disponibili.", 'json');
            } catch(e) {
                populateSection(propertyContentDiv, propertyDetails, "Dati Immobile non disponibili (formato non JSON).", 'text');
            }
        } else {
            populateSection(propertyContentDiv, null, "Dati Immobile non disponibili.");
        }

        // Dati Formaps - nuova sezione
        displayFormapsData();

        // Descrizione Marketing - testo semplice ma con paragrafi
        populateSection(marketingContentDiv, marketingDesc, "Descrizione Marketing non disponibile.", 'text');
        
        // Brand Matching - con formattazione Markdown
        populateSection(brandMatchingContentDiv, brandMatchReport, "Analisi Matching Brand non disponibile.", 'markdown');
        
        StorebotUtils.showTemporaryMessage("Report aggiornato.", "info");
    }

    function displayFormapsData() {
        const chapters = JSON.parse(localStorage.getItem('storebot_formapsChapters')) || [];
        const notes = localStorage.getItem('storebot_formapsNotes') || '';
        const maps = JSON.parse(localStorage.getItem('storebot_formapsMaps')) || [];

        if (chapters.length === 0 && !notes && maps.length === 0) {
            populateSection(formapsContentDiv, null, "Analisi Formaps non disponibile.");
            return;
        }

        let formapsHtml = '<div class="formaps-report-section">';

        // Capitoli
        if (chapters.length > 0) {
            formapsHtml += '<h3>Analisi Territoriali</h3>';
            chapters.forEach(chapter => {
                formapsHtml += `
                    <div class="formaps-chapter">
                        <h4>${escapeHtml(chapter.title)}</h4>
                        <div class="chapter-date">${new Date(chapter.timestamp).toLocaleString('it-IT')}</div>
                        <div class="chapter-content">${convertMarkdownToHTML(chapter.content)}</div>
                    </div>
                `;
            });
        }

        // Note manuali
        if (notes) {
            formapsHtml += `
                <div class="formaps-notes">
                    <h3>Note Aggiuntive</h3>
                    <div class="notes-content">${escapeHtml(notes).replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }

        // Mappe
        if (maps.length > 0) {
            formapsHtml += '<div class="formaps-maps"><h3>Mappe Salvate</h3><div class="maps-grid">';
            maps.forEach(map => {
                formapsHtml += `
                    <div class="map-thumbnail-item" onclick="viewMapFullscreen('${map.id}')">
                        <img src="${map.imageUrl}" alt="${escapeHtml(map.title)}" class="map-thumb">
                        <div class="map-title">${escapeHtml(map.title)}</div>
                    </div>
                `;
            });
            formapsHtml += '</div></div>';
        }

        formapsHtml += '</div>';

        formapsContentDiv.classList.remove('placeholder');
        formapsContentDiv.classList.add('report-formatted-content');
        formapsContentDiv.innerHTML = formapsHtml;
        
        lucide.createIcons();
    }

    function populateSection(element, data, placeholderText, format = 'text') {
        element.classList.remove('placeholder');
        element.classList.add('report-formatted-content');
        
        if (data) {
            switch(format) {
                case 'markdown':
                    element.innerHTML = convertMarkdownToHTML(data);
                    break;
                case 'json':
                    element.innerHTML = `<pre class="json-content">${escapeHtml(data)}</pre>`;
                    break;
                case 'text':
                    const paragraphs = data.split(/\n\n+/).filter(p => p.trim());
                    element.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
                    break;
                default:
                    element.textContent = data;
            }
            
            if (format === 'markdown') {
                lucide.createIcons();
            }
        } else {
            element.classList.add('placeholder');
            element.textContent = placeholderText;
        }
    }

    function collectAllDataForAI() {
        const data = {
            address: localStorage.getItem('storebot_currentAddress') || '',
            contextAnalysis: localStorage.getItem('storebot_contextAISummary') || '',
            propertyData: localStorage.getItem('storebot_propertyDetails') || '{}',
            marketingDescription: localStorage.getItem('storebot_marketingDescription') || '',
            brandMatching: localStorage.getItem('storebot_brandMatchingReport') || '',
            formaps: {
                chapters: JSON.parse(localStorage.getItem('storebot_formapsChapters') || '[]'),
                notes: localStorage.getItem('storebot_formapsNotes') || '',
                maps: JSON.parse(localStorage.getItem('storebot_formapsMaps') || '[]')
            },
            propertyImages: []
        };

        // Raccogli immagini immobile se presenti
        const storedImages = localStorage.getItem('storebot_propertyImages');
        if (storedImages) {
            try {
                data.propertyImages = JSON.parse(storedImages);
            } catch (e) {
                console.error('Errore parsing immagini:', e);
            }
        }

        return data;
    }

// Aggiungi DOPO la funzione collectAllDataForAI()
function extractOMIData(formapsChapters) {
    const omiPatterns = {
        vendita: /(?:vendita|compravendita).*?(?:min|minimo).*?(\d+(?:\.\d+)?)\s*€\/mq.*?(?:max|massimo).*?(\d+(?:\.\d+)?)\s*€\/mq/gi,
        locazione: /(?:locazione|affitto).*?(?:min|minimo).*?(\d+(?:\.\d+)?)\s*€\/mq.*?(?:max|massimo).*?(\d+(?:\.\d+)?)\s*€\/mq/gi,
        valoriSingoli: /(\d+(?:\.\d+)?)\s*€\/mq/g
    };
    
    let omiData = {
        vendita: { min: null, max: null },
        locazione: { min: null, max: null },
        raw: ''
    };
    
    formapsChapters.forEach(chapter => {
        const content = chapter.content;
        
        // Cerca pattern vendita
        const venditaMatch = omiPatterns.vendita.exec(content);
        if (venditaMatch) {
            omiData.vendita.min = parseFloat(venditaMatch[1]);
            omiData.vendita.max = parseFloat(venditaMatch[2]);
        }
        
        // Cerca pattern locazione  
        const locazioneMatch = omiPatterns.locazione.exec(content);
        if (locazioneMatch) {
            omiData.locazione.min = parseFloat(locazioneMatch[1]);
            omiData.locazione.max = parseFloat(locazioneMatch[2]);
        }
        
        // Salva anche il testo raw per riferimento
        if (content.toLowerCase().includes('omi') || content.includes('€/mq')) {
            omiData.raw += content + '\n';
        }
    });
    
    return omiData;
}
async function generateAIPropertySheet() {
    const geminiApiKey = StorebotUtils.getApiKey('gemini');
    if (!geminiApiKey) {
        StorebotUtils.showTemporaryMessage("Gemini API Key non configurata.", "error");
        return;
    }

    // Mostra subito il modal vuoto
    const modal = document.getElementById('aiSheetModal');
    const contentDiv = document.getElementById('aiSheetContent');
    
    // Template iniziale
    contentDiv.innerHTML = `
        <div style="padding: 40px; font-family: 'Inter', -apple-system, sans-serif; max-width: 900px; margin: 0 auto; background-color: #ffffff;">
            <h1 style="text-align: center; color: #1a202c; margin-bottom: 20px; font-size: 2.5rem; font-weight: 700;">
                Dossier Immobile Commerciale
            </h1>
            <p style="text-align: center; color: #718096; font-size: 1.25rem; margin-bottom: 40px;">
                ${localStorage.getItem('storebot_currentAddress') || 'Indirizzo non disponibile'}
            </p>
            <div id="aiContentArea" style="line-height: 1.8; color: #2d3748; background-color: #ffffff;">
                <div style="text-align: center; padding: 40px;">
                    <div style="width: 48px; height: 48px; border: 4px solid #E5E7EB; border-top-color: #1ABC9C; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 20px; color: #718096;">Generazione dossier professionale...</p>
                </div>
            </div>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    modal.style.display = 'flex';
    lucide.createIcons();

    try {
        const allData = collectAllDataForAI();
        
        // Parse property data
        let propertyObj = {};
        try {
            propertyObj = JSON.parse(allData.propertyData);
        } catch (e) {
            console.error('Errore parsing property data:', e);
        }

        // Estrai dati OMI per riferimento
        const omiData = extractOMIData(allData.formaps.chapters);
        
        // Calcola costo al mq
        let costoAlMq = null;
        if (propertyObj.superficie_mq && propertyObj.canone_mensile_locazione) {
            costoAlMq = (propertyObj.canone_mensile_locazione / propertyObj.superficie_mq).toFixed(2);
        }

        const contentArea = document.getElementById('aiContentArea');
        contentArea.innerHTML = '';
     // DISCLAIMER INIZIALE
        appendSection(contentArea, `
            <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px 20px; margin-bottom: 2rem; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #075985; font-size: 0.875rem; line-height: 1.5;">
                    <strong>Nota sulla metodologia e trasparenza:</strong> 
Questa analisi è stata elaborata tramite sistemi AI specializzati sulla base dei dati attualmente disponibili. Le informazioni sono state verificate secondo gli standard di settore.
Eventuali dati aggiuntivi necessari per una valutazione più completa potranno essere integrati successivamente da fonti complementari.
Dove presenti lacune informative, queste vengono segnalate esplicitamente per garantire la massima trasparenza dell'analisi.
                </p>
            </div>
        `);

        // SEZIONE 1: Sintesi Esecutiva per l'Operatore
        appendSection(contentArea, '<h2 style="color: #2d3748; margin-top: 2rem; margin-bottom: 1rem; font-size: 1.875rem;">Sintesi Esecutiva</h2><p style="color: #718096;">Preparazione overview...</p>');
        
        const summaryPrompt = `Sei un analista immobiliare. Prepara una sintesi professionale di questo immobile commerciale per un operatore che deve proporlo ai brand retail.

IMMOBILE:
Indirizzo: ${allData.address}
Superficie: ${propertyObj.superficie_mq || 'N/D'} mq
Vetrine: ${propertyObj.numero_vetrine || 'N/D'}
Piano: ${propertyObj.piano_immobile || 'Piano terra'}
Canone richiesto: €${propertyObj.canone_mensile_locazione || 'N/D'}/mese (€${costoAlMq || 'N/D'}/mq)

RIFERIMENTI DI MERCATO (OMI):
Canoni zona: €${omiData.locazione.min || 'N/D'}-${omiData.locazione.max || 'N/D'}/mq
${costoAlMq && omiData.locazione.min ? `Posizionamento: ${((costoAlMq - ((omiData.locazione.min + omiData.locazione.max) / 2)) / ((omiData.locazione.min + omiData.locazione.max) / 2) * 100).toFixed(0)}% vs media OMI` : ''}

METRICHE CHIAVE DEL BACINO:
${allData.formaps.chapters.slice(0, 2).map(ch => {
    const metrics = ch.content.match(/(\d+(?:\.\d+)?%|\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*(?:€|abitanti|mq|km))/g);
    return metrics ? metrics.join(', ') : '';
}).filter(m => m).join('\n')}

Scrivi 2-3 paragrafi professionali che:
- Presentino l'immobile in modo oggettivo e completo
- Evidenzino il posizionamento rispetto ai valori OMI di mercato
- Riassumano i dati salienti del bacino d'utenza
- Indichino le caratteristiche distintive della location

TONO: professionale, fattuale, orientato a fornire all'operatore gli elementi per presentare l'immobile.`;

        const executiveSummary = await StorebotUtils.callGeminiAPI(summaryPrompt);
        updateLastSection(contentArea, formatSection('Sintesi Esecutiva', executiveSummary));

        // SEZIONE 2: Caratteristiche Tecniche dell'Immobile
        appendSection(contentArea, '<h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem;">Caratteristiche Tecniche</h2><p style="color: #718096;">Analisi dettagliata spazi...</p>');
        
        const technicalPrompt = `Descrivi in modo dettagliato e professionale le caratteristiche tecniche di questo immobile commerciale.

DATI TECNICI COMPLETI:
${JSON.stringify(propertyObj, null, 2)}

DESCRIZIONE DISPONIBILE:
${allData.marketingDescription ? allData.marketingDescription.substring(0, 1000) : 'Non disponibile'}

Crea una descrizione tecnica professionale che includa:
- Superfici e loro suddivisione (vendita, deposito, servizi)
- Caratteristiche delle vetrine (numero, dimensioni, esposizione)
- Dotazioni impiantistiche presenti
- Stato manutentivo e finiture
- Conformità normative (se disponibili info)
- Accessibilità e barriere architettoniche
- Possibilità di personalizzazione spazi

IMPORTANTE: Descrivi solo i fatti, senza suggerire utilizzi. I brand valuteranno autonomamente l'idoneità.`;

        const technicalSpecs = await StorebotUtils.callGeminiAPI(technicalPrompt);
        updateLastSection(contentArea, formatSection('Caratteristiche Tecniche', technicalSpecs));

        // SEZIONE 3: Analisi del Contesto Territoriale
        appendSection(contentArea, '<h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem;">Analisi del Contesto Territoriale</h2><p style="color: #718096;">Elaborazione dati di zona...</p>');
        
        const contextPrompt = `Presenta un'analisi oggettiva e dettagliata del contesto territoriale basata su TUTTI i dati disponibili.

ANALISI DEL QUARTIERE:
${allData.contextAnalysis}

DATI TERRITORIALI FORMAPS COMPLETI:
${allData.formaps.chapters.map(ch => `[${ch.title}]\n${ch.content}`).join('\n\n')}

NOTE AGGIUNTIVE:
${allData.formaps.notes || 'Nessuna'}

Organizza i dati in modo professionale includendo:
- Descrizione del contesto urbano e commerciale
- Mix merceologico presente nell'area
- Infrastrutture e collegamenti (dettaglio trasporti)
- Servizi e attrattori principali
- Progetti di sviluppo urbano (se menzionati)
- Flussi di traffico documentati

IMPORTANTE: Riporta TUTTI i dati numerici disponibili (abitanti, redditi, percentuali, distanze). Non fare valutazioni, presenta solo i fatti.`;

        const contextAnalysis = await StorebotUtils.callGeminiAPI(contextPrompt);
        updateLastSection(contentArea, formatSection('Analisi del Contesto Territoriale', contextAnalysis));

        // SEZIONE 4: Dati Demografici e Socioeconomici
        appendSection(contentArea, '<h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem;">Dati Demografici e Socioeconomici</h2><p style="color: #718096;">Profilazione bacino d\'utenza...</p>');
        
        const demographicPrompt = `Presenta in modo strutturato TUTTI i dati demografici e socioeconomici disponibili per quest'area.

DATI DEMOGRAFICI DA FORMAPS:
${allData.formaps.chapters.filter(ch => 
    ch.content.includes('abitanti') || 
    ch.content.includes('popolazione') ||
    ch.content.includes('reddito') || 
    ch.content.includes('età') ||
    ch.content.includes('famiglie') ||
    ch.content.includes('occupazione')
).map(ch => ch.content).join('\n\n')}

Organizza i dati in modo professionale:
- Popolazione residente per fasce di distanza (0-5min, 5-10min, 10-15min)
- Distribuzione per fasce d'età con percentuali
- Composizione nuclei familiari
- Reddito medio e distribuzione
- Tassi di occupazione e tipologie professionali
- Flussi pendolari documentati
- Presenza turistica (se rilevante)

USA TABELLE DOVE POSSIBILE. Riporta TUTTI i numeri esatti disponibili nei dati.`;

        const demographicData = await StorebotUtils.callGeminiAPI(demographicPrompt);
        updateLastSection(contentArea, formatSection('Dati Demografici e Socioeconomici', demographicData));

        // SEZIONE 5: Benchmark di Mercato e Costi
        appendSection(contentArea, '<h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem;">Benchmark di Mercato</h2><p style="color: #718096;">Analisi comparativa costi...</p>');
        
        const benchmarkPrompt = `Presenta un'analisi oggettiva dei costi e dei benchmark di mercato per questo immobile.

COSTI IMMOBILE:
- Canone mensile richiesto: €${propertyObj.canone_mensile_locazione || 'N/D'}
- Costo al mq: €${costoAlMq || 'N/D'}/mq
- Superficie: ${propertyObj.superficie_mq} mq
- Spese condominiali: €${propertyObj.spese_condominiali || 'N/D'}

VALORI OMI DI RIFERIMENTO:
${omiData.raw || 'Non disponibili'}
Locazione: €${omiData.locazione.min}-${omiData.locazione.max}/mq (media: €${omiData.locazione.min && omiData.locazione.max ? ((omiData.locazione.min + omiData.locazione.max) / 2).toFixed(2) : 'N/D'}/mq)

Presenta:
- Confronto dettagliato con i valori OMI della zona
- Posizionamento percentuale rispetto a min/medio/max
- Costo totale annuo occupazione (canone + spese)
- Confronto con immobili simili nella zona (se disponibili dati)
- Trend storici dei canoni nell'area (se menzionati)

SOLO DATI OGGETTIVI, nessuna valutazione di convenienza.`;

        const benchmarkAnalysis = await StorebotUtils.callGeminiAPI(benchmarkPrompt);
        updateLastSection(contentArea, formatSection('Benchmark di Mercato', benchmarkAnalysis));

        // SEZIONE 6: Format Commerciali nell'Area
        appendSection(contentArea, '<h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem;">Format Commerciali nell\'Area</h2><p style="color: #718096;">Mappatura attività esistenti...</p>');
        
        const formatsPrompt = `Mappa in modo dettagliato i format commerciali presenti nell'area basandoti sui dati disponibili.

ANALISI BRAND MATCHING E CONTESTO:
${allData.brandMatching || 'Non disponibile'}

DATI POI E ATTRATTORI:
${allData.contextAnalysis}

Presenta:
- Elenco dettagliato delle attività commerciali presenti per categoria
- Brand e insegne principali nell'area
- Format emergenti o in espansione nella zona
- Spazi commerciali disponibili o in sviluppo
- Orari di apertura prevalenti nell'area
- Eventi e manifestazioni ricorrenti

FORMATO: usa elenchi strutturati e tabelle. Non suggerire quali format sarebbero adatti, solo documenta cosa c'è.`;

        const formatsAnalysis = await StorebotUtils.callGeminiAPI(formatsPrompt);
        updateLastSection(contentArea, formatSection('Format Commerciali nell\'Area', formatsAnalysis));

        // SEZIONE 7: Documentazione Disponibile
        appendSection(contentArea, '<h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem;">Documentazione e Prossimi Passi</h2><p style="color: #718096;">Riepilogo informazioni...</p>');
        
        const documentationPrompt = `Prepara una sezione finale professionale per l'operatore.

RIEPILOGO IMMOBILE:
${allData.address}
${propertyObj.superficie_mq} mq - €${propertyObj.canone_mensile_locazione}/mese

Includi:
- Documentazione tecnica disponibile/da richiedere
- Tempistiche di disponibilità
- Modalità di visita e contatti
- Condizioni contrattuali note
- Informazioni per approfondimenti

TONO: professionale, orientato all'azione per l'operatore che deve contattare i brand.`;

        const documentation = await StorebotUtils.callGeminiAPI(documentationPrompt);
        updateLastSection(contentArea, formatSection('Documentazione e Prossimi Passi', documentation));

        // Aggiungi galleria immagini se disponibili
        const imageDataUrls = [];
        if (allData.formaps.maps.length > 0) {
            allData.formaps.maps.forEach(map => imageDataUrls.push(map.imageUrl));
        }

        if (imageDataUrls.length > 0) {
            appendSection(contentArea, `
                <h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem;">Documentazione Visiva</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                    ${imageDataUrls.slice(0, 8).map((url, idx) => `
                        <div>
                            <img src="${url}" alt="Mappa ${idx + 1}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <p style="text-align: center; margin-top: 8px; color: #6B7280; font-size: 0.875rem;">Analisi territoriale ${idx + 1}</p>
                        </div>
                    `).join('')}
                </div>
            `);
        }

        // Aggiungi footer
        appendSection(contentArea, `
            <div style="text-align: center; margin-top: 60px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                <p style="color: #a0aec0; font-size: 0.875rem;">
                    Dossier generato il ${new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}
                    <br>Storebot Pro Suite - Storebook AI Real Estate Intelligence - ©2025 Masema Srl
                </p>
            </div>
        `);

        // Salva HTML completo per export
        window.currentAISheetHTML = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${allData.address} - Dossier Commerciale</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            line-height: 1.8; 
            color: #2d3748; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 40px 20px;
            background: #ffffff;
        }
        h1 { color: #1a202c; font-size: 2.5rem; font-weight: 700; }
        h2 { color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem; }
        p { margin-bottom: 1rem; text-align: justify; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        @media print {
            body { background: white; }
        }
    </style>
</head>
<body>
    ${contentDiv.innerHTML}
</body>
</html>`;
        
        StorebotUtils.showTemporaryMessage("Dossier immobile completato!", "success");
        
    } catch (error) {
        console.error('Errore:', error);
        const contentArea = document.getElementById('aiContentArea');
        if (contentArea) {
            contentArea.innerHTML = `<div style="padding: 20px; background: #fee; border-radius: 8px; margin: 20px 0;">
                <p style="color: #e53e3e; margin: 0;">Errore durante la generazione: ${error.message}</p>
            </div>`;
        }
        StorebotUtils.showTemporaryMessage(`Errore: ${error.message}`, "error");
    }
}

// Funzione helper per estrarre dati OMI (aggiungi dopo collectAllDataForAI)
function extractOMIData(formapsChapters) {
    const omiPatterns = {
        vendita: /(?:vendita|compravendita).*?(?:min|minimo).*?(\d+(?:\.\d+)?)\s*€\/mq.*?(?:max|massimo).*?(\d+(?:\.\d+)?)\s*€\/mq/gi,
        locazione: /(?:locazione|affitto).*?(?:min|minimo).*?(\d+(?:\.\d+)?)\s*€\/mq.*?(?:max|massimo).*?(\d+(?:\.\d+)?)\s*€\/mq/gi,
        valoriSingoli: /(\d+(?:\.\d+)?)\s*€\/mq/g
    };
    
    let omiData = {
        vendita: { min: null, max: null },
        locazione: { min: null, max: null },
        raw: ''
    };
    
    formapsChapters.forEach(chapter => {
        const content = chapter.content;
        
        // Cerca pattern vendita
        const venditaMatch = omiPatterns.vendita.exec(content);
        if (venditaMatch) {
            omiData.vendita.min = parseFloat(venditaMatch[1]);
            omiData.vendita.max = parseFloat(venditaMatch[2]);
        }
        
        // Cerca pattern locazione
        const locazioneMatch = omiPatterns.locazione.exec(content);
        if (locazioneMatch) {
            omiData.locazione.min = parseFloat(locazioneMatch[1]);
            omiData.locazione.max = parseFloat(locazioneMatch[2]);
        }
        
        // Salva anche il testo raw per riferimento
        if (content.toLowerCase().includes('omi') || content.includes('€/mq')) {
            omiData.raw += content + '\n';
        }
    });
    
    return omiData;
}
    // Funzioni helper per aggiornare il contenuto progressivamente
    function appendSection(container, html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        container.appendChild(div);
        // Scroll al nuovo contenuto
        container.scrollTop = container.scrollHeight;
    }

    function updateLastSection(container, html) {
        const lastDiv = container.lastElementChild;
        if (lastDiv) {
            lastDiv.innerHTML = html;
        }
    }

// VERSIONE CORRETTA che converte il Markdown in HTML
function formatSection(title, content) {
    // Converti il markdown nel contenuto
    let htmlContent = content;
    
    // Conversioni Markdown base
    // Headers (se presenti nel contenuto)
    htmlContent = htmlContent.replace(/^### (.*?)$/gm, '<h4 style="color: #374151; margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h4>');
    htmlContent = htmlContent.replace(/^## (.*?)$/gm, '<h3 style="color: #2d3748; margin-top: 1.75rem; margin-bottom: 1rem;">$1</h3>');
    
    // Bold - IMPORTANTE: fare prima il triplo asterisco
    htmlContent = htmlContent.replace(/\*\*\*(.*?)\*\*\*/g, '<strong style="font-weight: 700; color: #1f2937;"><em>$1</em></strong>');
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #1f2937;">$1</strong>');
    
    // Italic
    htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
    
    // Liste puntate
    htmlContent = htmlContent.replace(/^[\*\-\+] (.+)$/gm, '<li style="margin-bottom: 0.5rem;">$1</li>');
    htmlContent = htmlContent.replace(/^(\d+)\. (.+)$/gm, '<li style="margin-bottom: 0.5rem;">$2</li>');
    
    // Raggruppa li consecutivi in ul
    htmlContent = htmlContent.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, function(match) {
        return '<ul style="margin: 1rem 0; padding-left: 2rem; list-style-type: disc;">' + match + '</ul>';
    });
    
    // Code inline
    htmlContent = htmlContent.replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.875em; color: #1f2937;">$1</code>');
    
    // Tabelle semplici (se presenti)
    htmlContent = htmlContent.replace(/\|(.+)\|/g, function(match, content) {
        const cells = content.split('|').map(cell => cell.trim());
        return '<tr>' + cells.map(cell => `<td style="padding: 8px; border: 1px solid #e5e7eb;">${cell}</td>`).join('') + '</tr>';
    });
    
    // Se ci sono tr, wrappale in table
    if (htmlContent.includes('<tr>')) {
        htmlContent = htmlContent.replace(/(<tr>.*?<\/tr>\s*)+/g, function(match) {
            return '<table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">' + match + '</table>';
        });
    }
    
    // Dividi in paragrafi e gestisci i line break
    const paragraphs = htmlContent.split(/\n\n+/).filter(p => p.trim());
    const formattedParagraphs = paragraphs.map(p => {
        // Non wrappare in <p> se è già un elemento HTML
        if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<ol') || p.trim().startsWith('<table')) {
            return p;
        }
        // Sostituisci singoli \n con <br> all'interno dei paragrafi
        p = p.replace(/\n/g, '<br>');
        return `<p style="margin-bottom: 1rem; text-align: justify; line-height: 1.8; color: #374151;">${p.trim()}</p>`;
    });
    
    htmlContent = formattedParagraphs.join('\n');
    
    // Evidenzia numeri importanti (dopo tutto il resto per non interferire)
    htmlContent = htmlContent.replace(/\b(\d+(?:\.\d+)?%)\b/g, '<span style="color: #16a085; font-weight: 600;">$1</span>');
    htmlContent = htmlContent.replace(/€(\d+(?:\.\d+)?(?:,\d+)?)/g, '<span style="color: #16a085; font-weight: 600;">€$1</span>');
    htmlContent = htmlContent.replace(/\b(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*(abitanti|mq|km²?)/g, '<span style="color: #16a085; font-weight: 600;">$1 $2</span>');
    
    return `
        <h2 style="color: #2d3748; margin-top: 3rem; margin-bottom: 1rem; font-size: 1.875rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
            ${title}
        </h2>
        <div style="color: #374151;">
            ${htmlContent}
        </div>
    `;
}

    // Funzioni globali per il modal
    window.closeAISheetModal = function() {
        document.getElementById('aiSheetModal').style.display = 'none';
    };

    window.saveAISheetAsHTML = function() {
        if (!window.currentAISheetHTML) return;
        
        const blob = new Blob([window.currentAISheetHTML], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        const address = localStorage.getItem('storebot_currentAddress') || 'immobile';
        const filename = `scheda_immobile_${address.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
        
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        StorebotUtils.showTemporaryMessage("Scheda salvata come HTML", "success");
    };

    window.printAISheet = function() {
        const iframe = document.querySelector('#aiSheetContent iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.print();
        } else {
            // Se non c'è iframe, stampa il contenuto direttamente
            const printWindow = window.open('', '_blank');
            printWindow.document.write(window.currentAISheetHTML || document.getElementById('aiSheetContent').innerHTML);
            printWindow.document.close();
            printWindow.print();
        }
    };

    window.copyAISheetHTML = function() {
        if (!window.currentAISheetHTML) return;
        
        navigator.clipboard.writeText(window.currentAISheetHTML)
            .then(() => StorebotUtils.showTemporaryMessage("Codice HTML copiato!", "success"))
            .catch(err => StorebotUtils.showTemporaryMessage("Errore nella copia", "error"));
    };

    window.viewMapFullscreen = function(id) {
        const maps = JSON.parse(localStorage.getItem('storebot_formapsMaps') || '[]');
        const map = maps.find(m => m.id == id);
        if (!map) return;
        
        const img = new Image();
        img.src = map.imageUrl;
        img.style.maxWidth = '90vw';
        img.style.maxHeight = '90vh';
        
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;';
        overlay.appendChild(img);
        overlay.onclick = () => overlay.remove();
        
        document.body.appendChild(overlay);
    };

    function convertMarkdownToHTML(markdown) {
        let html = escapeHtml(markdown);
        
        html = html.replace(/^#### (.*?)$/gm, '<h6>$1</h6>');
        html = html.replace(/^### (.*?)$/gm, '<h5>$1</h5>');
        html = html.replace(/^## (.*?)$/gm, '<h4>$1</h4>');
        html = html.replace(/^# (.*?)$/gm, '<h3>$1</h3>');
        
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        
        html = html.replace(/^[\*\-\+] (.+)$/gm, '<li>$1</li>');
        html = html.replace(/^\d+\. (.+)$/gm, '<li class="ordered">$1</li>');
        
        html = wrapListItems(html);
        
        html = html.replace(/^---+$/gm, '<hr>');
        html = html.replace(/^\*\*\*+$/gm, '<hr>');
        
        html = html.split(/\n\n+/).map(block => {
            block = block.trim();
            if (!block) return '';
            
            if (block.match(/^<(h[1-6]|ul|ol|hr|pre|blockquote)/)) {
                return block;
            }
            
            block = block.replace(/\n/g, '<br>');
            
            return `<p>${block}</p>`;
        }).join('\n');
        
        html = html.replace(/<br>\s*<br>/g, '</p><p>');
        html = html.replace(/<p>\s*<\/p>/g, '');
        
        return html;
    }

    function wrapListItems(html) {
        const lines = html.split('\n');
        const result = [];
        let inList = false;
        let isOrdered = false;
        let currentList = [];
        
        for (let line of lines) {
            if (line.includes('<li>') || line.includes('<li class="ordered">')) {
                if (!inList) {
                    inList = true;
                    isOrdered = line.includes('class="ordered"');
                }
                currentList.push(line.replace(' class="ordered"', ''));
            } else {
                if (inList) {
                    const listTag = isOrdered ? 'ol' : 'ul';
                    result.push(`<${listTag}>${currentList.join('')}</${listTag}>`);
                    currentList = [];
                    inList = false;
                }
                result.push(line);
            }
        }
        
        if (inList && currentList.length > 0) {
            const listTag = isOrdered ? 'ol' : 'ul';
            result.push(`<${listTag}>${currentList.join('')}</${listTag}>`);
        }
        
        return result.join('\n');
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function exportReportAsTxt() {
        const currentAddress = localStorage.getItem('storebot_currentAddress') || "N/D";
        const contextSummary = localStorage.getItem('storebot_contextAISummary') || "N/D";
        const propertyDetails = localStorage.getItem('storebot_propertyDetails') ? 
            JSON.stringify(JSON.parse(localStorage.getItem('storebot_propertyDetails')), null, 2) : "N/D";
        const marketingDesc = localStorage.getItem('storebot_marketingDescription') || "N/D";
        const brandMatchReport = localStorage.getItem('storebot_brandMatchingReport') || "N/D";
        
        // Dati Formaps
        const formapsChapters = JSON.parse(localStorage.getItem('storebot_formapsChapters') || '[]');
        const formapsNotes = localStorage.getItem('storebot_formapsNotes') || '';
        const formapsMaps = JSON.parse(localStorage.getItem('storebot_formapsMaps') || '[]');

        let reportContent = `STOREBOT PRO SUITE - REPORT COMPLETO\n`;
        reportContent += `=========================================\n`;
        reportContent += `Data Generazione: ${new Date().toLocaleString('it-IT')}\n`;
        reportContent += `Indirizzo Analizzato: ${currentAddress}\n\n`;
        
        reportContent += `--- ANALISI CONTESTO QUARTIERE ---\n${contextSummary}\n\n`;
        reportContent += `--- DATI IMMOBILE ---\n${propertyDetails}\n\n`;
        
        // Sezione Formaps
        reportContent += `--- ANALISI TERRITORIALE FORMAPS ---\n`;
        if (formapsChapters.length > 0) {
            formapsChapters.forEach(chapter => {
                reportContent += `\n[${chapter.title}]\n`;
                reportContent += `Data: ${new Date(chapter.timestamp).toLocaleString('it-IT')}\n`;
                reportContent += `${chapter.content}\n`;
            });
        }
        if (formapsNotes) {
            reportContent += `\nNote aggiuntive:\n${formapsNotes}\n`;
        }
        if (formapsMaps.length > 0) {
            reportContent += `\nMappe salvate: ${formapsMaps.length}\n`;
        }
        reportContent += '\n';
        
        reportContent += `--- DESCRIZIONE MARKETING ---\n${marketingDesc}\n\n`;
        reportContent += `--- ANALISI MATCHING BRAND ---\n${brandMatchReport}\n\n`;
        reportContent += `=========================================\nReport generato da Storebot Pro Suite`;

        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement("a");
        const filenameSafeAddress = StorebotUtils.normalizeString(currentAddress).replace(/\s/g,'_') || 'report';
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `Storebot_Report_${filenameSafeAddress}.txt`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        StorebotUtils.showTemporaryMessage("Report TXT esportato!", "success");
    }

    // Inizializza la pagina
    initializeReportPage();
});