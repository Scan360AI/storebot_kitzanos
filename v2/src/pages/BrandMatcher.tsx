import { useState } from 'react';
import { GitCompareArrows, Sparkles, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Stepper } from '../components/ui/Stepper';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { GeminiService } from '../services/api/gemini';
import { toast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import type { BrandMatch } from '../types';

export const BrandMatcher = () => {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const currentAnalysis = useAnalysisStore((state) => state.currentAnalysis);
  const setBrandMatching = useAnalysisStore((state) => state.setBrandMatching);

  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<BrandMatch[]>(currentAnalysis?.brandMatching || []);
  const [selectedBrand, setSelectedBrand] = useState<BrandMatch | null>(null);
  const [excludedBrands, setExcludedBrands] = useState<string[]>([]);

  const steps = [
    { id: 'context', label: 'Analisi Contesto', completed: !!currentAnalysis?.context },
    { id: 'property', label: 'Dati Immobile', completed: !!currentAnalysis?.property },
    { id: 'brands', label: 'Brand Matching', completed: !!currentAnalysis?.brandMatching },
    { id: 'report', label: 'Report Finale', completed: currentAnalysis?.status === 'completed' },
  ];

  const runMatching = async () => {
    if (!currentAnalysis?.context || !currentAnalysis?.property) {
      toast.error('Completa prima Analisi Contesto e Dati Immobile');
      return;
    }

    setIsMatching(true);

    try {
      const gemini = new GeminiService(settings.apiKeys.gemini);

      // Extract existing brands from context
      const existingBrands = currentAnalysis.context.pois
        .filter((poi) => poi.name && poi.name.match(/^[A-Z]/))
        .map((poi) => poi.name);

      setExcludedBrands(existingBrands);

      const prompt = `Sei un esperto di real estate commerciale. Analizza questi dati e suggerisci brand SPECIFICI compatibili.

📍 CONTESTO QUARTIERE:
${currentAnalysis.context.summary}

POI PRESENTI (${currentAnalysis.context.pois.length}):
${currentAnalysis.context.pois
  .slice(0, 30)
  .map((poi) => `- ${poi.name} (${poi.category})`)
  .join('\n')}

🏢 DATI IMMOBILE:
- Indirizzo: ${currentAnalysis.property.address}
- Superficie: ${currentAnalysis.property.surfaceArea} mq
- Prezzo: ${currentAnalysis.property.price || 'N/D'}
- Vetrine: ${currentAnalysis.property.windows}
- Piano: ${currentAnalysis.property.floor || 'N/D'}
- Condizioni: ${currentAnalysis.property.condition || 'N/D'}

⚠️ BRAND GIÀ PRESENTI NEL QUARTIERE (DA ESCLUDERE ASSOLUTAMENTE):
${existingBrands.length > 0 ? existingBrands.map((b) => `- ${b}`).join('\n') : 'Nessuno'}

📋 ISTRUZIONI CRITICHE:

1. ⚠️ NON suggerire MAI brand già presenti nell'elenco sopra
2. ⚠️ Suggerisci SOLO brand SPECIFICI con nome proprio (es: "Esselunga", "Leroy Merlin", "MediaWorld")
3. ⚠️ EVITA categorie generiche (es: "Supermercato generico", "Catena alimentare", "Negozio abbigliamento")
4. Analizza dimensioni, posizione, e caratteristiche dell'immobile
5. Considera brand compatibili con l'area e il target locale
6. Suggerisci 8-12 brand diversificati per categoria

📊 FORMATO RISPOSTA (JSON):

[
  {
    "brandName": "Nome Brand Preciso",
    "category": "categoria",
    "compatibility": 85,
    "reasons": [
      "Motivo specifico 1",
      "Motivo specifico 2",
      "Motivo specifico 3"
    ],
    "targetAudience": "Target clienti del brand",
    "estimatedInvestment": "Range investimento stimato",
    "notes": "Note aggiuntive specifiche"
  }
]

ESEMPIO CORRETTO:
{
  "brandName": "Esselunga",
  "category": "Supermercati",
  "compatibility": 88,
  "reasons": [
    "Superficie 250mq ideale per Esselunga Express format",
    "Zona residenziale ad alto reddito, target perfetto Esselunga",
    "Assenza supermercati premium nel raggio 500m"
  ],
  ...
}

ESEMPIO SBAGLIATO (DA EVITARE):
{
  "brandName": "Supermercato di fascia media", ❌
  "brandName": "Catena retail italiana", ❌
  "brandName": "Carrefour" (se già presente nei POI) ❌
}

Genera ora i suggerimenti in formato JSON.`;

      const result = await gemini.generateText(prompt, { model: settings.geminiModel });
      const jsonMatch = result.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('Formato risposta non valido');
      }

      const matchesData: BrandMatch[] = JSON.parse(jsonMatch[0]);

      // Validate that no generic brands are suggested
      const validMatches = matchesData.filter((match) => {
        const isGeneric =
          match.brandName.toLowerCase().includes('generico') ||
          match.brandName.toLowerCase().includes('catena') ||
          match.brandName.toLowerCase().includes('negozio') ||
          !match.brandName.match(/^[A-Z]/);

        const isExcluded = existingBrands.some(
          (existing) =>
            existing.toLowerCase() === match.brandName.toLowerCase() ||
            match.brandName.toLowerCase().includes(existing.toLowerCase())
        );

        return !isGeneric && !isExcluded;
      });

      if (validMatches.length === 0) {
        throw new Error('Nessun brand specifico suggerito. Riprova la generazione.');
      }

      setMatches(validMatches);
      setBrandMatching(validMatches);
      toast.success(`${validMatches.length} brand compatibili trovati`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nel matching');
      console.error(error);
    } finally {
      setIsMatching(false);
    }
  };

  const handleNext = () => {
    if (matches.length === 0) {
      toast.error('Esegui prima il brand matching');
      return;
    }
    navigate('/report');
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCompatibilityBadge = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <PageContainer
      title="Brand Matching"
      subtitle="Suggerimenti brand compatibili con esclusione automatica"
      icon={GitCompareArrows}
    >
      <div className="space-y-6">
        {/* Stepper */}
        <Stepper steps={steps} currentStep="brands" />

        {/* Prerequisites Check */}
        {(!currentAnalysis?.context || !currentAnalysis?.property) && (
          <Card padding="md">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Dati mancanti
                </h3>
                <p className="text-gray-600 mb-4">
                  Prima di eseguire il brand matching, completa:
                </p>
                <div className="space-y-2">
                  {!currentAnalysis?.context && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Analisi Contesto Quartiere</span>
                    </div>
                  )}
                  {!currentAnalysis?.property && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Dati Immobile</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Excluded Brands */}
        {excludedBrands.length > 0 && (
          <Card padding="md">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Brand già presenti nel quartiere (esclusi automaticamente)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {excludedBrands.slice(0, 15).map((brand, index) => (
                    <Badge key={index} variant="warning">
                      {brand}
                    </Badge>
                  ))}
                  {excludedBrands.length > 15 && (
                    <Badge variant="default">+{excludedBrands.length - 15} altri</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Run Matching */}
        {currentAnalysis?.context && currentAnalysis?.property && (
          <Card padding="md">
            <CardHeader
              title="Esegui Matching"
              subtitle="Genera suggerimenti brand con AI"
              icon={Sparkles}
            />
            <div className="mt-4">
              <Button
                variant="primary"
                icon={Sparkles}
                onClick={runMatching}
                loading={isMatching}
              >
                {isMatching ? 'Matching in corso...' : 'Esegui Brand Matching'}
              </Button>
            </div>
          </Card>
        )}

        {/* Results */}
        {matches.length > 0 && (
          <>
            <Card padding="md">
              <CardHeader
                title="Brand Suggeriti"
                subtitle={`${matches.length} brand compatibili trovati`}
                icon={GitCompareArrows}
                action={<Badge variant="success">{matches.length} suggerimenti</Badge>}
              />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match, index) => (
                <Card
                  key={index}
                  hover
                  padding="md"
                  onClick={() => setSelectedBrand(selectedBrand?.brandName === match.brandName ? null : match)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {match.brandName}
                        </h3>
                        <p className="text-sm text-gray-600">{match.category}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full font-semibold ${getCompatibilityColor(match.compatibility)}`}>
                        {match.compatibility}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getCompatibilityBadge(match.compatibility) as any}>
                        Compatibilità: {match.compatibility}%
                      </Badge>
                    </div>

                    {selectedBrand?.brandName === match.brandName && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Matching Reasons - Highlighted in green */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            🎯 Ragioni del matching
                          </h4>
                          <ul className="space-y-2">
                            {match.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                                <span className="text-green-600 font-bold">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Target Audience */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            👥 Target Clienti
                          </h4>
                          <p className="text-sm text-gray-700">{match.targetAudience}</p>
                        </div>

                        {/* Investment */}
                        {match.estimatedInvestment && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              💰 Investimento Stimato
                            </h4>
                            <p className="text-sm text-gray-700">{match.estimatedInvestment}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {match.notes && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              📝 Note
                            </h4>
                            <p className="text-sm text-gray-700">{match.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Next step */}
        {matches.length > 0 && (
          <div className="flex justify-end">
            <Button variant="primary" icon={ArrowRight} onClick={handleNext}>
              Continua con Report Finale
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
