# 🚀 Deploy Storebot Pro V2 su Netlify

## Prerequisiti

1. **Account Netlify** (gratuito): https://app.netlify.com/signup
2. **Repository GitHub** con il codice
3. **Gemini API Key** (gratuita): https://aistudio.google.com/apikey
4. **Google Maps API Key** (opzionale): https://console.cloud.google.com/

---

## 🎯 Metodo 1: Deploy Automatico da GitHub (Consigliato)

### Step 1: Connetti GitHub a Netlify

1. Vai su https://app.netlify.com/
2. Clicca **"Add new site"** → **"Import an existing project"**
3. Scegli **"Deploy with GitHub"**
4. Autorizza Netlify ad accedere al tuo GitHub
5. Seleziona il repository: **Scan360AI/storebot_kitzanos**
6. Scegli il branch: **claude/review-ai-model-011CUmUZbLQ4kJdntUnNV5Zr**

### Step 2: Configurazione Build

Netlify dovrebbe rilevare automaticamente la configurazione da `netlify.toml`, ma verifica:

```
Build command: cd v2 && npm install && npm run build
Publish directory: v2/dist
Functions directory: v2/netlify/functions
```

### Step 3: Deploy

1. Clicca **"Deploy site"**
2. Aspetta 2-3 minuti per il build
3. Il sito sarà disponibile su un URL tipo: `https://random-name-123.netlify.app`

### Step 4: Personalizza Dominio (Opzionale)

1. Vai su **Site settings** → **Domain management**
2. Clicca **"Add custom domain"** o **"Change site name"**
3. Scegli un nome tipo: `storebot-pro.netlify.app`

---

## 🧪 Metodo 2: Test Locale con Netlify Dev

Per testare le funzioni serverless in locale:

```bash
cd v2

# Installa dipendenze (se non fatto)
npm install

# Avvia Netlify Dev (simula l'ambiente Netlify in locale)
npm run dev:netlify
```

Questo avvierà:
- Vite dev server su http://localhost:5173
- Netlify Functions su http://localhost:8888/.netlify/functions

---

## 🔑 Configurazione API Keys

### Dopo il Deploy

1. Vai all'URL del sito (es: `https://storebot-pro.netlify.app`)
2. L'app ti reindirizzerà automaticamente a `/settings`
3. Configura le API keys:

**Obbligatoria:**
- ✅ **Gemini API Key** - https://aistudio.google.com/apikey
  - 250 richieste/giorno gratuite con Flash model
  - 50 richieste/giorno gratuite con Pro model

**Opzionali:**
- 🗺️ **Google Maps API Key** (per POI reali da Google Maps)
  - Se non configurata, l'app usa Gemini AI come fallback
  - Attiva: Geocoding API + Places API
- 🏢 **Storebot API Key** (per integrazioni)
- 🤖 **OpenRouter API Key** (per modelli AI alternativi)

---

## 📦 Struttura Deploy

```
storebot_kitzanos/
├── netlify.toml                 # Configurazione Netlify
├── v2/
│   ├── dist/                    # Build output (generato)
│   ├── netlify/
│   │   └── functions/           # Funzioni serverless
│   │       ├── geocode.ts       # Proxy Google Geocoding API
│   │       └── places-nearby.ts # Proxy Google Places API
│   ├── src/                     # Codice sorgente React
│   ├── package.json
│   └── vite.config.ts
```

---

## 🔧 Come Funzionano le Netlify Functions

Le funzioni serverless risolvono il problema CORS delle Google Maps API:

### 1. **geocode.ts** - Converte indirizzo in coordinate
```
Frontend → /.netlify/functions/geocode?address=Milano&apiKey=xxx
         → Google Maps Geocoding API
         → Ritorna {lat, lng}
```

### 2. **places-nearby.ts** - Cerca POI vicini
```
Frontend → /.netlify/functions/places-nearby?location=45.46,9.19&radius=500&apiKey=xxx
         → Google Maps Places API
         → Ritorna lista POI
```

**Vantaggi:**
- ✅ Niente errori CORS
- ✅ API key protetta (non esposta nel frontend)
- ✅ Chiamate più veloci (server-to-server)
- ✅ Fallback automatico a Gemini AI se Google Maps fallisce

---

## 🎨 Funzionalità Dopo il Deploy

### Workflow Completo

1. **Dashboard** → Overview e navigazione
2. **Settings** → Configura API keys (first-time setup)
3. **Analisi Contesto** → Cerca POI (Google Maps → fallback Gemini AI)
4. **Dati Immobile** → Input manuale/JSON/PDF/foto
5. **Brand Matching** → AI genera brand compatibili con auto-esclusione
6. **Report Finale** → Genera HTML con foto embedded

### Velocità

- **Google Maps POI**: ~2-3 secondi
- **Gemini AI POI**: ~20-30 secondi
- **Brand Matching**: ~30-40 secondi
- **Report Generation**: ~30 secondi

---

## 🐛 Troubleshooting

### Build Fallisce

```bash
# Verifica che il build funzioni in locale
cd v2
npm install
npm run build
```

Se funziona in locale ma non su Netlify:
- Verifica `netlify.toml` sia nella root
- Verifica il branch su Netlify sia corretto
- Controlla i build logs su Netlify Dashboard

### Funzioni Non Funzionano

Apri browser console (F12) e verifica:
```javascript
// Dovrebbe rispondere con dati
fetch('/.netlify/functions/geocode?address=Milano&apiKey=YOUR_KEY')
  .then(r => r.json())
  .then(console.log)
```

Se errore 404:
- Verifica che `v2/netlify/functions/` contenga i file `.ts`
- Rifare deploy da Netlify Dashboard

### Google Maps Fallisce

L'app fa automaticamente fallback a Gemini AI. Controlla:
1. Google Maps API key sia valida
2. Geocoding API sia attivata su Google Cloud Console
3. Places API sia attivata
4. Billing sia configurato (richiede carta, ma ha $200 credito gratuito/mese)

---

## 💰 Costi

### Netlify (Gratuito per sempre)
- ✅ 100 GB bandwidth/mese
- ✅ 125,000 funzioni serverless/mese
- ✅ Deploy illimitati
- ✅ HTTPS gratuito

### Gemini AI (Gratuito)
- ✅ Flash: 250 req/giorno
- ✅ Pro: 50 req/giorno

### Google Maps (Opzionale)
- ⚠️ Richiede carta di credito
- ✅ $200 credito gratuito/mese
- ✅ Geocoding: $5 per 1000 richieste (dopo credito)
- ✅ Places Nearby: $32 per 1000 richieste (dopo credito)
- 💡 Per uso normale: resti entro il credito gratuito

---

## 📊 Monitoraggio

### Netlify Dashboard

Vai su: https://app.netlify.com → Seleziona il sito

Puoi vedere:
- **Deploys**: Storico build
- **Functions**: Logs e statistiche chiamate
- **Analytics**: Visite e performance
- **Domain**: Gestione dominio

### Logs in Tempo Reale

```bash
netlify dev  # In locale
netlify functions:log  # Logs produzione
```

---

## 🔄 Aggiornamenti

Ogni volta che fai push su GitHub, Netlify fa automaticamente:
1. ✅ Pull del nuovo codice
2. ✅ Build (`npm run build`)
3. ✅ Deploy automatico
4. ✅ Rollback automatico se build fallisce

**Deploy automatici** sono attivi di default!

---

## 📞 Support

- Netlify Docs: https://docs.netlify.com
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Google Maps API: https://developers.google.com/maps
- Gemini API: https://ai.google.dev/

---

## ✅ Checklist Deploy

- [ ] Account Netlify creato
- [ ] Repository connesso
- [ ] Build completato con successo
- [ ] Sito accessibile via URL
- [ ] Gemini API key configurata in `/settings`
- [ ] (Opzionale) Google Maps API key configurata
- [ ] Test completo workflow: Context → Property → Brands → Report
- [ ] Report HTML generato correttamente con foto
- [ ] (Opzionale) Dominio personalizzato configurato

**Tempo totale setup: 10-15 minuti** ⚡

Buon deploy! 🚀
