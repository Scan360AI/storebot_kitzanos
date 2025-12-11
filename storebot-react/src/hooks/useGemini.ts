import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { geminiService, type GeminiImagePart } from '../services/gemini.service';
import { openRouterService } from '../services/openrouter.service';
import { storebotService } from '../services/storebot.service';

interface UseGeminiOptions {
  preferOpenRouter?: boolean;
  preferStorebot?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

export function useGemini(options: UseGeminiOptions = {}) {
  const { apiKeys, setLoading, addToast } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    prompt: string,
    imageParts: GeminiImagePart[] = []
  ): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);
    setLoading(true, 'Elaborazione AI in corso...');

    try {
      let result: string;

      // 1. PRIORITÀ: Storebot (se configurato e preferito)
      if (options.preferStorebot && apiKeys.botId) {
        try {
          console.log('Provo con Storebot Chat API...');
          result = await storebotService.sendMessage(apiKeys.botId, prompt);
          console.log('Storebot risposta ricevuta');
          setIsGenerating(false);
          setLoading(false);
          return result;
        } catch (storebotError) {
          console.warn('Storebot fallito, provo fallback:', storebotError);
          // Continua con fallback
        }
      }

      // 2. FALLBACK 1: OpenRouter (se configurato e preferito)
      if (options.preferOpenRouter && apiKeys.openrouter) {
        try {
          console.log('Provo con OpenRouter...');
          result = await openRouterService.generateContent(
            apiKeys.openrouter,
            prompt,
            {
              model: apiKeys.openrouterModel || 'google/gemini-2.5-flash',
              temperature: options.temperature,
              maxTokens: options.maxOutputTokens
            }
          );
          console.log('OpenRouter risposta ricevuta');
          setIsGenerating(false);
          setLoading(false);
          return result;
        } catch (openRouterError) {
          console.warn('OpenRouter fallito, provo con Gemini:', openRouterError);
          // Fallback a Gemini
          if (!apiKeys.gemini) {
            throw new Error('Nessuna API AI disponibile');
          }
        }
      }

      // 3. FALLBACK 2: Gemini diretto
      if (!apiKeys.gemini) {
        throw new Error('Gemini API Key non configurata');
      }

      console.log('Usando Gemini diretto...');
      result = await geminiService.generateContent(
        apiKeys.gemini,
        prompt,
        imageParts,
        {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens
        }
      );

      setIsGenerating(false);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      setIsGenerating(false);
      setLoading(false);
      addToast({ message: `Errore AI: ${errorMessage}`, type: 'error' });
      return null;
    }
  }, [apiKeys, options, setLoading, addToast]);

  const generateWithImages = useCallback(async (
    prompt: string,
    images: File[]
  ): Promise<string | null> => {
    const imageParts = await Promise.all(
      images.map((file) => geminiService.fileToImagePart(file))
    );
    return generate(prompt, imageParts);
  }, [generate]);

  const generateWithImageUrls = useCallback(async (
    prompt: string,
    urls: string[]
  ): Promise<string | null> => {
    const imageParts = await Promise.all(
      urls.map((url) => geminiService.urlToImagePart(url))
    );
    return generate(prompt, imageParts);
  }, [generate]);

  // Genera con Storebot prioritario
  const generateWithStorebot = useCallback(async (
    prompt: string
  ): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);
    setLoading(true, 'Elaborazione AI in corso...');

    try {
      let result: string;

      // Prova Storebot
      if (apiKeys.botId) {
        try {
          console.log('Provo con Storebot Chat API...');
          result = await storebotService.sendMessage(apiKeys.botId, prompt);
          console.log('Storebot risposta ricevuta');
          setIsGenerating(false);
          setLoading(false);
          return result;
        } catch (storebotError) {
          console.warn('Storebot fallito:', storebotError);
        }
      }

      // Fallback a Gemini
      if (!apiKeys.gemini) {
        throw new Error('Nessuna API AI disponibile (Storebot e Gemini non configurati)');
      }

      console.log('Fallback a Gemini...');
      result = await geminiService.generateContent(
        apiKeys.gemini,
        prompt,
        [],
        {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens
        }
      );

      setIsGenerating(false);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      setIsGenerating(false);
      setLoading(false);
      addToast({ message: `Errore AI: ${errorMessage}`, type: 'error' });
      return null;
    }
  }, [apiKeys, options, setLoading, addToast]);

  return {
    generate,
    generateWithImages,
    generateWithImageUrls,
    generateWithStorebot,
    isGenerating,
    error
  };
}

export default useGemini;
