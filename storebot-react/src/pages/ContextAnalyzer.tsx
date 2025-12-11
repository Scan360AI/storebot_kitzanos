import { useState, useEffect, useCallback } from 'react';
import {
  MapPinned,
  Search,
  Download,
  Building,
  Coffee,
  ShoppingBag,
  Utensils,
  Store,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Check,
  X,
  Trash2
} from 'lucide-react';

// Dichiarazione per Google Maps API (caricato dinamicamente)
declare const google: any;
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { useAppStore } from '../store/appStore';
import { useGemini } from '../hooks/useGemini';
import { brandService } from '../services/brand.service';
import type { POI, ContextAnalysis, BrandClassification } from '../types';

// Categorie POI
const POI_CATEGORIES = [
  { value: 'all', label: 'Tutte le categorie' },
  { value: 'brand', label: 'Solo Brand' },
  { value: 'local', label: 'Solo Locali' },
  { value: 'restaurant', label: 'Ristoranti' },
  { value: 'cafe', label: 'Bar & Caffè' },
  { value: 'store', label: 'Negozi' },
  { value: 'shopping_mall', label: 'Centri Commerciali' },
  { value: 'bank', label: 'Banche' },
  { value: 'gym', label: 'Palestre' },
  { value: 'supermarket', label: 'Supermercati' },
  { value: 'pharmacy', label: 'Farmacie' },
  { value: 'hotel', label: 'Hotel' }
];

const categoryIcons: Record<string, React.ReactNode> = {
  restaurant: <Utensils size={16} />,
  cafe: <Coffee size={16} />,
  store: <Store size={16} />,
  shopping_mall: <ShoppingBag size={16} />,
  default: <Building size={16} />
};

export function ContextAnalyzer() {
  const { currentAddress, setCurrentAddress, contextAnalysis, setContextAnalysis, apiKeys, addToast } = useAppStore();
  const { generate, isGenerating } = useGemini({ temperature: 0.5 });

  const [address, setAddress] = useState(currentAddress || '');
  const [searchRadius, setSearchRadius] = useState(500);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pois, setPois] = useState<POI[]>(contextAnalysis?.pois || []);
  const [isSearching, setIsSearching] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(contextAnalysis?.analysis || '');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    contextAnalysis?.coordinates || null
  );

  useEffect(() => {
    if (!apiKeys.gmaps) {
      addToast({ message: 'Configura la Google Maps API Key per usare questa funzione', type: 'warning' });
    }
  }, [apiKeys.gmaps]);

  // Funzione per geocodificare l'indirizzo
  const geocodeAddress = useCallback(async (addr: string): Promise<{ lat: number; lng: number } | null> => {
    if (!apiKeys.gmaps || !window.google?.maps) {
      // Carica Google Maps SDK se non presente
      if (!window.google?.maps && apiKeys.gmaps) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKeys.gmaps}&libraries=places`;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
    }

    if (!window.google?.maps) {
      addToast({ message: 'Google Maps non disponibile', type: 'error' });
      return null;
    }

    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address: addr }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          addToast({ message: 'Indirizzo non trovato', type: 'error' });
          resolve(null);
        }
      });
    });
  }, [apiKeys.gmaps, addToast]);

  // Classifica POI con brand matching
  const classifyPOI = useCallback((place: any): POI => {
    const classification = brandService.classifyPlace(
      place.name || 'Sconosciuto',
      place.types || [],
      undefined
    );

    return {
      name: place.name || 'Sconosciuto',
      originalName: place.name,
      types: place.types || [],
      category: place.types?.[0] || 'unknown',
      distance: 0,
      lat: place.geometry?.location?.lat() || 0,
      lng: place.geometry?.location?.lng() || 0,
      address: place.vicinity,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      googlePlaceId: place.place_id,
      classification
    };
  }, []);

  // Funzione per cercare POI
  const searchNearbyPOIs = useCallback(async (coords: { lat: number; lng: number }) => {
    if (!window.google?.maps?.places) {
      addToast({ message: 'Google Places non disponibile', type: 'error' });
      return [];
    }

    const service = new google.maps.places.PlacesService(document.createElement('div'));

    return new Promise<POI[]>((resolve) => {
      service.nearbySearch(
        {
          location: new google.maps.LatLng(coords.lat, coords.lng),
          radius: searchRadius,
          type: selectedCategory === 'all' || selectedCategory === 'brand' || selectedCategory === 'local'
            ? undefined
            : selectedCategory
        },
        (results: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Classifica ogni POI
            const poiList: POI[] = results.map((place: any) => classifyPOI(place));

            // Calcola distanze
            poiList.forEach((poi) => {
              const R = 6371000;
              const dLat = ((poi.lat - coords.lat) * Math.PI) / 180;
              const dLon = ((poi.lng - coords.lng) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((coords.lat * Math.PI) / 180) *
                  Math.cos((poi.lat * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              poi.distance = Math.round(R * c);
            });

            // Ordina: brand prima, poi per distanza
            poiList.sort((a, b) => {
              const aIsBrand = a.classification?.type === 'brand';
              const bIsBrand = b.classification?.type === 'brand';
              if (aIsBrand && !bIsBrand) return -1;
              if (!aIsBrand && bIsBrand) return 1;
              return a.distance - b.distance;
            });

            resolve(poiList);
          } else {
            resolve([]);
          }
        }
      );
    });
  }, [searchRadius, selectedCategory, classifyPOI, addToast]);

  // Cerca POI
  const handleSearch = async () => {
    if (!address.trim()) {
      addToast({ message: 'Inserisci un indirizzo', type: 'error' });
      return;
    }

    setIsSearching(true);
    setCurrentAddress(address.trim());

    try {
      const coords = await geocodeAddress(address);
      if (!coords) {
        setIsSearching(false);
        return;
      }

      setCoordinates(coords);
      const foundPois = await searchNearbyPOIs(coords);
      setPois(foundPois);

      // Conta brand
      const brandCount = foundPois.filter(p => p.classification?.type === 'brand').length;
      const localCount = foundPois.length - brandCount;

      // Salva nel context
      const contextData: ContextAnalysis = {
        address: address.trim(),
        coordinates: coords,
        pois: foundPois,
        timestamp: new Date()
      };
      setContextAnalysis(contextData);

      addToast({
        message: `Trovati ${foundPois.length} POI (${brandCount} brand, ${localCount} locali)`,
        type: 'success'
      });
    } catch (error) {
      addToast({ message: 'Errore durante la ricerca', type: 'error' });
    }

    setIsSearching(false);
  };

  // Conferma brand association
  const handleConfirmBrand = (poi: POI) => {
    if (poi.classification?.brandKeyFromConfig && poi.originalName) {
      brandService.confirmBrandAssociation(poi.originalName, poi.classification.brandKeyFromConfig);

      // Aggiorna classificazione locale
      setPois(prevPois => prevPois.map(p => {
        if (p.googlePlaceId === poi.googlePlaceId && p.classification) {
          return {
            ...p,
            classification: {
              ...p.classification,
              matchMethod: 'user_confirmed',
              isUserConfirmed: true
            }
          };
        }
        return p;
      }));

      addToast({ message: 'Brand confermato', type: 'success' });
    }
  };

  // Rimuovi brand association
  const handleRemoveBrand = (poi: POI) => {
    if (poi.classification?.brandKeyFromConfig && poi.originalName) {
      brandService.removeBrandAssociation(poi.originalName, poi.classification.brandKeyFromConfig);

      // Aggiorna classificazione locale
      setPois(prevPois => prevPois.map(p => {
        if (p.googlePlaceId === poi.googlePlaceId) {
          return {
            ...p,
            classification: {
              type: 'local',
              assignedMacroCategoryKey: p.classification?.assignedMacroCategoryKey || 'Negozi e Shopping',
              brandKeyFromConfig: null,
              brandDisplayName: null,
              brandConfigCategory: null,
              brandConfigSubCategory: null,
              matchMethod: null,
              similarityScore: null,
              isUserConfirmed: false
            } as BrandClassification
          };
        }
        return p;
      }));

      addToast({ message: 'Brand rimosso', type: 'success' });
    }
  };

  // Pulisci liste
  const handleClearLists = () => {
    if (confirm('Vuoi pulire sia la whitelist che la blacklist?')) {
      brandService.clearAllLists();
      addToast({ message: 'Liste pulite. Esegui una nuova ricerca.', type: 'info' });
    }
  };

  // Genera analisi AI
  const handleGenerateAnalysis = async () => {
    if (pois.length === 0) {
      addToast({ message: 'Cerca prima i punti di interesse', type: 'warning' });
      return;
    }

    // Separa brand da locali per analisi più dettagliata
    const brands = pois.filter(p => p.classification?.type === 'brand');
    const locals = pois.filter(p => p.classification?.type !== 'brand');

    const brandsSummary = brands
      .slice(0, 15)
      .map((p) => `- ${p.classification?.brandDisplayName || p.name} (${p.classification?.brandConfigCategory}, ${p.distance}m)`)
      .join('\n');

    const localsSummary = locals
      .slice(0, 10)
      .map((p) => `- ${p.name} (${p.category}, ${p.distance}m)`)
      .join('\n');

    const prompt = `Analizza il contesto commerciale di questo quartiere basandoti sui seguenti punti di interesse trovati nel raggio di ${searchRadius}m dall'indirizzo "${address}":

BRAND RICONOSCIUTI (${brands.length}):
${brandsSummary || 'Nessun brand riconosciuto'}

ATTIVITÀ LOCALI (${locals.length}):
${localsSummary || 'Nessuna attività locale'}

Fornisci:
1. PROFILO DEL QUARTIERE - Una descrizione della vocazione commerciale
2. CARATTERE SOCIO-ECONOMICO - Target demografico probabile basato sui brand presenti
3. PUNTI DI FORZA - Per un'attività commerciale
4. POTENZIALI CRITICITÀ - Aspetti da considerare
5. RACCOMANDAZIONI - Tipologie di business consigliate e sconsigliate

Rispondi in italiano in formato markdown strutturato.`;

    const result = await generate(prompt);
    if (result) {
      setAnalysis(result);
      setShowAnalysis(true);
      // Aggiorna context con analisi
      if (coordinates) {
        setContextAnalysis({
          address,
          coordinates,
          pois,
          analysis: result,
          timestamp: new Date()
        });
      }
    }
  };

  // Export Excel (CSV)
  const handleExport = () => {
    if (pois.length === 0) return;

    const headers = ['Nome', 'Tipo', 'Brand', 'Categoria Brand', 'Sottocategoria', 'Distanza (m)', 'Indirizzo', 'Rating', 'Recensioni', 'Confermato'];
    const rows = pois.map((p) => [
      p.name,
      p.classification?.type === 'brand' ? 'BRAND' : 'LOCALE',
      p.classification?.brandDisplayName || '',
      p.classification?.brandConfigCategory || '',
      p.classification?.brandConfigSubCategory || '',
      p.distance,
      p.address || '',
      p.rating || '',
      p.user_ratings_total || '',
      p.classification?.isUserConfirmed ? 'SI' : 'NO'
    ]);

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `context_analysis_${address.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || categoryIcons.default;
  };

  // Filtra POI
  const filteredPois = selectedCategory === 'all'
    ? pois
    : selectedCategory === 'brand'
    ? pois.filter((p) => p.classification?.type === 'brand')
    : selectedCategory === 'local'
    ? pois.filter((p) => p.classification?.type !== 'brand')
    : pois.filter((p) => p.types.includes(selectedCategory));

  // Statistiche
  const totalBrands = pois.filter(p => p.classification?.type === 'brand').length;
  const totalLocals = pois.length - totalBrands;

  // Render brand indicator
  const renderBrandIndicator = (poi: POI) => {
    if (poi.classification?.type !== 'brand') return null;

    const isPerfectMatch = poi.classification.matchMethod === 'exact_match' ||
                          poi.classification.matchMethod === 'whitelist_match' ||
                          poi.classification.isUserConfirmed;

    if (isPerfectMatch) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700" title="Brand confermato">
          <CheckCircle size={12} />
          BRAND
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <HelpCircle size={12} />
        BRAND?
        <button
          onClick={(e) => { e.stopPropagation(); handleConfirmBrand(poi); }}
          className="ml-1 p-0.5 hover:bg-green-200 rounded"
          title="Conferma brand"
        >
          <Check size={12} className="text-green-600" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleRemoveBrand(poi); }}
          className="p-0.5 hover:bg-red-200 rounded"
          title="Rimuovi brand"
        >
          <X size={12} className="text-red-600" />
        </button>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <MapPinned className="text-blue-500" />
          Analisi Contesto Quartiere
        </h1>
        <p className="text-gray-500 mt-2">
          Esplora i dintorni, i POI e la vocazione commerciale del quartiere con riconoscimento brand
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Indirizzo"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="es. Via Roma 123, Milano"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label className="label">Raggio (m)</label>
              <select
                className="input"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
              >
                <option value={250}>250m</option>
                <option value={500}>500m</option>
                <option value={1000}>1km</option>
                <option value={2000}>2km</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                loading={isSearching}
                icon={<Search size={18} />}
                className="w-full"
              >
                Cerca
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {pois.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Totale POI</p>
              <p className="text-2xl font-bold text-gray-900">{pois.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600">Brand Riconosciuti</p>
              <p className="text-2xl font-bold text-green-700">{totalBrands}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600">Attività Locali</p>
              <p className="text-2xl font-bold text-blue-700">{totalLocals}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Raggio</p>
              <p className="text-2xl font-bold text-gray-900">{searchRadius}m</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={POI_CATEGORIES}
              className="w-48"
            />
            <Button
              variant="secondary"
              onClick={handleGenerateAnalysis}
              loading={isGenerating}
              icon={<Sparkles size={18} />}
            >
              Genera Analisi AI
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              icon={<Download size={18} />}
            >
              Esporta CSV
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearLists}
              icon={<Trash2 size={18} />}
            >
              Pulisci Liste
            </Button>
          </div>

          {/* AI Analysis */}
          {analysis && (
            <Card className="mb-6">
              <CardHeader>
                <div
                  className="cursor-pointer flex items-center"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                >
                  <CardTitle icon={<Sparkles className="text-purple-500" size={20} />}>
                    Analisi AI del Quartiere
                  </CardTitle>
                  {showAnalysis ? <ChevronUp size={20} className="ml-auto" /> : <ChevronDown size={20} className="ml-auto" />}
                </div>
              </CardHeader>
              {showAnalysis && (
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* POI List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Punti di Interesse ({filteredPois.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredPois.map((poi, index) => (
                  <div
                    key={poi.googlePlaceId || index}
                    className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 border ${
                      poi.classification?.type === 'brand'
                        ? 'border-green-200 bg-green-50/30'
                        : 'border-gray-100'
                    }`}
                  >
                    <div className="text-gray-400">
                      {getCategoryIcon(poi.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {poi.classification?.type === 'brand'
                            ? poi.classification.brandDisplayName
                            : poi.name}
                        </p>
                        {renderBrandIndicator(poi)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {poi.classification?.type === 'brand' && poi.classification.brandConfigSubCategory
                          ? `${poi.classification.brandConfigSubCategory} • ${poi.address}`
                          : poi.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{poi.distance}m</p>
                      {poi.rating && (
                        <p className="text-xs text-gray-500">
                          {poi.rating} ({poi.user_ratings_total})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!isSearching && pois.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPinned className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Inserisci un indirizzo e cerca i punti di interesse nelle vicinanze
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ContextAnalyzer;
