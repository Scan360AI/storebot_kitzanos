import { useState, useEffect } from 'react';
import { MapPin, Search, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Stepper } from '../components/ui/Stepper';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { GeminiService } from '../services/api/gemini';
import { toast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import type { POI } from '../types';

export const ContextAnalyzer = () => {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const currentAnalysis = useAnalysisStore((state) => state.currentAnalysis);
  const setContext = useAnalysisStore((state) => state.setContext);
  const createNewAnalysis = useAnalysisStore((state) => state.createNewAnalysis);

  const [address, setAddress] = useState(currentAnalysis?.address || '');
  const [radius, setRadius] = useState(500);
  const [pois, setPois] = useState<POI[]>(currentAnalysis?.context?.pois || []);
  const [summary, setSummary] = useState(currentAnalysis?.context?.summary || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const steps = [
    { id: 'context', label: 'Analisi Contesto', completed: !!currentAnalysis?.context },
    { id: 'property', label: 'Dati Immobile', completed: !!currentAnalysis?.property },
    { id: 'brands', label: 'Brand Matching', completed: !!currentAnalysis?.brandMatching },
    { id: 'report', label: 'Report Finale', completed: currentAnalysis?.status === 'completed' },
  ];

  useEffect(() => {
    if (!currentAnalysis && address) {
      createNewAnalysis(address);
    }
  }, []);

  const searchPOIs = async () => {
    if (!address.trim()) {
      toast.error('Inserisci un indirizzo');
      return;
    }

    if (!settings.apiKeys.googleMaps) {
      toast.warning('Google Maps API non configurata. Cercando POI con Gemini AI...');
      await searchPOIsWithGemini();
      return;
    }

    setIsSearching(true);

    try {
      // Geocode the address
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${settings.apiKeys.googleMaps}`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
        throw new Error('Indirizzo non trovato');
      }

      const location = geocodeData.results[0].geometry.location;

      // Search for nearby places
      const placesResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&key=${settings.apiKeys.googleMaps}`
      );
      const placesData = await placesResponse.json();

      if (placesData.status !== 'OK') {
        throw new Error(placesData.error_message || 'Errore nella ricerca dei POI');
      }

      const discoveredPois: POI[] = placesData.results.slice(0, 50).map((place: any) => ({
        name: place.name,
        type: place.types[0] || 'store',
        category: categorizePlace(place.types),
        address: place.vicinity,
        distance: calculateDistance(
          location.lat,
          location.lng,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
        rating: place.rating,
      }));

      setPois(discoveredPois);

      if (!currentAnalysis) {
        createNewAnalysis(address);
      }

      toast.success(`${discoveredPois.length} POI trovati nel raggio di ${radius}m`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nella ricerca POI');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchPOIsWithGemini = async () => {
    setIsSearching(true);

    try {
      const gemini = new GeminiService(settings.apiKeys.gemini);
      const prompt = `Analizza l'indirizzo: "${address}"

Identifica e elenca tutti i POI (Points of Interest) commerciali probabili nel raggio di ${radius} metri da questo indirizzo.

Per ogni POI fornisci:
- Nome esatto (brand specifico se riconoscibile, altrimenti descrizione generica)
- Tipo (es: restaurant, cafe, store, supermarket, bank, pharmacy, etc.)
- Categoria (es: food_beverage, retail, services, etc.)
- Distanza stimata in metri

Rispondi in formato JSON array:
[
  {
    "name": "Nome POI",
    "type": "tipo",
    "category": "categoria",
    "distance": 100
  }
]

Fornisci almeno 20-30 POI realistici basati sulla zona geografica.`;

      const result = await gemini.generateText(prompt, { model: settings.geminiModel });
      const jsonMatch = result.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('Formato risposta non valido');
      }

      const poisData = JSON.parse(jsonMatch[0]);
      const discoveredPois: POI[] = poisData.map((poi: any) => ({
        name: poi.name,
        type: poi.type || 'store',
        category: poi.category || 'retail',
        address: `Vicino a ${address}`,
        distance: poi.distance || 0,
      }));

      setPois(discoveredPois);

      if (!currentAnalysis) {
        createNewAnalysis(address);
      }

      toast.success(`${discoveredPois.length} POI identificati con AI`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nella ricerca POI con AI');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const generateSummary = async () => {
    if (pois.length === 0) {
      toast.error('Cerca prima i POI nel quartiere');
      return;
    }

    setIsGeneratingSummary(true);

    try {
      const gemini = new GeminiService(settings.apiKeys.gemini);

      const brandsPresentCount = pois.filter((poi) =>
        poi.name.match(/^[A-Z]/)
      ).length;

      const categoryCounts = pois.reduce((acc, poi) => {
        acc[poi.category] = (acc[poi.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const prompt = `Analizza questo contesto commerciale per un immobile situato a: ${address}

POI TROVATI (${pois.length} totali):
${pois
  .slice(0, 30)
  .map((poi) => `- ${poi.name} (${poi.category}, ${poi.distance}m)`)
  .join('\n')}

STATISTICHE:
- Brand riconoscibili: ${brandsPresentCount}
- Categorie principali: ${Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([cat, count]) => `${cat} (${count})`)
  .join(', ')}

Genera una descrizione professionale del quartiere (300-400 parole) che includa:
1. Caratterizzazione generale dell'area (residenziale, commerciale, mista)
2. Tipologie di attività prevalenti
3. Brand e catene presenti (elenca i principali)
4. Flusso e target clienti probabile
5. Potenziale commerciale dell'area
6. Punti di forza per un'attività commerciale

Scrivi in tono professionale, adatto a un report immobiliare.`;

      const generatedSummary = await gemini.generateText(prompt, { model: settings.geminiModel });
      setSummary(generatedSummary);

      // Save to store
      setContext({
        pois,
        summary: generatedSummary,
        brandsPresentCount,
        categories: Object.keys(categoryCounts),
      });

      toast.success('Summary generato con successo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nella generazione summary');
      console.error(error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleNext = () => {
    if (!summary) {
      toast.error('Genera prima il summary del quartiere');
      return;
    }
    navigate('/property');
  };

  const categorizePlace = (types: string[]): string => {
    if (types.some((t) => ['restaurant', 'cafe', 'bar', 'food'].includes(t)))
      return 'food_beverage';
    if (types.some((t) => ['store', 'shopping_mall', 'clothing_store'].includes(t)))
      return 'retail';
    if (types.some((t) => ['supermarket', 'grocery'].includes(t))) return 'supermarket';
    if (types.some((t) => ['bank', 'atm'].includes(t))) return 'finance';
    if (types.some((t) => ['pharmacy', 'health'].includes(t))) return 'health';
    return 'other';
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      food_beverage: 'warning',
      retail: 'info',
      supermarket: 'success',
      finance: 'default',
      health: 'error',
    };
    return variants[category] || 'default';
  };

  return (
    <PageContainer
      title="Analisi Contesto"
      subtitle="Scopri POI e brand presenti nel quartiere"
      icon={MapPin}
    >
      <div className="space-y-6">
        {/* Stepper */}
        <Stepper steps={steps} currentStep="context" />

        {/* Address input */}
        <Card padding="md">
          <CardHeader
            title="Indirizzo Immobile"
            subtitle="Inserisci l'indirizzo da analizzare"
            icon={MapPin}
          />
          <div className="mt-4 space-y-4">
            <Input
              label="Indirizzo completo"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="es. Corso Buenos Aires 23, Milano"
              icon={MapPin}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raggio di ricerca (metri)
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={250}>250m (zona immediata)</option>
                <option value={500}>500m (consigliato)</option>
                <option value={1000}>1000m (area estesa)</option>
              </select>
            </div>
            <Button
              variant="primary"
              icon={Search}
              onClick={searchPOIs}
              loading={isSearching}
              disabled={!address.trim()}
            >
              {isSearching ? 'Ricerca in corso...' : 'Cerca POI'}
            </Button>
          </div>
        </Card>

        {/* POI Results */}
        {pois.length > 0 && (
          <Card padding="md">
            <CardHeader
              title="POI Trovati"
              subtitle={`${pois.length} punti di interesse nel raggio di ${radius}m`}
              icon={MapPin}
              action={<Badge variant="success">{pois.length} POI</Badge>}
            />
            <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
              {pois.map((poi, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{poi.name}</h4>
                    <p className="text-sm text-gray-600">{poi.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getCategoryBadgeVariant(poi.category)}>
                      {poi.category}
                    </Badge>
                    <span className="text-sm text-gray-500">{poi.distance}m</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Generate Summary */}
        {pois.length > 0 && (
          <Card padding="md">
            <CardHeader
              title="Summary Quartiere"
              subtitle="Genera una descrizione AI del contesto commerciale"
              icon={Sparkles}
            />
            <div className="mt-4 space-y-4">
              {summary ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <h4 className="font-semibold text-green-900">Summary Generato</h4>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">{summary}</p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  icon={Sparkles}
                  onClick={generateSummary}
                  loading={isGeneratingSummary}
                >
                  {isGeneratingSummary ? 'Generazione in corso...' : 'Genera Summary AI'}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Next step */}
        {summary && (
          <div className="flex justify-end">
            <Button variant="primary" icon={ArrowRight} onClick={handleNext}>
              Continua con Dati Immobile
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
