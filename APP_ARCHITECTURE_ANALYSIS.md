# 🔍 ANALISI COMPLETA STOREBOT PRO SUITE

## 📋 SCOPO DELL'APPLICATIVO

**STOREBOT PRO SUITE** è una piattaforma per l'analisi immobiliare commerciale che permette di:

1. **Qualificare il QUARTIERE** → Analisi contesto, POI, brand presenti
2. **Qualificare l'IMMOBILE** → Estrazione dati tecnici, caratteristiche
3. **Generare MATCHING BRAND** → Suggerire brand compatibili basandosi su quartiere + immobile
4. **Creare SCHEDA COMPLETA** → Report consolidato con tutte le informazioni

---

## 🏗️ ARCHITETTURA DELL'APPLICAZIONE

### Moduli (8 pagine HTML):

```
┌─────────────────────────────────────────────────────────────┐
│                        INDEX.HTML                            │
│              (Home - Punto di ingresso)                      │
│         Inserisci indirizzo → Salva in localStorage          │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
        ┌────────────────────┴────────────────────┐
        │                                         │
        ↓                                         ↓
┌───────────────────┐                  ┌──────────────────────┐
│  SETTINGS.HTML    │                  │ CONTEXT_ANALYZER     │
│  Configurazione   │                  │ Analisi Quartiere    │
│  API Keys         │                  │ → POI, Brand         │
└───────────────────┘                  └──────────────────────┘
                                                 │
                                                 ↓
                                       ┌──────────────────────┐
                                       │ PROPERTY_EXTRACTOR   │
                                       │ Dati Immobile        │
                                       │ → PDF, JSON, API     │
                                       └──────────────────────┘
                                                 │
                ┌────────────────────────────────┼────────────────────┐
                │                                │                    │
                ↓                                ↓                    ↓
    ┌──────────────────────┐      ┌────────────────────┐  ┌──────────────────┐
    │ MARKETING_GENERATOR  │      │  BRAND_MATCHER     │  │  FORMAPS         │
    │ Descrizione AI       │      │  Matching Brand    │  │  Analisi Mappe   │
    │ → Testo promo        │      │  → Suggerimenti    │  │  → Screenshot    │
    └──────────────────────┘      └────────────────────┘  └──────────────────┘
                │                                │                    │
                └────────────────────────────────┼────────────────────┘
                                                 ↓
                                       ┌──────────────────────┐
                                       │   FULL_REPORT        │
                                       │   Report Completo    │
                                       │   → Scheda AI        │
                                       └──────────────────────┘
```

---

## 💾 STORAGE - localStorage Keys

### Chiavi Principali (usate per il flusso):

| Key | Prodotto da | Consumato da | Contenuto |
|-----|-------------|--------------|-----------|
| `storebot_currentAddress` | INDEX | Tutti i moduli | Indirizzo immobile |
| `storebot_contextAISummary` | Context Analyzer | Brand Matcher, Full Report | Summary testuale quartiere |
| `storebot_contextPois` | Context Analyzer | Brand Matcher | Array POI con classificazione brand |
| `storebot_propertyDetails` | Property Extractor | Brand Matcher, Marketing Gen, Full Report | JSON dettagli immobile |
| `storebot_marketingDescription` | Marketing Generator | Full Report | Testo descrizione marketing |
| `storebot_brandMatchingReport` | Brand Matcher | Full Report | Report matching brand |
| `storebot_formapsChapters` | Formaps | Full Report | Capitoli analisi territoriale |
| `storebot_formapsMaps` | Formaps | Full Report | Screenshot mappe |
| `storebot_propertyImages` | Property Extractor | Marketing Gen, Full Report | Immagini immobile |

### Chiavi API (settings):

| Key | Contenuto |
|-----|-----------|
| `storebot_suite_gmaps` | Google Maps API Key |
| `storebot_suite_gemini` | Gemini API Key |
| `storebot_suite_geminiModel` | Modello Gemini selezionato (flash/flash-lite/pro) |
| `storebot_suite_botId` | Storebot Bot ID |
| `storebot_suite_openrouter` | OpenRouter API Key (opzionale) |
| `storebot_suite_openrouterModel` | Modello OpenRouter selezionato |

### Chiavi Brand Matching (whitelist/blacklist):

| Key | Contenuto |
|-----|-----------|
| `storebot_brand_whitelist` | Brand confermati dall'utente |
| `storebot_brand_blacklist` | Brand esclusi dall'utente |

---

## 📊 WORKFLOW END-TO-END

### ✅ FLUSSO IDEALE (Ordine consigliato):

```
1. SETTINGS (Configurazione API)
   ↓ Salva API keys
   ↓
2. INDEX (Home)
   ↓ Inserisci indirizzo → localStorage.storebot_currentAddress
   ↓
3. CONTEXT ANALYZER (Analisi Quartiere)
   ↓ Cerca POI con Google Maps
   ↓ Classifica brand presenti
   ↓ Salva: storebot_contextAISummary, storebot_contextPois
   ↓
4. PROPERTY DATA EXTRACTOR (Dati Immobile)
   ↓ Estrai da PDF / JSON / API / Manuale
   ↓ Salva: storebot_propertyDetails, storebot_propertyImages
   ↓
5. MARKETING DESCRIPTION GENERATOR (Opzionale)
   ↓ Legge: propertyDetails, propertyImages
   ↓ Genera descrizione AI
   ↓ Salva: storebot_marketingDescription
   ↓
6. FORMAPS INTEGRATION (Opzionale)
   ↓ Analizza screenshot mappe
   ↓ Salva: storebot_formapsChapters, storebot_formapsMaps
   ↓
7. BRAND MATCHER (Matching Brand)
   ↓ Legge: contextAISummary, contextPois, propertyDetails
   ↓ Esclude brand già presenti (contextPois)
   ↓ Genera suggerimenti precisi
   ↓ Salva: storebot_brandMatchingReport
   ↓
8. FULL REPORT (Report Finale)
   ↓ Legge TUTTI i dati da localStorage
   ↓ Genera scheda AI consolidata
   ↓ Esporta HTML/TXT
   ↓ Salva su Supabase (opzionale)
```

---

## 🔧 FILE JAVASCRIPT PRINCIPALI

### common_utils.js (Core Utilities)

**Funzioni chiave:**
- `saveApiKey()` / `getApiKey()` - Gestione API keys
- `callGeminiAPI()` - Chiamata Gemini con fallback multi-model
- `callOpenRouterAPI()` - Chiamata OpenRouter (opzionale)
- `callStorebotChatAPI()` - Chiamata Storebot Bot
- `testGeminiApiKey()` / `testGmapsApiKey()` - Test validità API keys
- `showTemporaryMessage()` - Notifiche utente

**Modelli AI supportati:**
- Gemini 2.5 Flash (default, FREE 250 req/day)
- Gemini 2.5 Flash Lite (fallback, FREE 1000 req/day)
- Gemini 2.5 Pro (premium, FREE 100 req/day)
- OpenRouter: Claude 3.5, GPT-4o, Llama, ecc.

---

### context_analyzer.js (Classe EnhancedRealEstatePOIFinder)

**Cosa fa:**
1. Geocodifica indirizzo con Google Maps
2. Cerca POI nel raggio di 1-2km
3. Classifica POI in 10 categorie (Shopping, F&B, Services, ecc.)
4. **MATCHING BRAND:** Confronta nome POI con database 70+ brand (brands-config.js)
5. Gestisce whitelist/blacklist per conferma/esclusione brand
6. Genera summary AI del quartiere
7. Salva tutto in localStorage

**Output:**
- `storebot_currentAddress` - Indirizzo
- `storebot_contextAISummary` - "Il quartiere è caratterizzato da..."
- `storebot_contextPois` - Array di POI con classificazione:
  ```javascript
  {
    originalName: "McDonald's",
    googlePlaceId: "ChIJ...",
    vicinity: "Via Roma 123",
    distance: 250,
    classification: {
      type: "brand",  // o "local"
      brandDisplayName: "McDonald's",
      brandKeyFromConfig: "mcdonalds",
      assignedMacroCategoryKey: "food_beverage"
    }
  }
  ```

**Brands riconosciuti:**
- Shopping: Zara, H&M, Mango, Bershka, Stradivarius, ecc.
- Supermercati: Carrefour, Esselunga, Conad, Lidl, ecc.
- Food & Beverage: McDonald's, KFC, Starbucks, Burger King, ecc.
- Elettronica: MediaWorld, Unieuro, Euronics, ecc.
- Totale: 70+ brand configurati

---

### property_data_extractor.js

**Metodi di input:**
1. **PDF Upload** → Estrazione AI con Gemini Vision
2. **JSON Paste** → Incolla dati strutturati
3. **Manual Input** → Form campi manuali
4. **Storebot API** → Carica da API `/api/ai/asset/{id}`

**Output:**
- `storebot_propertyDetails` - JSON:
  ```javascript
  {
    "indirizzo": "Via Roma 123, Milano",
    "superficie_mq": 250,
    "prezzo": "€500,000",
    "vetrine": 2,
    "altezza_soffitti": "3.5m",
    "parcheggio": "50 posti",
    // ... altri campi
  }
  ```

---

### brand_matcher.js (NUOVO - AGGIORNATO)

**Cosa fa:**
1. **Legge dati:**
   - `storebot_contextAISummary` - Descrizione quartiere
   - `storebot_contextPois` - POI e brand presenti
   - `storebot_propertyDetails` - Caratteristiche immobile

2. **Estrae brand esistenti** (NOVITÀ):
   - Filtra `contextPois` per `classification.type === "brand"`
   - Crea lista brand da ESCLUDERE

3. **Genera prompt AI:**
   ```
   ISTRUZIONI CRITICHE:
   1. SOLO brand SPECIFICI (es: Zara, Esselunga)
   2. NO categorie generiche (es: "Supermercato")
   3. NON suggerire: McDonald's, Carrefour, Zara (già presenti)
   4. Formato: 5 sezioni per brand (Descrizione, Ragioni matching, ecc.)
   ```

4. **Chiama Gemini API** con prompt completo

5. **Output:**
   - `storebot_brandMatchingReport` - Report testuale con:
     - **Brand 1** - Compatibilità: 8.5/10
       - Descrizione: ...
       - 🎯 Ragioni del matching: DETTAGLIATE
       - Punti di forza location: ...
       - Target e traffico: ...
       - Considerazioni operative: ...
     - **Brand 2** - ...

**UI Features:**
- Badge giallo mostra brand ESCLUSI
- Card espandibili per ogni brand
- Evidenziazione verde per "Ragioni del matching"
- Icone smart: 🎯 ✓ 👥 ⚙️

---

### full_report.js

**Cosa fa:**
1. **Legge TUTTI i dati** da localStorage
2. **Mostra report consolidato** in sezioni:
   - Analisi Contesto Quartiere
   - Dati Immobile
   - Analisi Territoriale Formaps
   - Descrizione Marketing
   - Analisi Compatibilità Brand

3. **Genera Scheda AI** (funzione `generateAISheetBtn`):
   - Chiama AI con TUTTI i dati
   - Genera scheda consolidata professionale
   - Include screenshot Formaps (se presenti)

4. **Esportazione:**
   - Export TXT → File di testo
   - Export HTML → Scheda stampabile
   - Salva su Supabase → Database cloud

---

## 🐛 POSSIBILI PROBLEMI E DEBUG

### ❌ PROBLEMA 1: "Non funziona niente"

**Cause possibili:**

1. **API Keys non configurate**
   ```
   Soluzione:
   - Vai su Settings → Inserisci Gemini API Key
   - Clicca "Test Tutte le API"
   - Verifica che Gemini = Valida
   ```

2. **Errori JavaScript in console**
   ```
   Debug:
   - Apri DevTools (F12)
   - Tab Console
   - Cerca errori rossi
   - Controlla che tutti i .js si carichino
   ```

3. **LocalStorage vuoto**
   ```
   Debug:
   - F12 → Application → Local Storage
   - Verifica presenza chiavi "storebot_*"
   - Se mancano, i moduli precedenti non sono stati eseguiti
   ```

4. **Chiamate API falliscono**
   ```
   Debug:
   - F12 → Network
   - Cerca chiamate a generativelanguage.googleapis.com
   - Verifica status code (403 = API key invalida, 429 = rate limit)
   ```

---

### ❌ PROBLEMA 2: "Brand Matcher suggerisce brand generici"

**Causa:** Gemini API ignora le istruzioni

**Soluzioni:**
1. Riprova la generazione (a volte l'AI migliora al 2° tentativo)
2. Verifica modello Gemini in Settings (usa "flash" o "pro", non "flash-lite")
3. Se persiste, il prompt potrebbe essere troppo lungo (>50 brand esclusi)

---

### ❌ PROBLEMA 3: "Brand Matcher suggerisce brand già nel quartiere"

**Causa:** Context Analyzer non eseguito PRIMA di Brand Matcher

**Soluzione:**
```
WORKFLOW CORRETTO:
1. Context Analyzer → Analizza quartiere (salva brand presenti)
2. Brand Matcher → Legge brand presenti → Esclude automaticamente
```

**Verifica:**
```
F12 → Application → localStorage → Cerca "storebot_contextPois"
Se mancante → Esegui Context Analyzer prima!
```

---

### ❌ PROBLEMA 4: "Full Report è vuoto"

**Causa:** Moduli precedenti non eseguiti

**Soluzione:**
Esegui workflow completo:
```
1. Settings → Configura API
2. Index → Inserisci indirizzo
3. Context Analyzer → Analizza quartiere
4. Property Extractor → Estrai dati immobile
5. Brand Matcher → Genera matching
6. Full Report → Clicca "Aggiorna Report"
```

**Verifica localStorage:**
```javascript
// F12 Console:
console.log({
  address: localStorage.getItem('storebot_currentAddress'),
  context: localStorage.getItem('storebot_contextAISummary'),
  property: localStorage.getItem('storebot_propertyDetails'),
  brands: localStorage.getItem('storebot_brandMatchingReport')
});
// Se qualcuno è null → quel modulo non è stato completato
```

---

### ❌ PROBLEMA 5: "ERR_FILE_NOT_FOUND settings.js"

**Causa:** File rinominato in commit precedente

**Stato:** ✅ RISOLTO (commit 2ecaae9 - file rinominato da setting.js → settings.js)

**Se persiste:**
```bash
# Verifica file esistente:
ls -la *.js | grep settings
# Deve mostrare: settings.js (non setting.js)
```

---

## 🧪 CHECKLIST DI TEST COMPLETA

### Test 1: Configurazione Base
```
☐ Apri settings.html
☐ Console (F12) senza errori
☐ Inserisci Gemini API Key
☐ Seleziona modello "flash"
☐ Clicca "Salva"
☐ Clicca "Test Tutte le API"
☐ Verifica: Gemini = Valida ✓
```

### Test 2: Context Analyzer
```
☐ Apri context_analyzer.html
☐ Inserisci indirizzo: "Corso Buenos Aires 23, Milano"
☐ Clicca "Cerca POI"
☐ Aspetta caricamento (10-30 secondi)
☐ Verifica: Mappa con marker
☐ Verifica: Lista POI con categorie
☐ Verifica: Almeno 1-2 brand riconosciuti (es: Zara, H&M)
☐ Clicca "Genera Summary AI"
☐ Verifica: Testo descrizione quartiere
```

### Test 3: Property Data Extractor
```
☐ Apri property_data_extractor.html
☐ Tab "Incolla JSON"
☐ Incolla JSON di test:
   {
     "indirizzo": "Corso Buenos Aires 23, Milano",
     "superficie_mq": 250,
     "prezzo": "500000",
     "vetrine": 2
   }
☐ Clicca "Carica Dati JSON"
☐ Verifica: "Dati salvati" ✓
```

### Test 4: Brand Matcher
```
☐ Apri brand_matcher.html
☐ Verifica: Textarea "Contesto Quartiere" popolata
☐ Verifica: Textarea "Dati Immobile" popolata
☐ Clicca "Esegui Matching"
☐ Aspetta generazione (30-60 secondi)
☐ Verifica: Badge giallo "Brand già presenti" (se Context Analyzer eseguito)
☐ Verifica: Card brand con nomi PRECISI (Esselunga, Leroy Merlin, ecc.)
☐ Clicca su una card
☐ Verifica: Card si espande
☐ Verifica: Sezione "🎯 Ragioni del matching" con background verde
```

### Test 5: Full Report
```
☐ Apri full_report.html
☐ Clicca "Aggiorna Report"
☐ Verifica: 5 sezioni popolate:
   - Analisi Contesto Quartiere ✓
   - Dati Immobile ✓
   - Formaps (può essere vuoto se non eseguito)
   - Descrizione Marketing (può essere vuoto)
   - Analisi Compatibilità Brand ✓
☐ Clicca "Genera Scheda AI"
☐ Aspetta generazione (30-60 secondi)
☐ Verifica: Scheda completa con tutte le sezioni
☐ Clicca "Esporta Report TXT"
☐ Verifica: Download file .txt
```

---

## 📝 COMANDI DEBUG CONSOLE

### Verifica dati salvati:
```javascript
// F12 Console - Copia e incolla:

// 1. Elenco tutte le chiavi storebot
Object.keys(localStorage).filter(k => k.startsWith('storebot')).forEach(k => {
  console.log(`${k}: ${localStorage.getItem(k).substring(0, 100)}...`);
});

// 2. Verifica API keys
console.log({
  gmaps: localStorage.getItem('storebot_suite_gmaps') ? '✓ Configurata' : '✗ Mancante',
  gemini: localStorage.getItem('storebot_suite_gemini') ? '✓ Configurata' : '✗ Mancante',
  geminiModel: localStorage.getItem('storebot_suite_geminiModel') || 'default (flash)',
  botId: localStorage.getItem('storebot_suite_botId') ? '✓ Configurato' : '✗ Mancante'
});

// 3. Verifica dati principali
console.log({
  address: localStorage.getItem('storebot_currentAddress') || '✗ Mancante',
  contextReady: !!localStorage.getItem('storebot_contextAISummary'),
  propertyReady: !!localStorage.getItem('storebot_propertyDetails'),
  brandMatchReady: !!localStorage.getItem('storebot_brandMatchingReport')
});

// 4. Conta POI trovati
try {
  const pois = JSON.parse(localStorage.getItem('storebot_contextPois') || '[]');
  const brands = pois.filter(p => p.classification?.type === 'brand');
  console.log(`POI totali: ${pois.length}, Brand riconosciuti: ${brands.length}`);
  console.log('Brand:', brands.map(b => b.classification.brandDisplayName));
} catch(e) {
  console.log('Nessun POI trovato');
}
```

### Reset completo (se necessario):
```javascript
// ATTENZIONE: Cancella TUTTI i dati!
Object.keys(localStorage).filter(k => k.startsWith('storebot')).forEach(k => {
  localStorage.removeItem(k);
});
console.log('✓ Tutti i dati Storebot cancellati. Ricarica la pagina.');
```

---

## 🚀 WORKFLOW CONSIGLIATO PER TEST COMPLETO

### Tempo stimato: 10-15 minuti

```
1. ⏱️ 1 min - Settings
   → Inserisci Gemini API Key
   → Test API

2. ⏱️ 2 min - Context Analyzer
   → Indirizzo: "Corso Buenos Aires 23, Milano"
   → Cerca POI (aspetta 30s)
   → Genera Summary AI (aspetta 30s)

3. ⏱️ 1 min - Property Data Extractor
   → JSON test:
   {
     "indirizzo": "Corso Buenos Aires 23, Milano",
     "superficie_mq": 250,
     "prezzo": "€500,000",
     "vetrine": 2,
     "altezza_soffitti": "3.5m"
   }

4. ⏱️ 2 min - Brand Matcher
   → Clicca "Esegui Matching" (aspetta 60s)
   → Verifica brand precisi + badge esclusi

5. ⏱️ 2 min - Full Report
   → Clicca "Aggiorna Report"
   → Verifica tutte le sezioni
   → Clicca "Genera Scheda AI" (aspetta 60s)
   → Export TXT

✅ Se tutto funziona → App OK!
❌ Se qualcosa fallisce → Verifica console + localStorage
```

---

## 📞 SUPPORTO

### Se dopo questi test l'app NON funziona:

1. **Screenshot console** (F12 → Tab Console)
2. **Screenshot network** (F12 → Tab Network → Filtra "generativelanguage")
3. **Output comando debug** (copia console.log risultati)
4. **Quale modulo fallisce esattamente**

Con queste informazioni posso fare debug mirato.

---

## 🎯 RIEPILOGO

**L'app funziona così:**

1. **Configura API** (Settings)
2. **Inserisci indirizzo** (Index)
3. **Analizza quartiere** (Context) → Trova brand presenti
4. **Estrai dati immobile** (Property)
5. **Genera matching** (Brand Matcher) → Esclude brand esistenti, suggerisce nuovi
6. **Crea scheda finale** (Full Report) → Consolida tutto

**Se segui questo workflow nell'ordine corretto, l'app DEVE funzionare.**

Se non funziona, è un problema di:
- ❌ API Key invalida/mancante
- ❌ Chiamate API bloccate (CORS, quota)
- ❌ JavaScript errors (console)
- ❌ Workflow non seguito nell'ordine corretto

**Dimmi ESATTAMENTE cosa non funziona e dove si blocca, con screenshot della console!**
