// Servizio Storebot Chat API
const STOREBOT_API_URL = 'https://scanchat-dev.bflows.ai/api/chat/message';

export interface StorebotResponse {
  message?: string;
  response?: string;
  content?: string;
  error?: string;
}

export const storebotService = {
  /**
   * Testa la validità di un Bot ID Storebot
   */
  async testBotId(botId: string): Promise<boolean> {
    if (!botId || botId.length < 10) return false;

    try {
      const response = await fetch(STOREBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test connettività',
          bot_id: botId,
          streaming: false
        })
      });

      // Considera valido se non è 401, 403 o 404
      return response.ok || (response.status !== 401 && response.status !== 404 && response.status !== 403);
    } catch (error) {
      console.warn('Errore test Storebot Bot ID:', error);
      return false;
    }
  },

  /**
   * Chiama l'API Storebot Chat
   */
  async sendMessage(botId: string, message: string): Promise<string> {
    if (!botId) {
      throw new Error('ID Bot Storebot Chat non configurato');
    }

    const response = await fetch(STOREBOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        bot_id: botId,
        streaming: false
      })
    });

    if (!response.ok) {
      const errorData: StorebotResponse = await response.json().catch(() => ({ error: `Errore server ${response.status}` }));
      throw new Error(
        `Errore API Storebot Chat ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const result: StorebotResponse = await response.json();
    return result.message || result.response || result.content || JSON.stringify(result);
  }
};

export default storebotService;
