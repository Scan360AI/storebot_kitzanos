// Servizio OpenRouter API
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export const openRouterService = {
  /**
   * Testa la validità di una API key OpenRouter
   */
  async testApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.length < 10) return false;

    try {
      const response = await fetch(OPENROUTER_MODELS_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      console.warn('Errore test OpenRouter API Key:', error);
      return false;
    }
  },

  /**
   * Chiama l'API OpenRouter per generare contenuti
   */
  async generateContent(
    apiKey: string,
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('OpenRouter API Key non configurata');
    }

    const messages: OpenRouterMessage[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const body = {
      model: options.model || 'google/gemini-2.0-flash-001',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.href,
        'X-Title': 'Storebot Pro Suite'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData: OpenRouterResponse = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter ${response.status}: ${errorData.error?.message || response.statusText}`
      );
    }

    const result: OpenRouterResponse = await response.json();

    if (result.choices?.[0]?.message?.content) {
      return result.choices[0].message.content;
    }

    throw new Error('Formato risposta OpenRouter non valido');
  }
};

export default openRouterService;
