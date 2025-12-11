import { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  FileJson,
  PenLine,
  Save,
  Trash2,
  Home,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { useAppStore } from '../store/appStore';
import { useGemini } from '../hooks/useGemini';
import { openApiRealEstateService, PROPERTY_TYPES, PROPERTY_TYPE_LABELS, type TransactionType } from '../services/openapi-realestate.service';
import type { PropertyData, PropertyValuation } from '../types';

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
  const { propertyData, setPropertyData, currentAddress, addToast, apiKeys, propertyValuation, setPropertyValuation } = useAppStore();
  const { generate, isGenerating } = useGemini({ temperature: 0.2 });

  const [mode, setMode] = useState<InputMode>('manual');
  const [formData, setFormData] = useState<PropertyData>(propertyData || { indirizzo: currentAddress });
  const [jsonInput, setJsonInput] = useState('');
  const [pdfText, setPdfText] = useState('');

  // Valuation states
  const [valuationPropertyType, setValuationPropertyType] = useState<number>(PROPERTY_TYPES.NEGOZI);
  const [valuationTransactionType, setValuationTransactionType] = useState<TransactionType>('rent');
  const [isLoadingValuation, setIsLoadingValuation] = useState(false);

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

  // Fetch property valuation
  const handleFetchValuation = async () => {
    const address = formData.indirizzo || currentAddress;
    if (!address) {
      addToast({ message: 'Inserisci un indirizzo', type: 'warning' });
      return;
    }

    if (!apiKeys.openapi) {
      addToast({ message: 'Configura prima la API Key OpenAPI.it nelle Impostazioni', type: 'warning' });
      return;
    }

    setIsLoadingValuation(true);
    try {
      const response = await openApiRealEstateService.getValuation(apiKeys.openapi, {
        address,
        propertyType: valuationPropertyType,
        transactionType: valuationTransactionType
      });

      if (response.success && response.data) {
        const surfaceArea = formData.superficie_mq || 100;
        const estimatedValue = openApiRealEstateService.calculatePropertyValue(
          response.data.quotation,
          surfaceArea
        );

        const valuation: PropertyValuation = {
          address,
          propertyType: valuationPropertyType,
          propertyTypeLabel: PROPERTY_TYPE_LABELS[valuationPropertyType],
          transactionType: valuationTransactionType,
          quotation: response.data.quotation,
          estimatedValue,
          location: response.data.location ? {
            region: response.data.location.region,
            province: response.data.location.province,
            municipality: response.data.location.municipality,
            zone: response.data.location.zone,
            microzone: response.data.location.microzone
          } : undefined,
          marketDynamics: response.data.market_dynamics ? {
            trend: response.data.market_dynamics.trend,
            variationPercentage: response.data.market_dynamics.variation_percentage,
            period: response.data.market_dynamics.period
          } : undefined,
          demographics: response.data.demographics ? {
            population: response.data.demographics.population,
            density: response.data.demographics.density,
            avgAge: response.data.demographics.avg_age,
            avgIncome: response.data.demographics.avg_income,
            employmentRate: response.data.demographics.employment_rate
          } : undefined,
          seismicRisk: response.data.seismic_risk ? {
            zone: response.data.seismic_risk.zone,
            level: response.data.seismic_risk.level,
            description: response.data.seismic_risk.description
          } : undefined,
          lastUpdate: response.data.last_update,
          source: response.data.source,
          fetchedAt: new Date()
        };

        setPropertyValuation(valuation);
        addToast({ message: 'Quotazione immobiliare ottenuta', type: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante il recupero della quotazione';
      addToast({ message, type: 'error' });
    } finally {
      setIsLoadingValuation(false);
    }
  };

  // Get trend icon
  const getTrendIcon = (trend?: string) => {
    switch (trend?.toLowerCase()) {
      case 'up':
        return <TrendingUp className="text-green-500" size={16} />;
      case 'down':
        return <TrendingDown className="text-red-500" size={16} />;
      default:
        return <Minus className="text-gray-400" size={16} />;
    }
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

      {/* Quotazioni Immobiliari */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle icon={<Home className="text-emerald-500" size={20} />}>
            Quotazioni Immobiliari OMI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="Tipo Immobile"
              value={String(valuationPropertyType)}
              onChange={(e) => setValuationPropertyType(Number(e.target.value))}
              options={Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
                value,
                label
              }))}
            />
            <Select
              label="Tipo Transazione"
              value={valuationTransactionType}
              onChange={(e) => setValuationTransactionType(e.target.value as TransactionType)}
              options={[
                { value: 'rent', label: 'Affitto (€/mq/mese)' },
                { value: 'sale', label: 'Vendita (€/mq)' }
              ]}
            />
            <div className="flex items-end">
              <Button
                onClick={handleFetchValuation}
                loading={isLoadingValuation}
                disabled={!formData.indirizzo && !currentAddress}
                className="w-full"
              >
                {isLoadingValuation ? 'Caricamento...' : 'Ottieni Quotazione'}
              </Button>
            </div>
          </div>

          {!apiKeys.openapi && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              ⚠️ Configura la API Key OpenAPI.it nelle Impostazioni per utilizzare questa funzione
            </p>
          )}

          {/* Valuation Results */}
          {propertyValuation && (
            <div className="mt-6 space-y-4">
              {/* Location Info */}
              {propertyValuation.location && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-blue-500" />
                    Localizzazione
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Regione:</span>{' '}
                      <span className="font-medium">{propertyValuation.location.region}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Provincia:</span>{' '}
                      <span className="font-medium">{propertyValuation.location.province}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Comune:</span>{' '}
                      <span className="font-medium">{propertyValuation.location.municipality}</span>
                    </div>
                    {propertyValuation.location.zone && (
                      <div>
                        <span className="text-gray-500">Zona:</span>{' '}
                        <span className="font-medium">{propertyValuation.location.zone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quotation Values */}
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h4 className="font-medium text-emerald-800 mb-3">
                  Quotazione {propertyValuation.propertyTypeLabel} - {propertyValuation.transactionType === 'rent' ? 'Affitto' : 'Vendita'}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Minimo</p>
                    <p className="text-lg font-bold text-gray-700">
                      {openApiRealEstateService.formatCurrency(propertyValuation.quotation.min)}/mq
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border-2 border-emerald-300">
                    <p className="text-xs text-gray-500 mb-1">Medio</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {openApiRealEstateService.formatCurrency(propertyValuation.quotation.med)}/mq
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Massimo</p>
                    <p className="text-lg font-bold text-gray-700">
                      {openApiRealEstateService.formatCurrency(propertyValuation.quotation.max)}/mq
                    </p>
                  </div>
                </div>

                {/* Estimated Value */}
                {propertyValuation.estimatedValue && formData.superficie_mq && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-sm text-emerald-700 mb-2">
                      Valore stimato per {formData.superficie_mq} mq:
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <span className="text-gray-500">Min: </span>
                        <span className="font-bold">{openApiRealEstateService.formatCurrency(propertyValuation.estimatedValue.min)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Med: </span>
                        <span className="font-bold text-emerald-600">{openApiRealEstateService.formatCurrency(propertyValuation.estimatedValue.med)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Max: </span>
                        <span className="font-bold">{openApiRealEstateService.formatCurrency(propertyValuation.estimatedValue.max)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Market Dynamics */}
              {propertyValuation.marketDynamics && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-blue-800">
                    {getTrendIcon(propertyValuation.marketDynamics.trend)}
                    Dinamiche di Mercato
                  </h4>
                  <div className="text-sm">
                    {propertyValuation.marketDynamics.variationPercentage !== undefined && (
                      <p>
                        Variazione: <span className={`font-medium ${(propertyValuation.marketDynamics.variationPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {propertyValuation.marketDynamics.variationPercentage > 0 ? '+' : ''}{propertyValuation.marketDynamics.variationPercentage}%
                        </span>
                        {propertyValuation.marketDynamics.period && ` (${propertyValuation.marketDynamics.period})`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Demographics */}
              {propertyValuation.demographics && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-purple-800">
                    <Users size={16} />
                    Dati Demografici
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {propertyValuation.demographics.population && (
                      <div>
                        <span className="text-gray-500">Popolazione:</span>{' '}
                        <span className="font-medium">{propertyValuation.demographics.population.toLocaleString('it-IT')}</span>
                      </div>
                    )}
                    {propertyValuation.demographics.density && (
                      <div>
                        <span className="text-gray-500">Densità:</span>{' '}
                        <span className="font-medium">{propertyValuation.demographics.density}/km²</span>
                      </div>
                    )}
                    {propertyValuation.demographics.avgAge && (
                      <div>
                        <span className="text-gray-500">Età media:</span>{' '}
                        <span className="font-medium">{propertyValuation.demographics.avgAge} anni</span>
                      </div>
                    )}
                    {propertyValuation.demographics.avgIncome && (
                      <div>
                        <span className="text-gray-500">Reddito medio:</span>{' '}
                        <span className="font-medium">{openApiRealEstateService.formatCurrency(propertyValuation.demographics.avgIncome)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seismic Risk */}
              {propertyValuation.seismicRisk && (
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-amber-800">
                    <AlertTriangle size={16} />
                    Rischio Sismico
                  </h4>
                  <div className="text-sm">
                    {propertyValuation.seismicRisk.zone && (
                      <p>
                        <span className="text-gray-500">Zona:</span>{' '}
                        <span className="font-medium">{propertyValuation.seismicRisk.zone}</span>
                      </p>
                    )}
                    {propertyValuation.seismicRisk.level && (
                      <p>
                        <span className="text-gray-500">Livello:</span>{' '}
                        <span className="font-medium">{propertyValuation.seismicRisk.level}</span>
                      </p>
                    )}
                    {propertyValuation.seismicRisk.description && (
                      <p className="text-gray-600 mt-1">{propertyValuation.seismicRisk.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Source & Date */}
              <p className="text-xs text-gray-400 text-right">
                {propertyValuation.source && `Fonte: ${propertyValuation.source} | `}
                Aggiornamento: {new Date(propertyValuation.fetchedAt).toLocaleDateString('it-IT')}
              </p>
            </div>
          )}
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
