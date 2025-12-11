import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { geminiService } from '../services/gemini.service';
import { openRouterService } from '../services/openrouter.service';
import { storebotService } from '../services/storebot.service';

export interface ApiKeyValidation {
  gmaps: { valid: boolean; loading: boolean; error?: string };
  gemini: { valid: boolean; loading: boolean; error?: string };
  botId: { valid: boolean; loading: boolean; error?: string };
  openrouter: { valid: boolean; loading: boolean; error?: string };
}

export function useApiKeys() {
  const { apiKeys, setApiKey, addToast } = useAppStore();

  const [validation, setValidation] = useState<ApiKeyValidation>({
    gmaps: { valid: false, loading: false },
    gemini: { valid: false, loading: false },
    botId: { valid: false, loading: false },
    openrouter: { valid: false, loading: false }
  });

  const testGmapsKey = useCallback(async (key: string): Promise<boolean> => {
    if (!key || key.length < 10) return false;

    setValidation((v) => ({ ...v, gmaps: { ...v.gmaps, loading: true } }));

    try {
      // Test semplificato per Google Maps - verifica che la chiave esista
      // Il test completo richiede il caricamento dell'SDK
      const isValid = key.startsWith('AIza') && key.length > 30;
      setValidation((v) => ({ ...v, gmaps: { valid: isValid, loading: false } }));
      return isValid;
    } catch (error) {
      setValidation((v) => ({
        ...v,
        gmaps: { valid: false, loading: false, error: 'Errore verifica' }
      }));
      return false;
    }
  }, []);

  const testGeminiKey = useCallback(async (key: string): Promise<boolean> => {
    setValidation((v) => ({ ...v, gemini: { ...v.gemini, loading: true } }));

    try {
      const isValid = await geminiService.testApiKey(key);
      setValidation((v) => ({ ...v, gemini: { valid: isValid, loading: false } }));
      return isValid;
    } catch (error) {
      setValidation((v) => ({
        ...v,
        gemini: { valid: false, loading: false, error: 'Errore verifica' }
      }));
      return false;
    }
  }, []);

  const testBotId = useCallback(async (botId: string): Promise<boolean> => {
    setValidation((v) => ({ ...v, botId: { ...v.botId, loading: true } }));

    try {
      const isValid = await storebotService.testBotId(botId);
      setValidation((v) => ({ ...v, botId: { valid: isValid, loading: false } }));
      return isValid;
    } catch (error) {
      setValidation((v) => ({
        ...v,
        botId: { valid: false, loading: false, error: 'Errore verifica' }
      }));
      return false;
    }
  }, []);

  const testOpenRouterKey = useCallback(async (key: string): Promise<boolean> => {
    setValidation((v) => ({ ...v, openrouter: { ...v.openrouter, loading: true } }));

    try {
      const isValid = await openRouterService.testApiKey(key);
      setValidation((v) => ({ ...v, openrouter: { valid: isValid, loading: false } }));
      return isValid;
    } catch (error) {
      setValidation((v) => ({
        ...v,
        openrouter: { valid: false, loading: false, error: 'Errore verifica' }
      }));
      return false;
    }
  }, []);

  const testAllKeys = useCallback(async () => {
    const results = await Promise.all([
      apiKeys.gmaps ? testGmapsKey(apiKeys.gmaps) : Promise.resolve(false),
      apiKeys.gemini ? testGeminiKey(apiKeys.gemini) : Promise.resolve(false),
      apiKeys.botId ? testBotId(apiKeys.botId) : Promise.resolve(false),
      apiKeys.openrouter ? testOpenRouterKey(apiKeys.openrouter) : Promise.resolve(false)
    ]);

    const allValid = results.slice(0, 3).every(Boolean); // openrouter è opzionale

    if (allValid) {
      addToast({ message: 'Tutte le API Key sono configurate e valide!', type: 'success' });
    } else {
      addToast({ message: 'Alcune API Key non sono valide o mancanti', type: 'warning' });
    }

    return {
      gmaps: results[0],
      gemini: results[1],
      botId: results[2],
      openrouter: results[3]
    };
  }, [apiKeys, testGmapsKey, testGeminiKey, testBotId, testOpenRouterKey, addToast]);

  const saveAndTestKey = useCallback(async (
    keyName: keyof typeof apiKeys,
    value: string
  ) => {
    setApiKey(keyName, value.trim());

    let isValid = false;
    switch (keyName) {
      case 'gmaps':
        isValid = await testGmapsKey(value);
        break;
      case 'gemini':
        isValid = await testGeminiKey(value);
        break;
      case 'botId':
        isValid = await testBotId(value);
        break;
      case 'openrouter':
        isValid = await testOpenRouterKey(value);
        break;
    }

    if (isValid) {
      addToast({ message: `API Key ${keyName} salvata e verificata`, type: 'success' });
    } else {
      addToast({ message: `API Key ${keyName} non valida`, type: 'error' });
    }

    return isValid;
  }, [setApiKey, testGmapsKey, testGeminiKey, testBotId, testOpenRouterKey, addToast]);

  return {
    apiKeys,
    validation,
    setApiKey,
    testGmapsKey,
    testGeminiKey,
    testBotId,
    testOpenRouterKey,
    testAllKeys,
    saveAndTestKey
  };
}

export default useApiKeys;
