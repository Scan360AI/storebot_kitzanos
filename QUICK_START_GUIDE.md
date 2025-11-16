# 🚀 GUIDA RAPIDA - STOREBOT PRO SUITE

## ⚡ TEST IN 5 MINUTI

### PREREQUISITI
- ✅ Gemini API Key (https://aistudio.google.com/apikey)
- ✅ Browser moderno (Chrome, Firefox, Edge)
- ✅ Connessione internet

---

## 📝 WORKFLOW MINIMO FUNZIONANTE

### STEP 1: Configurazione (1 min)
```
1. Apri: settings.html
2. Inserisci Gemini API Key nel campo
3. Seleziona modello: "Gemini 2.5 Flash"
4. Clicca: "Salva"
5. Clicca: "Test Tutte le API"
6. Verifica: ✓ Gemini: Valida
```

**Se fallisce:**
- Verifica API key copiata correttamente (senza spazi)
- Verifica quota Google (https://console.cloud.google.com)

---

### STEP 2: Analisi Quartiere (2 min)
```
1. Apri: context_analyzer.html
2. Inserisci indirizzo di test: "Corso Buenos Aires 23, Milano"
3. Clicca: "Cerca POI"
4. Aspetta 20-30 secondi
5. Verifica: Mappa caricata + Lista POI
6. Clicca: "Genera Summary AI"
7. Aspetta 20-30 secondi
8. Verifica: Testo descrizione quartiere generato
```

**Se fallisce:**
- Console (F12) → Cerca errori rossi
- Verifica Google Maps API key (se richiesta)
- Prova indirizzo diverso

---

### STEP 3: Dati Immobile (30 sec)
```
1. Apri: property_data_extractor.html
2. Clicca tab: "Incolla JSON"
3. Copia e incolla questo JSON:

{
  "indirizzo": "Corso Buenos Aires 23, Milano",
  "superficie_mq": 250,
  "prezzo": "€500,000",
  "vetrine": 2,
  "altezza_soffitti": "3.5m",
  "parcheggio": "50 posti"
}

4. Clicca: "Carica Dati JSON"
5. Verifica: Messaggio "Dati salvati con successo"
```

**Se fallisce:**
- JSON deve essere VALIDO (usa https://jsonlint.com)
- Rimuovi commenti dal JSON

---

### STEP 4: Brand Matching (1 min)
```
1. Apri: brand_matcher.html
2. Verifica: Campo "Contesto Quartiere" popolato (da STEP 2)
3. Verifica: Campo "Dati Immobile" popolato (da STEP 3)
4. Clicca: "Esegui Matching"
5. Aspetta 30-60 secondi
6. Verifica risultati:
   ✓ Badge giallo "Brand già presenti" (se ci sono)
   ✓ Card brand con nomi SPECIFICI (es: Esselunga, Leroy Merlin)
   ✓ NO categorie generiche (es: "Supermercato generico")
7. Clicca su una card brand
8. Verifica: Sezione "🎯 Ragioni del matching" evidenziata in verde
```

**Se fallisce:**
- Verifica STEP 2 e 3 completati
- Controlla console per errori API
- Riprova (a volte AI migliora al 2° tentativo)

---

### STEP 5: Report Finale (1 min)
```
1. Apri: full_report.html
2. Clicca: "Aggiorna/Genera Report"
3. Verifica 5 sezioni:
   ✓ Analisi Contesto Quartiere
   ✓ Dati Immobile
   ✓ Analisi Territoriale Formaps (può essere vuota)
   ✓ Descrizione Marketing (può essere vuota)
   ✓ Analisi Compatibilità Brand
4. Clicca: "Genera Scheda AI"
5. Aspetta 30-60 secondi
6. Verifica: Scheda completa generata
7. Clicca: "Esporta Report TXT"
8. Verifica: File scaricato
```

**Se fallisce:**
- Verifica STEP 2, 3, 4 completati
- Controlla localStorage (F12 → Application)

---

## ✅ SE TUTTO FUNZIONA

Congratulazioni! L'app è pronta. Ora puoi:
- Testare con altri indirizzi reali
- Caricare PDF immobili (Property Extractor → Tab PDF)
- Generare descrizioni marketing (Marketing Generator)
- Analizzare mappe (Formaps)

---

## ❌ SE QUALCOSA NON FUNZIONA

### DEBUG RAPIDO (2 min)

#### 1. Verifica Console
```
F12 → Console
Cerca errori ROSSI
Screenshot e condividi
```

#### 2. Verifica localStorage
```
F12 → Application → Local Storage → file://
Cerca chiavi "storebot_*"
Se mancano → Step precedente non completato
```

#### 3. Verifica Network
```
F12 → Network → Filtra "generativelanguage"
Cerca status code:
- 200 = OK ✓
- 403 = API key invalida ✗
- 429 = Rate limit (troppo richieste) ✗
- 500 = Errore server Google ✗
```

#### 4. Test API Manuale
```javascript
// F12 Console - Copia e incolla:
async function testAPI() {
  const key = localStorage.getItem('storebot_suite_gemini');
  if (!key) return console.error('API Key mancante!');

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      contents: [{parts: [{text: 'Ciao'}]}]
    })
  });

  console.log('Status:', res.status);
  console.log('Response:', await res.json());
}
testAPI();
```

**Risultati attesi:**
- Status: 200 ✓ → API funziona
- Status: 403 ✗ → API key invalida
- Status: 429 ✗ → Troppi richieste, aspetta 1 minuto

---

## 🐛 PROBLEMI COMUNI

### "Non vedo la mappa in Context Analyzer"
```
Causa: Google Maps API key mancante
Fix:
- Settings → Inserisci anche Google Maps API key
- Oppure: Salta "Cerca POI", vai direttamente a "Genera Summary AI"
```

### "Brand Matcher suggerisce categorie generiche"
```
Causa: AI non segue istruzioni
Fix:
- Riprova la generazione (può migliorare)
- Cambia modello: Settings → Gemini 2.5 Pro
- Verifica prompt in console (troppo lungo?)
```

### "Full Report è vuoto"
```
Causa: Step precedenti non completati
Fix:
- Segui workflow: Context → Property → Brand Match
- Verifica localStorage (F12 → Application)
- Esegui "Aggiorna Report" dopo ogni modulo
```

### "ERR_FILE_NOT_FOUND settings.js"
```
Causa: File rinominato
Status: ✅ RISOLTO in commit 2ecaae9
Se persiste: verifica file settings.js esiste nella directory
```

---

## 📊 CHECKLIST VELOCE

Prima di segnalare un problema, verifica:

- [ ] Gemini API Key configurata in Settings
- [ ] Test API eseguito con successo (✓ Valida)
- [ ] Console browser (F12) senza errori rossi critici
- [ ] localStorage contiene chiavi "storebot_*"
- [ ] Workflow seguito nell'ordine: Context → Property → Brand Match → Report
- [ ] Attesa sufficiente per generazione AI (30-60 secondi)
- [ ] Connessione internet stabile

---

## 💡 TIPS

### Velocizza i test:
```
- Usa SEMPRE lo stesso indirizzo di test (es: Corso Buenos Aires 23, Milano)
- Salva JSON immobile di test in un file .txt → Copia/incolla veloce
- Non resettare localStorage tra un test e l'altro
- Tieni aperta la console (F12) per vedere errori real-time
```

### Ottimizza i risultati AI:
```
- Usa modello "flash" per velocità (Settings)
- Usa modello "pro" per qualità (Settings)
- Context Analyzer: Inserisci indirizzo PRECISO con numero civico
- Property Data: Compila TUTTI i campi JSON possibili
- Brand Matcher: Più dettagli in property → migliori suggerimenti
```

### Risparmia quota API:
```
- Gemini 2.5 Flash: 250 richieste/giorno FREE
- Ogni modulo usa 1-2 richieste
- 1 workflow completo = ~6-8 richieste
- Puoi fare ~30 workflow/giorno in FREE tier
```

---

## 📞 ANCORA PROBLEMI?

Condividi:
1. **Screenshot console** con errori rossi
2. **Screenshot network** tab (filtra "googleapis")
3. **Output comando:**
   ```javascript
   // F12 Console:
   Object.keys(localStorage).filter(k => k.startsWith('storebot')).forEach(k => {
     console.log(`${k}: ${localStorage.getItem(k).substring(0, 50)}...`);
   });
   ```
4. **Quale STEP fallisce esattamente**

Con queste info posso aiutarti!

---

## 🎯 RIEPILOGO 30 SECONDI

```
1. Settings → API Key
2. Context → Cerca POI + Summary AI
3. Property → JSON dati
4. Brand Match → Esegui
5. Report → Genera Scheda

✅ Funziona? → Usa in produzione!
❌ Fallisce? → Console + localStorage + condividi screenshot
```
