import { useState, useEffect } from 'react';
import { Map, Sparkles, Bot, Zap, ShieldCheck, Loader2, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useApiKeys } from '../hooks/useApiKeys';
import { useAppStore } from '../store/appStore';
import { OPENROUTER_MODELS } from '../types';

export function Settings() {
  const { apiKeys, validation, saveAndTestKey, testAllKeys, setApiKey } = useApiKeys();
  const { addToast } = useAppStore();

  const [gmapsKey, setGmapsKey] = useState(apiKeys.gmaps || '');
  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [botId, setBotId] = useState(apiKeys.botId || '');
  const [openrouterKey, setOpenrouterKey] = useState(apiKeys.openrouter || '');
  const [selectedModel, setSelectedModel] = useState(apiKeys.openrouterModel || 'google/gemini-2.5-flash');
  const [openapiKey, setOpenapiKey] = useState(apiKeys.openapi || '');

  const [testingAll, setTestingAll] = useState(false);

  useEffect(() => {
    setGmapsKey(apiKeys.gmaps || '');
    setGeminiKey(apiKeys.gemini || '');
    setBotId(apiKeys.botId || '');
    setOpenrouterKey(apiKeys.openrouter || '');
    setSelectedModel(apiKeys.openrouterModel || 'google/gemini-2.5-flash');
    setOpenapiKey(apiKeys.openapi || '');
  }, [apiKeys]);

  const handleSaveGmaps = () => saveAndTestKey('gmaps', gmapsKey);
  const handleSaveGemini = () => saveAndTestKey('gemini', geminiKey);
  const handleSaveBotId = () => saveAndTestKey('botId', botId);
  const handleSaveOpenrouter = () => saveAndTestKey('openrouter', openrouterKey);
  const handleSaveOpenapi = () => saveAndTestKey('openapi', openapiKey);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setApiKey('openrouterModel', model);
    addToast({ message: 'Modello AI aggiornato', type: 'success' });
  };

  const handleTestAll = async () => {
    setTestingAll(true);
    await testAllKeys();
    setTestingAll(false);
  };

  const getStatusIcon = (keyType: keyof typeof validation) => {
    const status = validation[keyType];
    if (status.loading) {
      return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    }
    return (
      <span className={`api-dot ${status.valid ? 'api-dot-valid' : 'api-dot-invalid'}`} />
    );
  };

  const getStatusText = (keyType: keyof typeof validation, hasKey: boolean) => {
    const status = validation[keyType];
    if (status.loading) return 'Verifica in corso...';
    if (!hasKey) return 'Non configurata';
    return status.valid ? 'Valida' : 'Non valida';
  };

  const selectedModelInfo = OPENROUTER_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="text-primary-500" />
          Configurazione API
        </h1>
        <p className="text-gray-500 mt-2">
          Gestisci le tue chiavi API e le impostazioni dell'applicazione
        </p>
      </div>

      {/* Status Generale */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stato Generale API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon('gmaps')}
              <span className="text-sm">Google Maps: {getStatusText('gmaps', !!apiKeys.gmaps)}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon('gemini')}
              <span className="text-sm">Gemini: {getStatusText('gemini', !!apiKeys.gemini)}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon('botId')}
              <span className="text-sm">Storebot: {getStatusText('botId', !!apiKeys.botId)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps API */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle icon={<Map className="text-blue-500" size={20} />}>
            Google Maps API Key
          </CardTitle>
          <CardDescription>
            Necessaria per geocodifica e ricerca luoghi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="password"
                value={gmapsKey}
                onChange={(e) => setGmapsKey(e.target.value)}
                placeholder="AIza..."
              />
            </div>
            <Button
              onClick={handleSaveGmaps}
              loading={validation.gmaps.loading}
            >
              Salva
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              Ottieni API Key →
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Gemini API */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle icon={<Sparkles className="text-purple-500" size={20} />}>
            Google Gemini API Key
          </CardTitle>
          <CardDescription>
            Per generazione contenuti AI (modello gemini-2.0-flash)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
              />
            </div>
            <Button
              onClick={handleSaveGemini}
              loading={validation.gemini.loading}
            >
              Salva
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              Ottieni API Key →
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Storebot Bot ID */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle icon={<Bot className="text-green-500" size={20} />}>
            Storebot Bot ID
          </CardTitle>
          <CardDescription>
            ID del bot Storebot per analisi avanzate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                value={botId}
                onChange={(e) => setBotId(e.target.value)}
                placeholder="bot_..."
              />
            </div>
            <Button
              onClick={handleSaveBotId}
              loading={validation.botId.loading}
            >
              Salva
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Contatta il supporto per ottenere il Bot ID
          </p>
        </CardContent>
      </Card>

      {/* OpenRouter API (Opzionale) */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle icon={<Zap className="text-amber-500" size={20} />}>
            OpenRouter API Key
            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              OPZIONALE
            </span>
          </CardTitle>
          <CardDescription>
            Per accesso a modelli AI alternativi (Claude, GPT-4o, Llama)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <Input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-..."
              />
            </div>
            <Button
              onClick={handleSaveOpenrouter}
              loading={validation.openrouter.loading}
            >
              Salva
            </Button>
          </div>

          {/* Model Selection */}
          <div className="border-t pt-4">
            <Select
              label="Modello AI per Report"
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              options={OPENROUTER_MODELS.map(m => ({
                value: m.id,
                label: `${m.name} (${m.description})`
              }))}
            />
            {selectedModelInfo && (
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>{selectedModelInfo.description}</span>
                <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                  {selectedModelInfo.pricePerToken}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-4">
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              Ottieni API Key →
            </a>
          </p>
        </CardContent>
      </Card>

      {/* OpenAPI.it Real Estate API (Opzionale) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle icon={<Home className="text-emerald-500" size={20} />}>
            OpenAPI.it Quotazioni Immobiliari
            <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
              OPZIONALE
            </span>
          </CardTitle>
          <CardDescription>
            Per quotazioni immobiliari OMI, dati demografici e rischio sismico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="password"
                value={openapiKey}
                onChange={(e) => setOpenapiKey(e.target.value)}
                placeholder="La tua API Key OpenAPI.it"
              />
            </div>
            <Button
              onClick={handleSaveOpenapi}
              loading={validation.openapi.loading}
            >
              Salva
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <a
              href="https://console.openapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              Registrati su console.openapi.com →
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Costo: €0.05-€3.00 per chiamata (in base al volume)
          </p>
        </CardContent>
      </Card>

      {/* Test All */}
      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={handleTestAll}
          loading={testingAll}
          icon={<ShieldCheck size={18} />}
          size="lg"
        >
          Test Tutte le API
        </Button>
      </div>
    </div>
  );
}

export default Settings;
