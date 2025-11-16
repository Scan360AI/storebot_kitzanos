import { useState } from 'react';
import { Save, Key, CheckCircle, XCircle, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useSettingsStore } from '../stores/useSettingsStore';
import { GeminiService } from '../services/api/gemini';
import { toast } from '../components/ui/Toast';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface ApiTestResult {
  gemini: TestStatus;
  googleMaps: TestStatus;
  storebot: TestStatus;
  openRouter: TestStatus;
}

export const Settings = () => {
  const settings = useSettingsStore();
  const [localKeys, setLocalKeys] = useState({
    gemini: settings.apiKeys.gemini || '',
    googleMaps: settings.apiKeys.googleMaps || '',
    storebot: settings.apiKeys.storebot || '',
    openrouter: settings.apiKeys.openrouter || '',
  });
  const [localGeminiModel, setLocalGeminiModel] = useState(settings.geminiModel);
  const [localOpenRouterModel, setLocalOpenRouterModel] = useState(settings.openrouterModel || '');
  const [testResults, setTestResults] = useState<ApiTestResult>({
    gemini: 'idle',
    googleMaps: 'idle',
    storebot: 'idle',
    openRouter: 'idle',
  });

  const handleSave = () => {
    settings.setApiKey('gemini', localKeys.gemini);
    settings.setApiKey('googleMaps', localKeys.googleMaps);
    settings.setApiKey('storebot', localKeys.storebot);
    settings.setApiKey('openrouter', localKeys.openrouter);
    settings.setGeminiModel(localGeminiModel);
    settings.setOpenrouterModel(localOpenRouterModel);
    toast.success('Impostazioni salvate con successo');
  };

  const testGeminiApi = async () => {
    if (!localKeys.gemini.trim()) {
      toast.error('Inserisci una Gemini API key');
      return;
    }

    setTestResults((prev) => ({ ...prev, gemini: 'testing' }));

    try {
      const gemini = new GeminiService(localKeys.gemini);
      await gemini.testConnection();
      setTestResults((prev) => ({ ...prev, gemini: 'success' }));
      toast.success('Gemini API: Connessione riuscita!');
    } catch (error) {
      setTestResults((prev) => ({ ...prev, gemini: 'error' }));
      toast.error(`Gemini API: ${error instanceof Error ? error.message : 'Errore di connessione'}`);
    }
  };

  const testGoogleMapsApi = async () => {
    if (!localKeys.googleMaps.trim()) {
      toast.error('Inserisci una Google Maps API key');
      return;
    }

    setTestResults((prev) => ({ ...prev, googleMaps: 'testing' }));

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Milano&key=${localKeys.googleMaps}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setTestResults((prev) => ({ ...prev, googleMaps: 'success' }));
        toast.success('Google Maps API: Connessione riuscita!');
      } else {
        setTestResults((prev) => ({ ...prev, googleMaps: 'error' }));
        toast.error(`Google Maps API: ${data.error_message || data.status}`);
      }
    } catch (error) {
      setTestResults((prev) => ({ ...prev, googleMaps: 'error' }));
      toast.error('Google Maps API: Errore di connessione');
    }
  };

  const testStorebotApi = async () => {
    if (!localKeys.storebot.trim()) {
      toast.error('Inserisci una Storebot API key');
      return;
    }

    setTestResults((prev) => ({ ...prev, storebot: 'testing' }));

    try {
      const response = await fetch('https://api.storebook.it/v1/test', {
        headers: {
          'Authorization': `Bearer ${localKeys.storebot}`,
        },
      });

      if (response.ok) {
        setTestResults((prev) => ({ ...prev, storebot: 'success' }));
        toast.success('Storebot API: Connessione riuscita!');
      } else {
        setTestResults((prev) => ({ ...prev, storebot: 'error' }));
        toast.error(`Storebot API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResults((prev) => ({ ...prev, storebot: 'error' }));
      toast.error('Storebot API: Errore di connessione');
    }
  };

  const testOpenRouterApi = async () => {
    if (!localKeys.openrouter.trim()) {
      toast.error('Inserisci una OpenRouter API key');
      return;
    }

    setTestResults((prev) => ({ ...prev, openRouter: 'testing' }));

    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${localKeys.openrouter}`,
        },
      });

      if (response.ok) {
        setTestResults((prev) => ({ ...prev, openRouter: 'success' }));
        toast.success('OpenRouter API: Connessione riuscita!');
      } else {
        setTestResults((prev) => ({ ...prev, openRouter: 'error' }));
        toast.error(`OpenRouter API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResults((prev) => ({ ...prev, openRouter: 'error' }));
      toast.error('OpenRouter API: Errore di connessione');
    }
  };

  const testAllApis = async () => {
    if (localKeys.gemini.trim()) await testGeminiApi();
    if (localKeys.googleMaps.trim()) await testGoogleMapsApi();
    if (localKeys.storebot.trim()) await testStorebotApi();
    if (localKeys.openrouter.trim()) await testOpenRouterApi();
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="w-4 h-4 text-blue-600 spin-icon" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'testing':
        return <Badge variant="default">Test in corso...</Badge>;
      case 'success':
        return <Badge variant="success">Valida</Badge>;
      case 'error':
        return <Badge variant="error">Errore</Badge>;
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="Impostazioni"
      subtitle="Configura le API keys e le preferenze dell'applicazione"
      icon={SettingsIcon}
    >
      <div className="space-y-6">
        {/* Gemini API */}
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gemini API</h3>
                  <p className="text-sm text-gray-600">
                    Richiesta per analisi AI e generazione contenuti
                  </p>
                </div>
              </div>
              {getStatusBadge(testResults.gemini)}
            </div>

            <Input
              type="password"
              label="API Key"
              value={localKeys.gemini}
              onChange={(e) => setLocalKeys({ ...localKeys, gemini: e.target.value })}
              placeholder="Inserisci la tua Gemini API key"
              helper="Ottienila gratis su https://aistudio.google.com/apikey"
              icon={Key}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modello Gemini
              </label>
              <select
                value={localGeminiModel}
                onChange={(e) => setLocalGeminiModel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="flash">Gemini 2.5 Flash (Veloce, consigliato)</option>
                <option value="flash-lite">Gemini 2.5 Flash Lite (Più veloce, fallback)</option>
                <option value="pro">Gemini 2.5 Pro (Migliore qualità, più lento)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Flash: 250 req/giorno gratis • Pro: 50 req/giorno gratis
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={testGeminiApi}
              disabled={testResults.gemini === 'testing'}
              icon={getStatusIcon(testResults.gemini) ? undefined : Key}
            >
              {testResults.gemini === 'testing' ? (
                <>
                  {getStatusIcon(testResults.gemini)}
                  <span className="ml-2">Test in corso...</span>
                </>
              ) : (
                'Testa Connessione'
              )}
            </Button>
          </div>
        </Card>

        {/* Google Maps API */}
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Key className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Google Maps API</h3>
                  <p className="text-sm text-gray-600">
                    Opzionale - Per visualizzare mappe e cercare POI
                  </p>
                </div>
              </div>
              {getStatusBadge(testResults.googleMaps)}
            </div>

            <Input
              type="password"
              label="API Key"
              value={localKeys.googleMaps}
              onChange={(e) => setLocalKeys({ ...localKeys, googleMaps: e.target.value })}
              placeholder="Inserisci la tua Google Maps API key (opzionale)"
              helper="Attiva Places API e Geocoding API su Google Cloud Console"
              icon={Key}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={testGoogleMapsApi}
              disabled={testResults.googleMaps === 'testing'}
            >
              {testResults.googleMaps === 'testing' ? (
                <>
                  {getStatusIcon(testResults.googleMaps)}
                  <span className="ml-2">Test in corso...</span>
                </>
              ) : (
                'Testa Connessione'
              )}
            </Button>
          </div>
        </Card>

        {/* Storebot API */}
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Key className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Storebot API</h3>
                  <p className="text-sm text-gray-600">
                    Opzionale - Per integrazioni con Storebot Suite
                  </p>
                </div>
              </div>
              {getStatusBadge(testResults.storebot)}
            </div>

            <Input
              type="password"
              label="API Key"
              value={localKeys.storebot}
              onChange={(e) => setLocalKeys({ ...localKeys, storebot: e.target.value })}
              placeholder="Inserisci la tua Storebot API key (opzionale)"
              icon={Key}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={testStorebotApi}
              disabled={testResults.storebot === 'testing'}
            >
              {testResults.storebot === 'testing' ? (
                <>
                  {getStatusIcon(testResults.storebot)}
                  <span className="ml-2">Test in corso...</span>
                </>
              ) : (
                'Testa Connessione'
              )}
            </Button>
          </div>
        </Card>

        {/* OpenRouter API */}
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Key className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">OpenRouter API</h3>
                  <p className="text-sm text-gray-600">
                    Opzionale - Per modelli AI alternativi
                  </p>
                </div>
              </div>
              {getStatusBadge(testResults.openRouter)}
            </div>

            <Input
              type="password"
              label="API Key"
              value={localKeys.openrouter}
              onChange={(e) => setLocalKeys({ ...localKeys, openrouter: e.target.value })}
              placeholder="Inserisci la tua OpenRouter API key (opzionale)"
              helper="Ottienila su https://openrouter.ai/keys"
              icon={Key}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modello OpenRouter
              </label>
              <select
                value={localOpenRouterModel}
                onChange={(e) => setLocalOpenRouterModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                <option value="google/gemini-2.5-pro">Google Gemini 2.5 Pro</option>
                <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                <option value="anthropic/claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={testOpenRouterApi}
              disabled={testResults.openRouter === 'testing'}
            >
              {testResults.openRouter === 'testing' ? (
                <>
                  {getStatusIcon(testResults.openRouter)}
                  <span className="ml-2">Test in corso...</span>
                </>
              ) : (
                'Testa Connessione'
              )}
            </Button>
          </div>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="primary" icon={Save} onClick={handleSave}>
            Salva Impostazioni
          </Button>
          <Button variant="outline" onClick={testAllApis}>
            Testa Tutte le API
          </Button>
        </div>

        {/* Configuration status */}
        {settings.isConfigured() ? (
          <Card padding="md">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">
                Configurazione completata! Puoi iniziare a usare l'applicazione.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="md">
            <div className="flex items-center gap-3 text-yellow-700">
              <XCircle className="w-5 h-5" />
              <p className="font-medium">
                Configura almeno Gemini API per iniziare a usare l'applicazione.
              </p>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};
