import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configurazione Supabase
const SUPABASE_URL = 'https://motyywlfmuzsawhvwnbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdHl5d2xmbXV6c2F3aHZ3bmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDk1ODksImV4cCI6MjA2NzQ4NTU4OX0.UTQ1nNZ88pTp-kqQ5MwQNQMO9cQvHvn8qYnCTLvB2LI';

// Singleton client
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
};

export const supabaseService = {
  /**
   * Carica le API keys dal database (se configurate)
   */
  async loadApiKeys(): Promise<{
    gmaps?: string;
    gemini?: string;
    botId?: string;
    openrouter?: string;
  } | null> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('api_keys')
        .select('*')
        .single();

      if (error) {
        console.warn('Errore caricamento API keys da Supabase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Errore connessione Supabase:', error);
      return null;
    }
  },

  /**
   * Salva un report nel database
   */
  async saveReport(report: {
    address: string;
    property_data?: object;
    context_analysis?: object;
    marketing_description?: string;
    brand_matches?: object;
    formaps_chapters?: object;
    ai_summary?: string;
  }): Promise<{ id: string } | null> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('reports')
        .insert([{
          ...report,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Errore salvataggio report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Errore connessione Supabase:', error);
      return null;
    }
  },

  /**
   * Carica un report dal database
   */
  async loadReport(id: string): Promise<object | null> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Errore caricamento report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Errore connessione Supabase:', error);
      return null;
    }
  },

  /**
   * Lista tutti i report
   */
  async listReports(): Promise<Array<{ id: string; address: string; created_at: string }>> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('reports')
        .select('id, address, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore lista report:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Errore connessione Supabase:', error);
      return [];
    }
  }
};

export default supabaseService;
