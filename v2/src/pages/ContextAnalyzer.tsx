import { useState, useEffect } from 'react';
import { MapPin, Search, Sparkles, ArrowRight, CheckCircle, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Stepper } from '../components/ui/Stepper';
import { POIMap, POIMarker } from '../components/maps/POIMap';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { GeminiService } from '../services/api/gemini';
import { toast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES_CONFIG, getCategoryNames, getCategoryConfig } from '../config/brands';
import { brandMatcher, POIClassification } from '../utils/brandMatcher';

interface EnrichedPOI {
  id: string;
  name: string;
  type: string;
  category: string;
  address: string;
  distance: number;
  rating?: number;
  position?: {
    lat: number;
    lng: number;
  };
  classification: POIClassification;
}

interface CategoryStats {
  name: string;
  count: number;
  brandCount: number;
  localCount: number;
  icon: string;
  color: string;
}

export const ContextAnalyzer = () => {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const currentAnalysis = useAnalysisStore((state) => state.currentAnalysis);
  const setContext = useAnalysisStore((state) => state.setContext);
  const createNewAnalysis = useAnalysisStore((state) => state.createNewAnalysis);

  const [address, setAddress] = useState(currentAnalysis?.address || '');
  const [radius, setRadius] = useState(500);
  const [pois, setPois] = useState<EnrichedPOI[]>([]);
  const [summary, setSummary] = useState(currentAnalysis?.context?.summary || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 45.4642,
    lng: 9.19,
  });

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

  // Calculate category statistics
  const categoryStats: CategoryStats[] = getCategoryNames().map((categoryName) => {
    const categoryPOIs = pois.filter((poi) => poi.category === categoryName);
    const brandPOIs = categoryPOIs.filter((poi) => poi.classification.isBrand);
    const config = getCategoryConfig(categoryName);

    return {
      name: categoryName,
      count: categoryPOIs.length,
      brandCount: brandPOIs.length,
      localCount: categoryPOIs.length - brandPOIs.length,
      icon: config?.icon || '📍',
      color: config?.color || '#gray',
    };
  }).filter((stat) => stat.count > 0);

  // Get POIs for selected category
  const getFilteredPOIs = (): EnrichedPOI[] => {
    if (!selectedCategory) return pois;
    return pois.filter((poi) => poi.category === selectedCategory);
  };

  // Map markers
  const mapMarkers: POIMarker[] = pois.map((poi) => ({
    id: poi.id,
    name: poi.name,
    position: poi.position || mapCenter,
    category: poi.category,
    isBrand: poi.classification.isBrand,
    brandName: poi.classification.brandName,
    address: poi.address,
  }));

  const searchPOIs = async () => {
    if (!address.trim()) {
      toast.error('Inserisci un indirizzo');
      return;
    }

    if (settings.apiKeys.googleMaps) {
      toast.info('Cercando POI con Google Maps...');
      await searchPOIsWithGoogleMaps();
    } else {
      toast.info('Google Maps non configurato. Usando Gemini AI...');
      await searchPOIsWithGemini();
    }
  };

  const categorizeByTypes = (types: string[]): string => {
    // Match types against categories from CATEGORIES_CONFIG
    for (const [categoryName, categoryConfig] of Object.entries(CATEGORIES_CONFIG)) {
      if (types.some((type) => categoryConfig.types.includes(type))) {
        return categoryName;
      }
    }
    return 'Altro';
  };

  const searchPOIsWithGoogleMaps = async () => {
    setIsSearching(true);

    try {
      const isProduction = window.location.hostname !== 'localhost';
      const functionBase = isProduction
        ? '/.netlify/functions'
        : 'http://localhost:8888/.netlify/functions';

      // Step 1: Geocode
      const geocodeUrl = `${functionBase}/geocode?address=${encodeURIComponent(
        address
      )}&apiKey=${settings.apiKeys.googleMaps}`;

      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
        throw new Error('Indirizzo non trovato');
      }

      const location = geocodeData.results[0].geometry.location;
      setMapCenter({ lat: location.lat, lng: location.lng });

      // Step 2: Search nearby places
      const placesUrl = `${functionBase}/places-nearby?location=${location.lat},${location.lng}&radius=${radius}&apiKey=${settings.apiKeys.googleMaps}`;

      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();

      if (placesData.status !== 'OK') {
        throw new Error(placesData.error_message || 'Errore nella ricerca dei POI');
      }

      // Calculate distance
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number => {
        const R = 6371e3;
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

      // Process and enrich POIs
      const enrichedPOIs: EnrichedPOI[] = placesData.results
        .slice(0, 100)
        .map((place: any, index: number) => {
          const category = categorizeByTypes(place.types || []);
          const classification = brandMatcher.classifyPOI(place.name);

          return {
            id: `poi_${index}`,
            name: place.name,
            type: place.types?.[0] || 'store',
            category,
            address: place.vicinity || '',
            distance: calculateDistance(
              location.lat,
              location.lng,
              place.geometry?.location?.lat,
              place.geometry?.location?.lng
            ),
            rating: place.rating,
            position: {
              lat: place.geometry?.location?.lat,
              lng: place.geometry?.location?.lng,
            },
            classification,
          };
        });

      setPois(enrichedPOIs);

      if (!currentAnalysis) {
        createNewAnalysis(address);
      }

      toast.success(
        `${enrichedPOIs.length} POI trovati (${
          enrichedPOIs.filter((p) => p.classification.isBrand).length
        } brand riconosciuti)`
      );
    } catch (error) {
      console.error('Google Maps error:', error);
      toast.warning('Errore con Google Maps. Provo con Gemini AI...');
      await searchPOIsWithGemini();
    } finally {
      setIsSearching(false);
    }
  };

  const searchPOIsWithGemini = async () => {
    setIsSearching(true);

    try {
      const gemini = new GeminiService(settings.apiKeys.gemini);
      const categoryNames = getCategoryNames().join(', ');

      const prompt = `Analizza l'indirizzo: "${address}"

Identifica e elenca tutti i POI (Points of Interest) commerciali probabili nel raggio di ${radius} metri.

Categorie disponibili: ${categoryNames}

Per ogni POI fornisci:
- Nome esatto (brand specifico se riconoscibile)
- Tipo Google Maps (es: restaurant, cafe, store, supermarket)
- Categoria (una delle categorie sopra elencate)
- Indirizzo stimato
- Distanza stimata in metri

Rispondi in formato JSON array:
[
  {
    "name": "Nome POI",
    "type": "tipo",
    "category": "categoria",
    "address": "indirizzo",
    "distance": 100
  }
]

Fornisci almeno 30-50 POI realistici basati sulla zona.`;

      const result = await gemini.generateText(prompt, { model: settings.geminiModel });
      const jsonMatch = result.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('Formato risposta non valido');
      }

      const poisData = JSON.parse(jsonMatch[0]);
      const enrichedPOIs: EnrichedPOI[] = poisData.map((poi: any, index: number) => {
        const classification = brandMatcher.classifyPOI(poi.name);

        return {
          id: `poi_${index}`,
          name: poi.name,
          type: poi.type || 'store',
          category: poi.category || 'Altro',
          address: poi.address || `Vicino a ${address}`,
          distance: poi.distance || 0,
          classification,
        };
      });

      setPois(enrichedPOIs);

      if (!currentAnalysis) {
        createNewAnalysis(address);
      }

      toast.success(
        `${enrichedPOIs.length} POI identificati con AI (${
          enrichedPOIs.filter((p) => p.classification.isBrand).length
        } brand riconosciuti)`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nella ricerca POI');
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
      const brandPOIs = pois.filter((poi) => poi.classification.isBrand);

      const prompt = `Analizza questo contesto commerciale per un immobile a: ${address}

STATISTICHE POI (${pois.length} totali):
- Brand riconosciuti: ${brandPOIs.length}
- Attività locali: ${pois.length - brandPOIs.length}

CATEGORIE:
${categoryStats
  .map(
    (stat) =>
      `- ${stat.icon} ${stat.name}: ${stat.count} (${stat.brandCount} brand, ${stat.localCount} locali)`
  )
  .join('\n')}

BRAND PRINCIPALI:
${brandPOIs
  .slice(0, 20)
  .map((poi) => `- ${poi.classification.brandName} (${poi.distance}m)`)
  .join('\n')}

POI RILEVANTI:
${pois
  .slice(0, 30)
  .map((poi) => `- ${poi.name} (${poi.category}, ${poi.distance}m)`)
  .join('\n')}

Genera una descrizione professionale del quartiere (300-400 parole) che includa:
1. Caratterizzazione generale dell'area
2. Tipologie di attività prevalenti
3. Brand e catene presenti (elenca i principali)
4. Flusso e target clienti probabile
5. Potenziale commerciale dell'area
6. Punti di forza per un'attività commerciale

Scrivi in tono professionale, adatto a un report immobiliare.`;

      const generatedSummary = await gemini.generateText(prompt, {
        model: settings.geminiModel,
      });
      setSummary(generatedSummary);

      setContext({
        pois: pois.map((poi) => ({
          name: poi.name,
          type: poi.type,
          category: poi.category,
          address: poi.address,
          distance: poi.distance,
          rating: poi.rating,
        })),
        summary: generatedSummary,
        brandsPresentCount: brandPOIs.length,
        categories: categoryStats.map((s) => s.name),
      });

      toast.success('Summary generato con successo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore generazione summary');
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

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowCategoryModal(true);
  };

  const handleWhitelist = (poi: EnrichedPOI) => {
    if (poi.classification.brandKey) {
      brandMatcher.addToWhitelist(poi.name, poi.classification.brandKey);
      toast.success(`${poi.name} confermato come ${poi.classification.brandName}`);
      // Re-classify POIs
      setPois(pois.map((p) => (p.id === poi.id ? { ...p, classification: { ...p.classification, isWhitelisted: true } } : p)));
    }
  };

  const handleBlacklist = (poi: EnrichedPOI) => {
    if (poi.classification.brandKey) {
      brandMatcher.addToBlacklist(poi.name, poi.classification.brandKey);
      toast.info(`${poi.name} marcato come locale (non ${poi.classification.brandName})`);
      // Re-classify POIs
      setPois(pois.map((p) => (p.id === poi.id ? { ...p, classification: { isBrand: false } } : p)));
    }
  };

  return (
    <PageContainer
      title="Analisi Contesto"
      subtitle="Scopri POI e brand presenti nel quartiere"
      icon={MapPin}
    >
      <div className="space-y-6">
        <Stepper steps={steps} currentStep="context" />

        {/* Address Input */}
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

        {/* Google Map */}
        {pois.length > 0 && (
          <Card padding="md">
            <CardHeader
              title="Mappa POI"
              subtitle={`${pois.length} punti di interesse trovati`}
              icon={MapPin}
            />
            <div className="mt-4">
              <POIMap
                center={mapCenter}
                markers={mapMarkers}
                selectedCategory={selectedCategory || undefined}
                zoom={15}
              />
            </div>
          </Card>
        )}

        {/* Category Stats */}
        {categoryStats.length > 0 && (
          <Card padding="md">
            <CardHeader
              title="Categorie POI"
              subtitle="Clicca su una categoria per vedere i dettagli"
              icon={MapPin}
            />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryStats.map((stat) => (
                <button
                  key={stat.name}
                  onClick={() => handleCategoryClick(stat.name)}
                  className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
                  style={{ borderColor: stat.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <Badge variant="default" style={{ backgroundColor: stat.color }}>
                      {stat.count}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{stat.name}</h4>
                  <p className="text-sm text-gray-600">
                    {stat.brandCount} brand • {stat.localCount} locali
                  </p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Category Modal */}
        {showCategoryModal && selectedCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {getCategoryConfig(selectedCategory)?.icon} {selectedCategory}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getFilteredPOIs().length} POI in questa categoria
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setSelectedCategory(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-3">
                  {getFilteredPOIs().map((poi) => (
                    <div
                      key={poi.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{poi.name}</h4>
                            {poi.classification.isBrand ? (
                              <Badge variant="info">
                                🏢 {poi.classification.brandName}
                              </Badge>
                            ) : (
                              <Badge variant="default">📍 Locale</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{poi.address}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm text-gray-500">
                              {poi.distance}m
                            </span>
                            {poi.rating && (
                              <span className="text-sm text-gray-500">
                                ⭐ {poi.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        {poi.classification.isBrand &&
                          !poi.classification.isWhitelisted &&
                          poi.classification.matchType === 'fuzzy' && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleWhitelist(poi)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Conferma brand"
                              >
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleBlacklist(poi)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Marca come locale"
                              >
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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

        {/* Next Step */}
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
