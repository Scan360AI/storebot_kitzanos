import { useState, useRef } from 'react';
import {
  PenTool,
  Upload,
  Link,
  Sparkles,
  Copy,
  Download,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { useAppStore } from '../store/appStore';
import { useGemini } from '../hooks/useGemini';

const MAX_IMAGES = 5;

export function MarketingGenerator() {
  const { propertyData, contextAnalysis, marketingDescription, setMarketingDescription, addToast } = useAppStore();
  const { generateWithImages, generateWithImageUrls, isGenerating } = useGemini({ temperature: 0.7, maxOutputTokens: 4096 });

  const [propertyDetails, setPropertyDetails] = useState(() => {
    if (propertyData) {
      return Object.entries(propertyData)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }
    return '';
  });

  const [neighborhoodContext, setNeighborhoodContext] = useState(() => {
    if (contextAnalysis?.analysis) {
      return contextAnalysis.analysis;
    }
    return '';
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState(marketingDescription || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload immagini
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalImages = imageFiles.length + imageUrls.length + files.length;

    if (totalImages > MAX_IMAGES) {
      addToast({ message: `Massimo ${MAX_IMAGES} immagini`, type: 'warning' });
      return;
    }

    const imageFilesOnly = files.filter((f) => f.type.startsWith('image/'));
    setImageFiles((prev) => [...prev, ...imageFilesOnly].slice(0, MAX_IMAGES - imageUrls.length));
  };

  // Aggiungi URL immagine
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    const totalImages = imageFiles.length + imageUrls.length + 1;
    if (totalImages > MAX_IMAGES) {
      addToast({ message: `Massimo ${MAX_IMAGES} immagini`, type: 'warning' });
      return;
    }

    setImageUrls((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  // Rimuovi immagine
  const handleRemoveFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Genera descrizione
  const handleGenerate = async () => {
    if (!propertyDetails.trim()) {
      addToast({ message: 'Inserisci i dettagli dell\'immobile', type: 'warning' });
      return;
    }

    const prompt = `Sei un esperto copywriter immobiliare. Genera una descrizione marketing accattivante e professionale per questo immobile commerciale.

DETTAGLI IMMOBILE:
${propertyDetails}

${neighborhoodContext ? `CONTESTO QUARTIERE:\n${neighborhoodContext}` : ''}

${imageFiles.length > 0 || imageUrls.length > 0 ? 'Le immagini allegate mostrano l\'immobile e il contesto. Integra le osservazioni visive nella descrizione.' : ''}

Requisiti:
- Scrivi in italiano
- Usa un tono professionale ma coinvolgente
- Evidenzia i punti di forza
- Includi una call-to-action finale
- Formatta in markdown con sezioni ben organizzate
- Lunghezza: 300-500 parole`;

    let result: string | null = null;

    if (imageFiles.length > 0) {
      result = await generateWithImages(prompt, imageFiles);
    } else if (imageUrls.length > 0) {
      result = await generateWithImageUrls(prompt, imageUrls);
    } else {
      const { generate } = useGemini({ temperature: 0.7, maxOutputTokens: 4096 });
      result = await generate(prompt);
    }

    if (result) {
      setGeneratedDescription(result);
      setMarketingDescription(result);
      addToast({ message: 'Descrizione generata con successo', type: 'success' });
    }
  };

  // Copia negli appunti
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      addToast({ message: 'Copiato negli appunti', type: 'success' });
    } catch {
      addToast({ message: 'Errore durante la copia', type: 'error' });
    }
  };

  // Download
  const handleDownload = () => {
    const blob = new Blob([generatedDescription], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'descrizione_marketing.md';
    link.click();
  };

  const totalImages = imageFiles.length + imageUrls.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <PenTool className="text-purple-500" />
          Descrizione Marketing
        </h1>
        <p className="text-gray-500 mt-2">
          Genera testi promozionali efficaci con l'AI
        </p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Immobile</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={propertyDetails}
              onChange={(e) => setPropertyDetails(e.target.value)}
              placeholder="Inserisci i dettagli dell'immobile (superficie, posizione, caratteristiche...)"
              rows={10}
            />
          </CardContent>
        </Card>

        {/* Neighborhood Context */}
        <Card>
          <CardHeader>
            <CardTitle>Contesto Quartiere</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={neighborhoodContext}
              onChange={(e) => setNeighborhoodContext(e.target.value)}
              placeholder="Descrivi il quartiere, i servizi nelle vicinanze, il target demografico..."
              rows={10}
            />
          </CardContent>
        </Card>
      </div>

      {/* Images Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle icon={<ImageIcon className="text-blue-500" size={20} />}>
            Immagini ({totalImages}/{MAX_IMAGES})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload */}
          <div className="flex gap-3 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload size={18} />}
              disabled={totalImages >= MAX_IMAGES}
            >
              Carica Immagini
            </Button>
          </div>

          {/* URL Input */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://esempio.com/immagine.jpg"
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleAddUrl}
              icon={<Link size={18} />}
              disabled={totalImages >= MAX_IMAGES}
            >
              Aggiungi URL
            </Button>
          </div>

          {/* Preview */}
          {(imageFiles.length > 0 || imageUrls.length > 0) && (
            <div className="flex flex-wrap gap-3">
              {imageFiles.map((file, index) => (
                <div key={`file-${index}`} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {imageUrls.map((url, index) => (
                <div key={`url-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`URL ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" fill="%239ca3af">Error</text></svg>';
                    }}
                  />
                  <button
                    onClick={() => handleRemoveUrl(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={handleGenerate}
          loading={isGenerating}
          icon={<Sparkles size={18} />}
          size="lg"
        >
          Genera Descrizione Marketing
        </Button>
      </div>

      {/* Generated Description */}
      {generatedDescription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle icon={<Sparkles className="text-purple-500" size={20} />}>
                Descrizione Generata
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopy} icon={<Copy size={16} />}>
                  Copia
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownload} icon={<Download size={16} />}>
                  Scarica
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none bg-gray-50 p-6 rounded-lg">
              <div dangerouslySetInnerHTML={{
                __html: generatedDescription
                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br/>')
              }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MarketingGenerator;
