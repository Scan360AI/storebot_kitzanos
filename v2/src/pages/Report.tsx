import { useState } from 'react';
import {
  FileCheck,
  Download,
  Printer,
  Sparkles,
  MapPin,
  FileText,
  GitCompareArrows,
  CheckCircle,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Stepper } from '../components/ui/Stepper';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { GeminiService } from '../services/api/gemini';
import { toast } from '../components/ui/Toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const Report = () => {
  const settings = useSettingsStore();
  const currentAnalysis = useAnalysisStore((state) => state.currentAnalysis);
  const updateAnalysis = useAnalysisStore((state) => state.updateAnalysis);

  const [finalReport, setFinalReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { id: 'context', label: 'Analisi Contesto', completed: !!currentAnalysis?.context },
    { id: 'property', label: 'Dati Immobile', completed: !!currentAnalysis?.property },
    { id: 'brands', label: 'Brand Matching', completed: !!currentAnalysis?.brandMatching },
    { id: 'report', label: 'Report Finale', completed: currentAnalysis?.status === 'completed' },
  ];

  const generateFinalReport = async () => {
    if (!currentAnalysis?.context || !currentAnalysis?.property || !currentAnalysis?.brandMatching) {
      toast.error('Completa tutti i passaggi precedenti');
      return;
    }

    setIsGenerating(true);

    try {
      const gemini = new GeminiService(settings.apiKeys.gemini);

      const prompt = `Genera una scheda immobiliare commerciale professionale in formato HTML.

DATI DISPONIBILI:

📍 INDIRIZZO: ${currentAnalysis.address}

🏢 CARATTERISTICHE IMMOBILE:
- Superficie: ${currentAnalysis.property.surfaceArea} mq
- Prezzo: ${currentAnalysis.property.price || 'Da definire'}
- Vetrine: ${currentAnalysis.property.windows}
- Piano: ${currentAnalysis.property.floor || 'N/D'}
- Altezza soffitti: ${currentAnalysis.property.ceilingHeight || 'N/D'}
- Parcheggio: ${currentAnalysis.property.parking || 'N/D'}
- Condizioni: ${currentAnalysis.property.condition || 'N/D'}
- Anno costruzione: ${currentAnalysis.property.yearBuilt || 'N/D'}
${currentAnalysis.property.description ? `\nDescrizione: ${currentAnalysis.property.description}` : ''}

🗺️ ANALISI CONTESTO QUARTIERE:
${currentAnalysis.context.summary}

Brand presenti: ${currentAnalysis.context.brandsPresentCount}
Categorie: ${currentAnalysis.context.categories.join(', ')}

🎯 BRAND MATCHING (${currentAnalysis.brandMatching.length} suggerimenti):
${currentAnalysis.brandMatching
  .slice(0, 10)
  .map(
    (brand) =>
      `- ${brand.brandName} (${brand.category}) - Compatibilità ${brand.compatibility}%\n  Ragioni: ${brand.reasons.join('; ')}`
  )
  .join('\n')}

GENERA UN REPORT HTML PROFESSIONALE con questa struttura:

1. INTESTAZIONE con indirizzo e data
2. SEZIONE IMMOBILE con tutte le caratteristiche in formato tabella pulita
3. SEZIONE CONTESTO QUARTIERE con l'analisi territoriale
4. SEZIONE BRAND MATCHING con top 5 suggerimenti in card visuali
5. CONCLUSIONI E RACCOMANDAZIONI

Usa stile pulito, moderno, colori Storebook (#1890ff per primary), font sans-serif.
Il report deve essere stampabile e includere placeholder per le foto.

Rispondi SOLO con il codice HTML completo (da <!DOCTYPE html> a </html>).`;

      const htmlReport = await gemini.generateText(prompt, { model: settings.geminiModel });

      // Clean up the HTML if wrapped in markdown code blocks
      const cleanHtml = htmlReport
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      setFinalReport(cleanHtml);
      updateAnalysis({ status: 'completed' });
      toast.success('Report finale generato con successo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nella generazione report');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportHTML = () => {
    if (!finalReport && !currentAnalysis) {
      toast.error('Genera prima il report');
      return;
    }

    const html = finalReport || generateStaticHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${currentAnalysis?.address.replace(/[^a-z0-9]/gi, '_')}_${format(
      new Date(),
      'yyyyMMdd'
    )}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report HTML scaricato');
  };

  const exportTXT = () => {
    if (!currentAnalysis) {
      toast.error('Nessun dato da esportare');
      return;
    }

    const txt = `REPORT ANALISI IMMOBILIARE
Data: ${format(new Date(), 'PPP', { locale: it })}
Indirizzo: ${currentAnalysis.address}

═══════════════════════════════════════

CARATTERISTICHE IMMOBILE
───────────────────────────────────────
Superficie: ${currentAnalysis.property?.surfaceArea || 'N/D'} mq
Prezzo: ${currentAnalysis.property?.price || 'N/D'}
Vetrine: ${currentAnalysis.property?.windows || 'N/D'}
Piano: ${currentAnalysis.property?.floor || 'N/D'}
Condizioni: ${currentAnalysis.property?.condition || 'N/D'}
${currentAnalysis.property?.description ? `\nDescrizione:\n${currentAnalysis.property.description}\n` : ''}

═══════════════════════════════════════

ANALISI CONTESTO QUARTIERE
───────────────────────────────────────
${currentAnalysis.context?.summary || 'Non disponibile'}

POI Trovati: ${currentAnalysis.context?.pois.length || 0}
Brand Presenti: ${currentAnalysis.context?.brandsPresentCount || 0}

═══════════════════════════════════════

BRAND MATCHING
───────────────────────────────────────
${
  currentAnalysis.brandMatching
    ? currentAnalysis.brandMatching
        .map(
          (brand, i) =>
            `${i + 1}. ${brand.brandName} (${brand.category})
   Compatibilità: ${brand.compatibility}%
   Target: ${brand.targetAudience}
   Ragioni:
   ${brand.reasons.map((r) => `   • ${r}`).join('\n')}
   ${brand.notes ? `Note: ${brand.notes}` : ''}
`
        )
        .join('\n')
    : 'Non disponibile'
}

═══════════════════════════════════════

Report generato da Storebot Pro V2
`;

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${currentAnalysis.address.replace(/[^a-z0-9]/gi, '_')}_${format(
      new Date(),
      'yyyyMMdd'
    )}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report TXT scaricato');
  };

  const printReport = () => {
    if (!finalReport && !currentAnalysis) {
      toast.error('Genera prima il report');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup bloccato. Abilita i popup per stampare.');
      return;
    }

    const html = finalReport || generateStaticHTML();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const generateStaticHTML = (): string => {
    if (!currentAnalysis) return '';

    return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Analisi - ${currentAnalysis.address}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #1890ff 0%, #0066cc 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 18px; }
    .section {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .section-title {
      font-size: 24px;
      color: #1890ff;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .property-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .property-item {
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 3px solid #1890ff;
    }
    .property-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .property-value {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .brand-card {
      background: #f9fafb;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }
    .brand-category {
      color: #6b7280;
      font-size: 14px;
    }
    .compatibility {
      background: #10b981;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }
    .reasons {
      background: #d1fae5;
      border: 1px solid #6ee7b7;
      padding: 15px;
      border-radius: 8px;
      margin-top: 10px;
    }
    .reasons h4 {
      color: #047857;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .reasons ul {
      list-style: none;
      padding-left: 0;
    }
    .reasons li {
      padding-left: 20px;
      position: relative;
      margin-bottom: 8px;
      color: #065f46;
    }
    .reasons li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .photo-item {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .photo-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    @media print {
      body { background: white; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Report Analisi Immobiliare</h1>
    <p>${currentAnalysis.address}</p>
    <p style="font-size: 14px; opacity: 0.8;">Generato il ${format(new Date(), 'PPP', {
      locale: it,
    })}</p>
  </div>

  <div class="section">
    <h2 class="section-title">🏢 Caratteristiche Immobile</h2>
    <div class="property-grid">
      <div class="property-item">
        <div class="property-label">Superficie</div>
        <div class="property-value">${currentAnalysis.property?.surfaceArea || 'N/D'} mq</div>
      </div>
      <div class="property-item">
        <div class="property-label">Prezzo</div>
        <div class="property-value">${currentAnalysis.property?.price || 'N/D'}</div>
      </div>
      <div class="property-item">
        <div class="property-label">Vetrine</div>
        <div class="property-value">${currentAnalysis.property?.windows || 'N/D'}</div>
      </div>
      <div class="property-item">
        <div class="property-label">Piano</div>
        <div class="property-value">${currentAnalysis.property?.floor || 'N/D'}</div>
      </div>
      <div class="property-item">
        <div class="property-label">Condizioni</div>
        <div class="property-value">${currentAnalysis.property?.condition || 'N/D'}</div>
      </div>
      <div class="property-item">
        <div class="property-label">Parcheggio</div>
        <div class="property-value">${currentAnalysis.property?.parking || 'N/D'}</div>
      </div>
    </div>
    ${
      currentAnalysis.property?.description
        ? `<div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <p>${currentAnalysis.property.description}</p>
      </div>`
        : ''
    }
  </div>

  ${
    currentAnalysis.property?.images && currentAnalysis.property.images.length > 0
      ? `<div class="section">
    <h2 class="section-title">📸 Foto Immobile</h2>
    <div class="photos-grid">
      ${currentAnalysis.property.images
        .map(
          (img) => `
        <div class="photo-item">
          <img src="${img.url}" alt="${img.caption}" />
        </div>
      `
        )
        .join('')}
    </div>
  </div>`
      : ''
  }

  <div class="section">
    <h2 class="section-title">🗺️ Analisi Contesto Quartiere</h2>
    <p style="white-space: pre-line; color: #374151; line-height: 1.8;">
      ${currentAnalysis.context?.summary || 'Non disponibile'}
    </p>
    <div style="margin-top: 20px; display: flex; gap: 20px;">
      <div class="property-item" style="flex: 1;">
        <div class="property-label">POI Trovati</div>
        <div class="property-value">${currentAnalysis.context?.pois.length || 0}</div>
      </div>
      <div class="property-item" style="flex: 1;">
        <div class="property-label">Brand Presenti</div>
        <div class="property-value">${currentAnalysis.context?.brandsPresentCount || 0}</div>
      </div>
    </div>
  </div>

  ${
    currentAnalysis.brandMatching && currentAnalysis.brandMatching.length > 0
      ? `<div class="section">
    <h2 class="section-title">🎯 Brand Matching</h2>
    <p style="color: #6b7280; margin-bottom: 20px;">
      ${currentAnalysis.brandMatching.length} brand compatibili identificati
    </p>
    ${currentAnalysis.brandMatching
      .slice(0, 8)
      .map(
        (brand) => `
      <div class="brand-card">
        <div class="brand-header">
          <div>
            <div class="brand-name">${brand.brandName}</div>
            <div class="brand-category">${brand.category}</div>
          </div>
          <div class="compatibility">${brand.compatibility}%</div>
        </div>
        <div><strong>Target:</strong> ${brand.targetAudience}</div>
        ${brand.estimatedInvestment ? `<div style="margin-top: 8px;"><strong>Investimento:</strong> ${brand.estimatedInvestment}</div>` : ''}
        <div class="reasons">
          <h4>🎯 Ragioni del matching</h4>
          <ul>
            ${brand.reasons.map((reason) => `<li>${reason}</li>`).join('')}
          </ul>
        </div>
        ${brand.notes ? `<div style="margin-top: 10px; color: #6b7280; font-size: 14px;"><strong>Note:</strong> ${brand.notes}</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>`
      : ''
  }

  <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #9ca3af;">
    <p>Report generato da <strong style="color: #1890ff;">Storebot Pro V2</strong></p>
    <p style="font-size: 14px;">Powered by Gemini AI</p>
  </div>
</body>
</html>`;
  };

  if (!currentAnalysis) {
    return (
      <PageContainer title="Report Finale" subtitle="Nessuna analisi disponibile" icon={FileCheck}>
        <Card padding="md">
          <p className="text-gray-600">
            Inizia una nuova analisi dalla dashboard per generare un report.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Report Finale"
      subtitle="Scheda completa dell'analisi immobiliare"
      icon={FileCheck}
    >
      <div className="space-y-6">
        {/* Stepper */}
        <Stepper steps={steps} currentStep="report" />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {currentAnalysis.context?.pois.length || 0}
                </p>
                <p className="text-sm text-gray-600">POI Trovati</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {currentAnalysis.property?.surfaceArea || 0} mq
                </p>
                <p className="text-sm text-gray-600">Superficie</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <GitCompareArrows className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {currentAnalysis.brandMatching?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Brand Match</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Generate Report */}
        <Card padding="md">
          <CardHeader
            title="Genera Scheda Finale"
            subtitle="Crea un report HTML professionale con AI"
            icon={Sparkles}
          />
          <div className="mt-4 space-y-4">
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={generateFinalReport}
              loading={isGenerating}
              disabled={
                !currentAnalysis.context || !currentAnalysis.property || !currentAnalysis.brandMatching
              }
            >
              {isGenerating ? 'Generazione in corso...' : 'Genera Scheda AI'}
            </Button>

            {finalReport && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Report generato con successo</span>
              </div>
            )}
          </div>
        </Card>

        {/* Export Options */}
        <Card padding="md">
          <CardHeader
            title="Esporta Report"
            subtitle="Scarica o stampa il report in vari formati"
            icon={Download}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="primary" icon={Download} onClick={exportHTML}>
              Esporta HTML
            </Button>
            <Button variant="outline" icon={Download} onClick={exportTXT}>
              Esporta TXT
            </Button>
            <Button variant="outline" icon={Printer} onClick={printReport}>
              Stampa Report
            </Button>
          </div>
        </Card>

        {/* Preview */}
        {(finalReport || currentAnalysis) && (
          <Card padding="md">
            <CardHeader title="Anteprima Report" icon={FileCheck} />
            <div className="mt-4 border rounded-lg overflow-hidden">
              <iframe
                srcDoc={finalReport || generateStaticHTML()}
                className="w-full"
                style={{ height: '600px' }}
                title="Report Preview"
              />
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};
