// Servizio Gemini API - Aggiornato a gemini-2.5-flash (Dicembre 2025)
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export interface GeminiImagePart {
  inline_data: {
    mime_type: string;
    data: string; // base64
  };
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
}

export const geminiService = {
  /**
   * Testa la validità di una API key Gemini
   */
  async testApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.length < 10) return false;

    const apiUrl = `${GEMINI_API_BASE}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ciao' }] }]
        })
      });
      return response.ok;
    } catch (error) {
      console.warn('Errore test Gemini API Key:', error);
      return false;
    }
  },

  /**
   * Chiama l'API Gemini per generare contenuti
   */
  async generateContent(
    apiKey: string,
    prompt: string,
    imageParts: GeminiImagePart[] = [],
    options: {
      temperature?: number;
      maxOutputTokens?: number;
      model?: string;
    } = {}
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('Gemini API Key non configurata');
    }

    const model = options.model || DEFAULT_MODEL;
    const apiUrl = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const parts: Array<{ text?: string } | GeminiImagePart> = [{ text: prompt }];
    imageParts.forEach(imgPart => parts.push(imgPart));

    const body = {
      contents: [{ parts }],
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxOutputTokens ?? 4096
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData: GeminiResponse = await response.json().catch(() => ({}));
      throw new Error(
        `Errore API Gemini ${response.status}: ${errorData.error?.message || response.statusText}`
      );
    }

    const result: GeminiResponse = await response.json();

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      return result.candidates[0].content.parts[0].text;
    }

    if (result.promptFeedback?.blockReason) {
      throw new Error(`Richiesta bloccata da Gemini: ${result.promptFeedback.blockReason}`);
    }

    throw new Error('Formato risposta da Gemini non valido');
  },

  /**
   * Converte un file immagine in formato Gemini
   */
  async fileToImagePart(file: File): Promise<GeminiImagePart> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          inline_data: {
            mime_type: file.type,
            data: base64
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Converte un URL immagine in formato Gemini (via fetch + base64)
   */
  async urlToImagePart(url: string): Promise<GeminiImagePart> {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], 'image', { type: blob.type });
    return this.fileToImagePart(file);
  }
};

export default geminiService;
