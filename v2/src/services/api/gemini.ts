export type GeminiModel = 'flash' | 'flash-lite' | 'pro';

const MODEL_NAMES: Record<GeminiModel, string> = {
  flash: 'gemini-2.5-flash',
  'flash-lite': 'gemini-2.5-flash-lite',
  pro: 'gemini-2.5-pro',
};

export interface GeminiOptions {
  model?: GeminiModel;
  temperature?: number;
  maxTokens?: number;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(
    prompt: string,
    options: GeminiOptions = {}
  ): Promise<string> {
    const {
      model = 'flash',
      temperature = 0.4,
      maxTokens = 2048,
    } = options;

    const modelName = MODEL_NAMES[model];
    const url = `${this.baseUrl}/${modelName}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        // Auto-fallback to flash-lite on rate limit
        if (response.status === 429 && model === 'flash') {
          console.warn('Rate limit on flash, retrying with flash-lite...');
          return this.generateText(prompt, { ...options, model: 'flash-lite' });
        }

        const error = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error ${response.status}: ${error.error?.message || response.statusText}`
        );
      }

      const result = await response.json();

      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text;
      }

      if (result.promptFeedback?.blockReason) {
        throw new Error(`Request blocked: ${result.promptFeedback.blockReason}`);
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error calling Gemini API');
    }
  }

  async analyzeImage(
    imageData: string,
    prompt: string,
    options: GeminiOptions = {}
  ): Promise<string> {
    const {
      model = 'flash',
      temperature = 0.4,
      maxTokens = 2048,
    } = options;

    const modelName = MODEL_NAMES[model];
    const url = `${this.baseUrl}/${modelName}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error ${response.status}: ${error.error?.message || response.statusText}`
        );
      }

      const result = await response.json();

      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error calling Gemini API');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateText('Test', { model: 'flash', maxTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }
}
