// app-reset-loader.js - Gestisce il caricamento iniziale da Supabase

(async function() {
    // Controlla se ci sono i parametri nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const shouldReset = urlParams.get('reset') === 'true';
    const propertyId = urlParams.get('property_id');
    
    if (!shouldReset || !propertyId) {
        return; // Non fare nulla se non ci sono i parametri giusti
    }
    
    console.log('🔄 Reset richiesto per property:', propertyId);
    
    try {
        // Inizializza Supabase
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // 1. PULISCI TUTTO IL LOCALSTORAGE
        console.log('🧹 Pulizia localStorage...');
        const keysToPreserve = []; // Nessuna chiave da preservare per ora
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (!keysToPreserve.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        // 2. CARICA API KEYS
        console.log('🔑 Caricamento API keys...');
        const { data: apiKeys, error: apiError } = await supabase
            .from('api_configurations')
            .select('*');
            
        if (apiError) throw new Error('Errore caricamento API keys: ' + apiError.message);
        
        // Salva le API keys in localStorage
        apiKeys.forEach(config => {
            if (config.key_name === 'gmaps') {
                localStorage.setItem('storebot_suite_gmaps', config.key_value);
            } else if (config.key_name === 'gemini') {
                localStorage.setItem('storebot_suite_gemini', config.key_value);
            } else if (config.key_name === 'botId') {
                localStorage.setItem('storebot_suite_botId', config.key_value);
            }
        });
        
        // 3. CARICA DATI PROPERTY
        console.log('🏢 Caricamento dati immobile...');
        const { data: property, error: propError } = await supabase
            .from('properties')
            .select('*')
            .eq('external_id', propertyId)
            .single();
            
        if (propError) throw new Error('Errore caricamento property: ' + propError.message);
        
// Salva i dati della property in localStorage
if (property) {
    localStorage.setItem('storebot_currentAddress', property.address);
    localStorage.setItem('storebot_lastAddress', property.address);
    
    // Se ci sono metadata, salvali come propertyDetails
    if (property.metadata && Object.keys(property.metadata).length > 0) {
        // Estrai le immagini dai metadata
        if (property.metadata.images && property.metadata.images.length > 0) {
            // Prepara le immagini per marketing_description_generator
            const marketingImages = property.metadata.images.map((img, index) => ({
                id: Date.now() + index,
                name: `Immagine ${index + 1}`,
                dataUrl: img.url,
                mimeType: 'image/jpeg',
                type: 'url',
                originalUrl: img.url
            }));
            
            localStorage.setItem('storebot_propertyImages', JSON.stringify(marketingImages));
            
            // Rimuovi images dai metadata prima di salvarli
            const metadataWithoutImages = {...property.metadata};
            delete metadataWithoutImages.images;
            localStorage.setItem('storebot_propertyDetails', JSON.stringify(metadataWithoutImages));
        } else {
            localStorage.setItem('storebot_propertyDetails', JSON.stringify(property.metadata));
        }
    }
}
        
        // 4. RIMUOVI I PARAMETRI DALL'URL per evitare reset loop
        console.log('✅ Caricamento completato!');
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Mostra messaggio di successo se StorebotUtils è disponibile
        if (typeof StorebotUtils !== 'undefined') {
            StorebotUtils.showTemporaryMessage('Dati caricati da sistema esterno', 'success');
        }
        
    } catch (error) {
        console.error('❌ Errore durante il caricamento:', error);
        if (typeof StorebotUtils !== 'undefined') {
            StorebotUtils.showTemporaryMessage('Errore caricamento dati: ' + error.message, 'error');
        }
    }
})();
