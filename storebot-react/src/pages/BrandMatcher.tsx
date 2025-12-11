import { useState, useMemo } from 'react';
import {
  GitCompareArrows,
  Search,
  Sparkles,
  Building,
  Star,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { useAppStore } from '../store/appStore';
import { useGemini } from '../hooks/useGemini';
import type { BrandMatch } from '../types';

// Database brand semplificato (in produzione sarebbe importato dal file esistente)
const BRAND_DATABASE = [
  { name: 'Starbucks', category: 'Food & Beverage', subcategory: 'Caffetteria', requirements: 'Alto traffico, zona centrale' },
  { name: 'McDonald\'s', category: 'Food & Beverage', subcategory: 'Fast Food', requirements: 'Alto traffico, visibilità stradale' },
  { name: 'Zara', category: 'Retail', subcategory: 'Abbigliamento', requirements: 'Centro commerciale o via commerciale' },
  { name: 'H&M', category: 'Retail', subcategory: 'Abbigliamento', requirements: 'Ampia superficie, zona shopping' },
  { name: 'Nike', category: 'Retail', subcategory: 'Sport', requirements: 'Zona commerciale, target giovane' },
  { name: 'Sephora', category: 'Retail', subcategory: 'Cosmetici', requirements: 'Centro commerciale, target femminile' },
  { name: 'Eataly', category: 'Food & Beverage', subcategory: 'Food Hall', requirements: 'Grande superficie, zona premium' },
  { name: 'Decathlon', category: 'Retail', subcategory: 'Sport', requirements: 'Grande superficie, parcheggio' },
  { name: 'MediaWorld', category: 'Retail', subcategory: 'Elettronica', requirements: 'Grande superficie, accesso facile' },
  { name: 'Esselunga', category: 'Retail', subcategory: 'Supermercato', requirements: 'Ampia superficie, parcheggio' },
  { name: 'Carrefour', category: 'Retail', subcategory: 'Supermercato', requirements: 'Ampia superficie, parcheggio' },
  { name: 'IKEA', category: 'Retail', subcategory: 'Arredamento', requirements: 'Grande superficie, zona periferica' },
  { name: 'Feltrinelli', category: 'Retail', subcategory: 'Libreria', requirements: 'Zona culturale, centro città' },
  { name: 'Grom', category: 'Food & Beverage', subcategory: 'Gelateria', requirements: 'Alto traffico pedonale' },
  { name: 'Alice Pizza', category: 'Food & Beverage', subcategory: 'Pizzeria', requirements: 'Zona commerciale, target giovane' },
  { name: 'Calzedonia', category: 'Retail', subcategory: 'Abbigliamento', requirements: 'Via commerciale' },
  { name: 'Intimissimi', category: 'Retail', subcategory: 'Abbigliamento', requirements: 'Via commerciale' },
  { name: 'Venchi', category: 'Food & Beverage', subcategory: 'Cioccolateria', requirements: 'Zona turistica o premium' },
  { name: 'Kiko', category: 'Retail', subcategory: 'Cosmetici', requirements: 'Centro commerciale' },
  { name: 'Flying Tiger', category: 'Retail', subcategory: 'Lifestyle', requirements: 'Via commerciale, target giovane' }
];

const CATEGORIES = [
  { value: 'all', label: 'Tutte le categorie' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Retail', label: 'Retail' }
];

export function BrandMatcher() {
  const { propertyData, contextAnalysis, brandMatches, setBrandMatches, addToast } = useAppStore();
  const { generate, isGenerating } = useGemini({ temperature: 0.6 });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [propertyDescription, setPropertyDescription] = useState(() => {
    const parts = [];
    if (propertyData?.superficie_mq) parts.push(`Superficie: ${propertyData.superficie_mq} mq`);
    if (propertyData?.indirizzo) parts.push(`Indirizzo: ${propertyData.indirizzo}`);
    if (propertyData?.vetrine) parts.push(`Vetrine: ${propertyData.vetrine}`);
    if (propertyData?.piano) parts.push(`Piano: ${propertyData.piano}`);
    if (contextAnalysis?.analysis) parts.push(`\nContesto: ${contextAnalysis.analysis.substring(0, 500)}`);
    return parts.join('\n');
  });

  const [matches, setMatches] = useState<BrandMatch[]>(brandMatches);

  // Filtra brand
  const filteredBrands = useMemo(() => {
    return BRAND_DATABASE.filter((brand) => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || brand.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Analisi AI matching
  const handleAIMatching = async () => {
    if (!propertyDescription.trim()) {
      addToast({ message: 'Inserisci una descrizione dell\'immobile', type: 'warning' });
      return;
    }

    const brandList = BRAND_DATABASE.map((b) => `${b.name} (${b.subcategory}): ${b.requirements}`).join('\n');

    const prompt = `Sei un esperto in retail e location intelligence. Analizza la compatibilità tra questo immobile commerciale e i seguenti brand.

IMMOBILE:
${propertyDescription}

BRAND DISPONIBILI:
${brandList}

Per ogni brand che consideri compatibile (massimo 10), fornisci:
1. Nome brand
2. Punteggio compatibilità (1-100)
3. 2-3 motivi specifici

Rispondi SOLO con un array JSON valido in questo formato:
[
  {
    "brand": "Nome Brand",
    "score": 85,
    "reasons": ["motivo 1", "motivo 2"]
  }
]

Ordina per punteggio decrescente.`;

    const result = await generate(prompt);
    if (result) {
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          const matchResults: BrandMatch[] = data.map((item: { brand: string; score: number; reasons: string[] }) => ({
            brand: {
              name: item.brand,
              category: BRAND_DATABASE.find((b) => b.name === item.brand)?.category || 'Altro',
              subcategory: BRAND_DATABASE.find((b) => b.name === item.brand)?.subcategory
            },
            score: item.score,
            reasons: item.reasons
          }));

          setMatches(matchResults);
          setBrandMatches(matchResults);
          addToast({ message: `Trovati ${matchResults.length} brand compatibili`, type: 'success' });
        }
      } catch (e) {
        addToast({ message: 'Errore nel parsing dei risultati', type: 'error' });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <GitCompareArrows className="text-amber-500" />
          Matching Brand
        </h1>
        <p className="text-gray-500 mt-2">
          Scopri i brand più compatibili con l'immobile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Property & Search */}
        <div className="lg:col-span-1 space-y-6">
          {/* Property Description */}
          <Card>
            <CardHeader>
              <CardTitle icon={<Building className="text-blue-500" size={20} />}>
                Descrizione Immobile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                placeholder="Descrivi l'immobile: superficie, posizione, caratteristiche, target..."
                rows={8}
              />
              <Button
                onClick={handleAIMatching}
                loading={isGenerating}
                icon={<Sparkles size={18} />}
                className="w-full mt-4"
              >
                Analisi AI Matching
              </Button>
            </CardContent>
          </Card>

          {/* Brand Search */}
          <Card>
            <CardHeader>
              <CardTitle icon={<Search className="text-gray-500" size={20} />}>
                Cerca Brand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per nome o categoria..."
                className="mb-4"
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={CATEGORIES}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Matches */}
          {matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle icon={<Sparkles className="text-purple-500" size={20} />}>
                  Brand Compatibili ({matches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.map((match, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{match.brand.name}</h4>
                        <div className="flex items-center gap-1">
                          <Star className="text-amber-500" size={16} fill="currentColor" />
                          <span className="font-bold text-lg">{match.score}</span>
                          <span className="text-gray-400 text-sm">/100</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {match.brand.category} • {match.brand.subcategory}
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {match.reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary-500">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Brand Database */}
          <Card>
            <CardHeader>
              <CardTitle icon={<Filter className="text-gray-500" size={20} />}>
                Database Brand ({filteredBrands.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {filteredBrands.map((brand, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-300 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">{brand.name}</h4>
                    <p className="text-xs text-gray-500">
                      {brand.category} • {brand.subcategory}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{brand.requirements}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BrandMatcher;
