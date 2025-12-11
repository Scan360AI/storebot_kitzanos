// Servizio OpenAPI.it Real Estate Valuation API
// Documentazione: https://openapi.it/prodotti/quotazioni-immobiliari-advanced

const OPENAPI_BASE_URL = 'https://realestate.openapi.com';

// Tipi di proprietà supportati
export const PROPERTY_TYPES = {
  ABITAZIONI_CIVILI: 1,           // Abitazioni civili
  ABITAZIONI_SIGNORILI: 2,        // Abitazioni signorili
  ABITAZIONI_ECONOMICHE: 3,       // Abitazioni economiche
  VILLINI_E_VILLE: 4,             // Villini e Ville
  AUTORIMESSE: 5,                 // Autorimesse
  BOX: 6,                         // Box
  CAPANNONI_TIPICI: 7,            // Capannoni tipici
  CAPANNONI_INDUSTRIALI: 8,       // Capannoni industriali
  CENTRI_COMMERCIALI: 9,          // Centri commerciali
  LABORATORI: 10,                 // Laboratori
  MAGAZZINI: 11,                  // Magazzini
  NEGOZI: 12,                     // Negozi
  POSTI_AUTO_COPERTI: 13,         // Posti auto coperti
  POSTI_AUTO_SCOPERTI: 14,        // Posti auto scoperti
  UFFICI: 15,                     // Uffici
} as const;

export const PROPERTY_TYPE_LABELS: Record<number, string> = {
  1: 'Abitazioni civili',
  2: 'Abitazioni signorili',
  3: 'Abitazioni economiche',
  4: 'Villini e Ville',
  5: 'Autorimesse',
  6: 'Box',
  7: 'Capannoni tipici',
  8: 'Capannoni industriali',
  9: 'Centri commerciali',
  10: 'Laboratori',
  11: 'Magazzini',
  12: 'Negozi',
  13: 'Posti auto coperti',
  14: 'Posti auto scoperti',
  15: 'Uffici',
};

export type TransactionType = 'sale' | 'rent';

// Interfacce per la risposta API
export interface OpenApiLocation {
  region: string;
  province: string;
  municipality: string;
  zone?: string;
  microzone?: string;
  address?: string;
  civic?: string;
  latitude?: number;
  longitude?: number;
}

export interface OpenApiQuotation {
  min: number;      // €/mq minimo
  med: number;      // €/mq medio
  max: number;      // €/mq massimo
  currency: string; // EUR
  unit: string;     // sqm
}

export interface OpenApiMarketDynamics {
  trend?: string;           // up, down, stable
  variation_percentage?: number;
  period?: string;          // riferimento temporale
}

export interface OpenApiDemographics {
  population?: number;
  density?: number;
  avg_age?: number;
  avg_income?: number;
  employment_rate?: number;
}

export interface OpenApiSeismicRisk {
  zone?: string;
  level?: string;
  description?: string;
}

export interface OpenApiValuationResponse {
  success: boolean;
  data?: {
    location: OpenApiLocation;
    quotation: OpenApiQuotation;
    property_type: string;
    transaction_type: TransactionType;
    market_dynamics?: OpenApiMarketDynamics;
    demographics?: OpenApiDemographics;
    seismic_risk?: OpenApiSeismicRisk;
    last_update?: string;
    source?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ValuationRequest {
  address: string;
  propertyType: number;
  transactionType: TransactionType;
}

export const openApiRealEstateService = {
  /**
   * Testa la validità di una API Key OpenAPI.it
   */
  async testApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.length < 10) return false;

    try {
      // Test con una richiesta semplice (indirizzo fittizio)
      const response = await fetch(`${OPENAPI_BASE_URL}/IT-sqm_value_advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          address: 'Roma, Via del Corso 1',
          for: PROPERTY_TYPES.NEGOZI,
          type: 'sale'
        })
      });

      // 401/403 = chiave non valida, 200/400/404 = chiave valida (ma magari indirizzo non trovato)
      return response.status !== 401 && response.status !== 403;
    } catch (error) {
      console.warn('Errore test OpenAPI.it API Key:', error);
      return false;
    }
  },

  /**
   * Ottiene la quotazione immobiliare per un indirizzo
   */
  async getValuation(
    apiKey: string,
    request: ValuationRequest
  ): Promise<OpenApiValuationResponse> {
    if (!apiKey) {
      throw new Error('OpenAPI.it API Key non configurata');
    }

    const response = await fetch(`${OPENAPI_BASE_URL}/IT-sqm_value_advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        address: request.address,
        for: request.propertyType,
        type: request.transactionType
      })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('API Key OpenAPI.it non valida o scaduta');
      }
      if (response.status === 404) {
        throw new Error('Indirizzo non trovato nel database OMI');
      }
      if (response.status === 429) {
        throw new Error('Limite chiamate API raggiunto');
      }

      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || `Errore API OpenAPI.it: ${response.status}`
      );
    }

    const result = await response.json();

    return {
      success: true,
      data: result.data || result
    };
  },

  /**
   * Calcola il valore stimato di un immobile
   */
  calculatePropertyValue(
    quotation: OpenApiQuotation,
    surfaceArea: number
  ): { min: number; med: number; max: number } {
    return {
      min: Math.round(quotation.min * surfaceArea),
      med: Math.round(quotation.med * surfaceArea),
      max: Math.round(quotation.max * surfaceArea)
    };
  },

  /**
   * Formatta il valore in Euro
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },

  /**
   * Ottiene il label del tipo di proprietà
   */
  getPropertyTypeLabel(typeId: number): string {
    return PROPERTY_TYPE_LABELS[typeId] || 'Sconosciuto';
  }
};

export default openApiRealEstateService;
