import { useState } from 'react';
import {
  FileText,
  Upload,
  Edit3,
  Code2,
  ArrowRight,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
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
import type { PropertyData, PropertyImage } from '../types';

type InputMode = 'json' | 'manual' | 'pdf' | 'image';

export const PropertyExtractor = () => {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const currentAnalysis = useAnalysisStore((state) => state.currentAnalysis);
  const setProperty = useAnalysisStore((state) => state.setProperty);

  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [jsonInput, setJsonInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<PropertyImage[]>(
    currentAnalysis?.property?.images || []
  );

  const [formData, setFormData] = useState<PropertyData>(
    currentAnalysis?.property || {
      address: currentAnalysis?.address || '',
      surfaceArea: 0,
      price: '',
      windows: 0,
      ceilingHeight: '',
      parking: '',
      floor: '',
      condition: '',
      yearBuilt: '',
      heating: '',
      cooling: '',
      description: '',
      features: [],
      images: [],
    }
  );

  const steps = [
    { id: 'context', label: 'Analisi Contesto', completed: !!currentAnalysis?.context },
    { id: 'property', label: 'Dati Immobile', completed: !!currentAnalysis?.property },
    { id: 'brands', label: 'Brand Matching', completed: !!currentAnalysis?.brandMatching },
    { id: 'report', label: 'Report Finale', completed: currentAnalysis?.status === 'completed' },
  ];

  const handleJsonLoad = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const propertyData: PropertyData = {
        address: parsed.indirizzo || parsed.address || formData.address,
        surfaceArea: parsed.superficie_mq || parsed.surfaceArea || 0,
        price: parsed.prezzo || parsed.price || '',
        windows: parsed.vetrine || parsed.windows || 0,
        ceilingHeight: parsed.altezza_soffitti || parsed.ceilingHeight || '',
        parking: parsed.parcheggio || parsed.parking || '',
        floor: parsed.piano || parsed.floor || '',
        condition: parsed.condizioni || parsed.condition || '',
        yearBuilt: parsed.anno_costruzione || parsed.yearBuilt || '',
        heating: parsed.riscaldamento || parsed.heating || '',
        cooling: parsed.climatizzazione || parsed.cooling || '',
        description: parsed.descrizione || parsed.description || '',
        features: parsed.caratteristiche || parsed.features || [],
        images: uploadedImages,
      };

      setFormData(propertyData);
      toast.success('Dati JSON caricati con successo');
    } catch (error) {
      toast.error('JSON non valido. Verifica la sintassi.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);

    try {
      const gemini = new GeminiService(settings.apiKeys.gemini);
      const base64 = await fileToBase64(file);

      const prompt = type === 'pdf'
        ? `Estrai tutti i dati immobiliari da questo documento PDF.

Cerca e identifica:
- Indirizzo completo
- Superficie (mq)
- Prezzo
- Numero vetrine
- Altezza soffitti
- Parcheggio
- Piano
- Condizioni
- Anno costruzione
- Riscaldamento
- Climatizzazione
- Descrizione
- Caratteristiche speciali

Rispondi in formato JSON:
{
  "address": "...",
  "surfaceArea": 0,
  "price": "...",
  "windows": 0,
  "ceilingHeight": "...",
  "parking": "...",
  "floor": "...",
  "condition": "...",
  "yearBuilt": "...",
  "heating": "...",
  "cooling": "...",
  "description": "...",
  "features": ["..."]
}`
        : `Analizza questa immagine di un immobile commerciale e estrai tutte le informazioni visibili.

Identifica:
- Tipo di locale
- Caratteristiche architettoniche
- Vetrine
- Condizioni visibili
- Elementi distintivi

Rispondi in formato JSON con i campi che riesci a identificare.`;

      const result = await gemini.analyzeImage(base64, prompt, {
        model: settings.geminiModel,
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Nessun dato strutturato trovato nel documento');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      setFormData((prev) => ({
        ...prev,
        ...extractedData,
        surfaceArea: extractedData.surfaceArea || prev.surfaceArea,
        windows: extractedData.windows || prev.windows,
        images: uploadedImages,
      }));

      toast.success('Dati estratti con successo dal documento');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nell\'estrazione dati');
      console.error(error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: PropertyImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);

      newImages.push({
        url: base64,
        caption: file.name,
        type: 'interior',
      });
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...newImages],
    }));

    toast.success(`${newImages.length} foto caricate`);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (!formData.address || formData.surfaceArea === 0) {
      toast.error('Compila almeno indirizzo e superficie');
      return;
    }

    setProperty(formData);
    toast.success('Dati immobile salvati');
  };

  const handleNext = () => {
    if (!currentAnalysis?.property) {
      toast.error('Salva prima i dati immobile');
      return;
    }
    navigate('/brands');
  };

  return (
    <PageContainer
      title="Dati Immobile"
      subtitle="Inserisci o estrai i dettagli della proprietà"
      icon={FileText}
    >
      <div className="space-y-6">
        {/* Stepper */}
        <Stepper steps={steps} currentStep="property" />

        {/* Input mode selector */}
        <Card padding="md">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={inputMode === 'manual' ? 'primary' : 'outline'}
              size="sm"
              icon={Edit3}
              onClick={() => setInputMode('manual')}
            >
              Inserimento Manuale
            </Button>
            <Button
              variant={inputMode === 'json' ? 'primary' : 'outline'}
              size="sm"
              icon={Code2}
              onClick={() => setInputMode('json')}
            >
              Incolla JSON
            </Button>
            <Button
              variant={inputMode === 'pdf' ? 'primary' : 'outline'}
              size="sm"
              icon={FileText}
              onClick={() => setInputMode('pdf')}
            >
              Carica PDF
            </Button>
            <Button
              variant={inputMode === 'image' ? 'primary' : 'outline'}
              size="sm"
              icon={ImageIcon}
              onClick={() => setInputMode('image')}
            >
              Analizza Foto
            </Button>
          </div>
        </Card>

        {/* JSON Input */}
        {inputMode === 'json' && (
          <Card padding="md">
            <CardHeader title="Incolla JSON" subtitle="Copia e incolla i dati in formato JSON" icon={Code2} />
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dati JSON
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"indirizzo": "...", "superficie_mq": 250, "prezzo": "€500,000", ...}'
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Button variant="primary" onClick={handleJsonLoad}>
                Carica Dati JSON
              </Button>
            </div>
          </Card>
        )}

        {/* PDF Upload */}
        {inputMode === 'pdf' && (
          <Card padding="md">
            <CardHeader
              title="Carica PDF"
              subtitle="Estrai automaticamente i dati da un PDF immobiliare"
              icon={FileText}
            />
            <div className="mt-4 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Carica un PDF con i dettagli dell'immobile
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'pdf')}
                  disabled={isExtracting}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload">
                  <Button
                    variant="primary"
                   
                    loading={isExtracting}
                    disabled={isExtracting}
                  >
                    {isExtracting ? 'Estrazione in corso...' : 'Seleziona PDF'}
                  </Button>
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Image Analysis */}
        {inputMode === 'image' && (
          <Card padding="md">
            <CardHeader
              title="Analizza Foto"
              subtitle="Estrai informazioni da foto dell'immobile"
              icon={ImageIcon}
            />
            <div className="mt-4 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Carica foto dell'immobile per analisi AI
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  disabled={isExtracting}
                  className="hidden"
                  id="image-analysis-upload"
                />
                <label htmlFor="image-analysis-upload">
                  <Button
                    variant="primary"
                   
                    loading={isExtracting}
                    disabled={isExtracting}
                  >
                    {isExtracting ? 'Analisi in corso...' : 'Seleziona Foto'}
                  </Button>
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Manual Form */}
        <Card padding="md">
          <CardHeader
            title="Dettagli Immobile"
            subtitle="Modifica o completa i dati della proprietà"
            icon={FileText}
            action={
              currentAnalysis?.property && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3" />
                  <span className="ml-1">Salvato</span>
                </Badge>
              )
            }
          />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Indirizzo *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Via/Piazza, Città"
            />
            <Input
              label="Superficie (mq) *"
              type="number"
              value={formData.surfaceArea || ''}
              onChange={(e) =>
                setFormData({ ...formData, surfaceArea: Number(e.target.value) })
              }
              placeholder="250"
            />
            <Input
              label="Prezzo"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="€500,000"
            />
            <Input
              label="Numero Vetrine"
              type="number"
              value={formData.windows || ''}
              onChange={(e) =>
                setFormData({ ...formData, windows: Number(e.target.value) })
              }
              placeholder="2"
            />
            <Input
              label="Altezza Soffitti"
              value={formData.ceilingHeight}
              onChange={(e) => setFormData({ ...formData, ceilingHeight: e.target.value })}
              placeholder="3.5m"
            />
            <Input
              label="Parcheggio"
              value={formData.parking}
              onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
              placeholder="50 posti / Assente"
            />
            <Input
              label="Piano"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              placeholder="Piano Terra / Interrato"
            />
            <Input
              label="Condizioni"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              placeholder="Ottime / Da ristrutturare"
            />
            <Input
              label="Anno Costruzione"
              value={formData.yearBuilt}
              onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
              placeholder="2010"
            />
            <Input
              label="Riscaldamento"
              value={formData.heating}
              onChange={(e) => setFormData({ ...formData, heating: e.target.value })}
              placeholder="Autonomo / Centralizzato"
            />
            <Input
              label="Climatizzazione"
              value={formData.cooling}
              onChange={(e) => setFormData({ ...formData, cooling: e.target.value })}
              placeholder="Presente / Predisposizione"
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione dettagliata dell'immobile..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        {/* Photo Upload */}
        <Card padding="md">
          <CardHeader
            title="Foto Immobile"
            subtitle="Carica le foto della proprietà per il report finale"
            icon={ImageIcon}
            action={
              uploadedImages.length > 0 && (
                <Badge variant="info">{uploadedImages.length} foto</Badge>
              )
            }
          />
          <div className="mt-4 space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="property-images-upload"
              />
              <label htmlFor="property-images-upload">
                <Button variant="outline" icon={Upload}>
                  Carica Foto
                </Button>
              </label>
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={image.caption}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        const newImages = uploadedImages.filter((_, i) => i !== index);
                        setUploadedImages(newImages);
                        setFormData({ ...formData, images: newImages });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-between">
          <Button variant="outline" onClick={handleSave}>
            Salva Dati
          </Button>
          <Button variant="primary" icon={ArrowRight} onClick={handleNext}>
            Continua con Brand Matching
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};
