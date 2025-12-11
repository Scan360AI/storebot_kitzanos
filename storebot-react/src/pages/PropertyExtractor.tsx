import { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  FileJson,
  PenLine,
  Save,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { useAppStore } from '../store/appStore';
import { useGemini } from '../hooks/useGemini';
import type { PropertyData } from '../types';

// Campi del form immobile
const PROPERTY_FIELDS = [
  { key: 'indirizzo', label: 'Indirizzo', type: 'text' },
  { key: 'citta', label: 'Città', type: 'text' },
  { key: 'provincia', label: 'Provincia', type: 'text' },
  { key: 'cap', label: 'CAP', type: 'text' },
  { key: 'superficie_mq', label: 'Superficie (mq)', type: 'number' },
  { key: 'piano', label: 'Piano', type: 'text' },
  { key: 'vetrine', label: 'N. Vetrine', type: 'number' },
  { key: 'altezza_soffitto', label: 'Altezza Soffitto (m)', type: 'number' },
  { key: 'servizi_igienici', label: 'Servizi Igienici', type: 'number' },
  { key: 'posti_auto', label: 'Posti Auto', type: 'number' },
  { key: 'magazzino_mq', label: 'Magazzino (mq)', type: 'number' },
  { key: 'affaccio', label: 'Affaccio', type: 'text' },
  { key: 'stato_immobile', label: 'Stato Immobile', type: 'text' },
  { key: 'anno_costruzione', label: 'Anno Costruzione', type: 'number' },
  { key: 'classe_energetica', label: 'Classe Energetica', type: 'text' },
  { key: 'prezzo_richiesta', label: 'Prezzo Richiesta (€)', type: 'number' },
  { key: 'prezzo_mq', label: 'Prezzo/mq (€)', type: 'number' },
  { key: 'spese_condominiali', label: 'Spese Condominiali (€)', type: 'number' }
];

type InputMode = 'pdf' | 'json' | 'manual';

export function PropertyExtractor() {
  const { propertyData, setPropertyData, currentAddress, addToast } = useAppStore();
  const { generate, isGenerating } = useGemini({ temperature: 0.2 });

  const [mode, setMode] = useState<InputMode>('manual');
  const [formData, setFormData] = useState<PropertyData>(propertyData || { indirizzo: currentAddress });
  const [jsonInput, setJsonInput] = useState('');
  const [pdfText, setPdfText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler per upload PDF
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      addToast({ message: 'Seleziona un file PDF', type: 'error' });
      return;
    }

    try {
      // Carica PDF.js se non presente
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
      let text = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: { str: string }) => item.str).join(' ') + '\n';
      }

      setPdfText(text);
      addToast({ message: 'PDF caricato con successo', type: 'success' });
    } catch (error) {
      addToast({ message: 'Errore durante la lettura del PDF', type: 'error' });
    }
  };

  // Estrai dati dal PDF con AI
  const handleExtractFromPdf = async () => {
    if (!pdfText.trim()) {
      addToast({ message: 'Carica prima un PDF', type: 'warning' });
      return;
    }

    const prompt = `Estrai i dati immobiliari dal seguente testo e restituisci SOLO un oggetto JSON valido con i seguenti campi (usa null per i valori non trovati):
{
  "indirizzo": "string",
  "citta": "string",
  "provincia": "string",
  "cap": "string",
  "superficie_mq": number,
  "piano": "string",
  "vetrine": number,
  "altezza_soffitto": number,
  "servizi_igienici": number,
  "posti_auto": number,
  "magazzino_mq": number,
  "affaccio": "string",
  "stato_immobile": "string",
  "anno_costruzione": number,
  "classe_energetica": "string",
  "prezzo_richiesta": number,
  "prezzo_mq": number,
  "spese_condominiali": number,
  "note": "string"
}

Testo da analizzare:
${pdfText.substring(0, 8000)}`;

    const result = await generate(prompt);
    if (result) {
      try {
        // Pulisci la risposta per estrarre solo il JSON
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          setFormData(data);
          addToast({ message: 'Dati estratti con successo', type: 'success' });
        } else {
          throw new Error('JSON non trovato');
        }
      } catch (e) {
        addToast({ message: 'Errore nel parsing dei dati estratti', type: 'error' });
      }
    }
  };

  // Importa JSON
  const handleImportJson = () => {
    try {
      const data = JSON.parse(jsonInput);
      setFormData(data);
      addToast({ message: 'JSON importato con successo', type: 'success' });
    } catch (e) {
      addToast({ message: 'JSON non valido', type: 'error' });
    }
  };

  // Aggiorna campo form
  const handleFieldChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Salva dati
  const handleSave = () => {
    setPropertyData(formData);
    addToast({ message: 'Dati immobile salvati', type: 'success' });
  };

  // Reset
  const handleReset = () => {
    setFormData({ indirizzo: currentAddress });
    setPropertyData(null);
    addToast({ message: 'Dati resettati', type: 'info' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileSpreadsheet className="text-emerald-500" />
          Dati Immobile
        </h1>
        <p className="text-gray-500 mt-2">
          Estrai o inserisci i dettagli chiave della proprietà
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === 'pdf' ? 'primary' : 'secondary'}
          onClick={() => setMode('pdf')}
          icon={<Upload size={18} />}
        >
          Da PDF
        </Button>
        <Button
          variant={mode === 'json' ? 'primary' : 'secondary'}
          onClick={() => setMode('json')}
          icon={<FileJson size={18} />}
        >
          Da JSON
        </Button>
        <Button
          variant={mode === 'manual' ? 'primary' : 'secondary'}
          onClick={() => setMode('manual')}
          icon={<PenLine size={18} />}
        >
          Manuale
        </Button>
      </div>

      {/* PDF Mode */}
      {mode === 'pdf' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle icon={<Upload className="text-blue-500" size={20} />}>
              Estrai da PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <div className="flex gap-3 mb-4">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Seleziona PDF
              </Button>
              <Button
                onClick={handleExtractFromPdf}
                loading={isGenerating}
                disabled={!pdfText}
              >
                Estrai Dati con AI
              </Button>
            </div>
            {pdfText && (
              <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {pdfText.substring(0, 1000)}...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* JSON Mode */}
      {mode === 'json' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle icon={<FileJson className="text-amber-500" size={20} />}>
              Importa JSON
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"indirizzo": "Via Roma 1", "superficie_mq": 100, ...}'
              className="font-mono text-sm"
              rows={8}
            />
            <Button
              onClick={handleImportJson}
              className="mt-4"
              disabled={!jsonInput}
            >
              Importa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manual Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle icon={<PenLine className="text-purple-500" size={20} />}>
            Dati Immobile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROPERTY_FIELDS.map(({ key, label, type }) => (
              <Input
                key={key}
                label={label}
                type={type}
                value={String(formData[key] ?? '')}
                onChange={(e) =>
                  handleFieldChange(
                    key,
                    type === 'number' ? Number(e.target.value) || '' : e.target.value
                  )
                }
              />
            ))}
          </div>

          {/* Note */}
          <div className="mt-4">
            <Textarea
              label="Note aggiuntive"
              value={formData.note ?? ''}
              onChange={(e) => handleFieldChange('note', e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} icon={<Save size={18} />}>
              Salva Dati
            </Button>
            <Button variant="danger" onClick={handleReset} icon={<Trash2 size={18} />}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview JSON */}
      {Object.keys(formData).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Anteprima JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Aggiungi tipo per PDF.js
declare global {
  interface Window {
    pdfjsLib: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (data: ArrayBuffer) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str: string }> }> }> }> };
    };
  }
}

export default PropertyExtractor;
