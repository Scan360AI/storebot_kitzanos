import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { geminiService, type GeminiImagePart } from '../services/gemini.service';
import { openRouterService } from '../services/openrouter.service';

interface UseGeminiOptions {
  preferOpenRouter?: boolean;
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

      // Se OpenRouter è configurato e preferito, usa quello
      if (options.preferOpenRouter && apiKeys.openrouter) {
        try {
          result = await openRouterService.generateContent(
            apiKeys.openrouter,
            prompt,
            {
              model: apiKeys.openrouterModel || 'google/gemini-2.0-flash-001',
              temperature: options.temperature,
              maxTokens: options.maxOutputTokens
            }
          );
        } catch (openRouterError) {
          console.warn('OpenRouter fallito, provo con Gemini:', openRouterError);
          // Fallback a Gemini
          if (!apiKeys.gemini) {
            throw new Error('Nessuna API AI disponibile');
          }
          result = await geminiService.generateContent(
            apiKeys.gemini,
            prompt,
            imageParts,
            {
              temperature: options.temperature,
              maxOutputTokens: options.maxOutputTokens
            }
          );
        }
      } else {
        // Usa Gemini direttamente
        if (!apiKeys.gemini) {
          throw new Error('Gemini API Key non configurata');
        }
        result = await geminiService.generateContent(
          apiKeys.gemini,
          prompt,
          imageParts,
          {
            temperature: options.temperature,
            maxOutputTokens: options.maxOutputTokens
          }
        );
      }

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

  return {
    generate,
    generateWithImages,
    generateWithImageUrls,
    isGenerating,
    error
  };
}

export default useGemini;
