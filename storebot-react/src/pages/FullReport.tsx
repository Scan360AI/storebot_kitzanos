import { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  Sparkles,
  Building,
  MapPinned,
  PenTool,
  GitCompareArrows,
  Map,
  Save,
  RefreshCw,
  Trash2,
  FolderOpen,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { useGemini } from '../hooks/useGemini';
import type { FullReport as FullReportType } from '../types';

const STORAGE_KEY = 'storebot_saved_reports';

// Genera ID univoco
const generateId = () => `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function FullReport() {
  const {
    currentAddress,
    propertyData,
    contextAnalysis,
    marketingDescription,
    brandMatches,
    formapsChapters,
    setPropertyData,
    setContextAnalysis,
    setMarketingDescription,
    setBrandMatches,
    setFormapsChapters,
    addToast
  } = useAppStore();

  const { generate, isGenerating } = useGemini({ preferOpenRouter: true, temperature: 0.6 });

  const [aiSummary, setAiSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedReports, setSavedReports] = useState<FullReportType[]>([]);
  const [showSavedReports, setShowSavedReports] = useState(false);

  // Carica report salvati da localStorage
  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const reports = JSON.parse(saved) as FullReportType[];
        // Ordina per data decrescente
        reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSavedReports(reports);
      }
    } catch (error) {
      console.error('Errore caricamento report:', error);
    }
  };

  // Genera sommario AI
  const handleGenerateSummary = async () => {
    const sections = [];

    if (propertyData) {
      sections.push(`DATI IMMOBILE:\n${JSON.stringify(propertyData, null, 2)}`);
    }

    if (contextAnalysis?.analysis) {
      sections.push(`ANALISI CONTESTO:\n${contextAnalysis.analysis}`);
    }

    if (marketingDescription) {
      sections.push(`DESCRIZIONE MARKETING:\n${marketingDescription}`);
    }

    if (brandMatches.length > 0) {
      const brandsText = brandMatches
        .slice(0, 5)
        .map((m) => `- ${m.brand.name} (${m.score}/100): ${m.reasons.join(', ')}`)
        .join('\n');
      sections.push(`BRAND COMPATIBILI:\n${brandsText}`);
    }

    if (formapsChapters.length > 0) {
      const chaptersText = formapsChapters
        .map((ch) => `### ${ch.title}\n${ch.content || ch.analysis || ''}`)
        .join('\n\n');
      sections.push(`ANALISI TERRITORIALE:\n${chaptersText}`);
    }

    if (sections.length === 0) {
      addToast({ message: 'Nessun dato disponibile per generare il report', type: 'warning' });
      return;
    }

    const prompt = `Sei un esperto analista immobiliare. Genera un executive summary professionale basato sui seguenti dati raccolti su un immobile commerciale.

${sections.join('\n\n---\n\n')}

Il report deve includere:
1. **Executive Summary** - Sintesi in 3-4 frasi
2. **Punti di Forza** - Lista dei principali vantaggi
3. **Criticità** - Eventuali punti di attenzione
4. **Raccomandazioni** - Suggerimenti per la commercializzazione
5. **Valutazione Complessiva** - Giudizio finale sul potenziale dell'immobile

Scrivi in italiano professionale, in formato markdown.`;

    const result = await generate(prompt);
    if (result) {
      setAiSummary(result);
      addToast({ message: 'Executive summary generato', type: 'success' });
    }
  };

  // Salva su localStorage
  const handleSaveToLocal = async () => {
    setIsSaving(true);

    try {
      const newReport: FullReportType = {
        id: generateId(),
        address: currentAddress || propertyData?.indirizzo || 'Sconosciuto',
        createdAt: new Date(),
        propertyData: propertyData || undefined,
        contextAnalysis: contextAnalysis || undefined,
        marketingDescription: marketingDescription || undefined,
        brandMatches: brandMatches.length > 0 ? brandMatches : undefined,
        formapsChapters: formapsChapters.length > 0 ? formapsChapters : undefined,
        aiSummary: aiSummary || undefined
      };

      // Carica report esistenti
      const existing = localStorage.getItem(STORAGE_KEY);
      const reports: FullReportType[] = existing ? JSON.parse(existing) : [];

      // Aggiungi nuovo report
      reports.unshift(newReport);

      // Limita a 50 report massimo
      const limitedReports = reports.slice(0, 50);

      // Salva
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedReports));

      setSavedReports(limitedReports);
      addToast({ message: 'Report salvato localmente', type: 'success' });
    } catch (error) {
      addToast({ message: 'Errore durante il salvataggio', type: 'error' });
    }

    setIsSaving(false);
  };

  // Carica un report salvato
  const handleLoadReport = (report: FullReportType) => {
    if (report.propertyData) setPropertyData(report.propertyData);
    if (report.contextAnalysis) setContextAnalysis(report.contextAnalysis);
    if (report.marketingDescription) setMarketingDescription(report.marketingDescription);
    if (report.brandMatches) setBrandMatches(report.brandMatches);
    if (report.formapsChapters) setFormapsChapters(report.formapsChapters);
    if (report.aiSummary) setAiSummary(report.aiSummary);

    setShowSavedReports(false);
    addToast({ message: `Report "${report.address}" caricato`, type: 'success' });
  };

  // Elimina un report
  const handleDeleteReport = (reportId: string) => {
    if (!confirm('Eliminare questo report?')) return;

    const updated = savedReports.filter(r => r.id !== reportId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedReports(updated);
    addToast({ message: 'Report eliminato', type: 'success' });
  };

  // Esporta TXT
  const handleExport = () => {
    const sections = [];

    sections.push(`REPORT IMMOBILIARE - ${currentAddress || 'Indirizzo non specificato'}`);
    sections.push(`Data: ${new Date().toLocaleDateString('it-IT')}`);
    sections.push('='.repeat(60));

    if (aiSummary) {
      sections.push('\n## EXECUTIVE SUMMARY\n');
      sections.push(aiSummary);
    }

    if (propertyData) {
      sections.push('\n## DATI IMMOBILE\n');
      Object.entries(propertyData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          sections.push(`${key}: ${value}`);
        }
      });
    }

    if (contextAnalysis?.analysis) {
      sections.push('\n## ANALISI CONTESTO\n');
      sections.push(contextAnalysis.analysis);
    }

    if (marketingDescription) {
      sections.push('\n## DESCRIZIONE MARKETING\n');
      sections.push(marketingDescription);
    }

    if (brandMatches.length > 0) {
      sections.push('\n## BRAND COMPATIBILI\n');
      brandMatches.forEach((m) => {
        sections.push(`- ${m.brand.name} (Score: ${m.score}/100)`);
        m.reasons.forEach((r) => sections.push(`  - ${r}`));
      });
    }

    if (formapsChapters.length > 0) {
      sections.push('\n## ANALISI TERRITORIALE\n');
      formapsChapters.forEach((ch) => {
        sections.push(`### ${ch.title}`);
        sections.push(ch.content || ch.analysis || '');
      });
    }

    const content = sections.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${(currentAddress || 'immobile').replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  // Esporta JSON
  const handleExportJSON = () => {
    const report: FullReportType = {
      id: generateId(),
      address: currentAddress || propertyData?.indirizzo || 'Sconosciuto',
      createdAt: new Date(),
      propertyData: propertyData || undefined,
      contextAnalysis: contextAnalysis || undefined,
      marketingDescription: marketingDescription || undefined,
      brandMatches: brandMatches.length > 0 ? brandMatches : undefined,
      formapsChapters: formapsChapters.length > 0 ? formapsChapters : undefined,
      aiSummary: aiSummary || undefined
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${(currentAddress || 'immobile').replace(/\s+/g, '_')}.json`;
    link.click();
  };

  // Conta sezioni completate
  const completedSections = [
    propertyData && Object.keys(propertyData).length > 1,
    contextAnalysis?.analysis,
    marketingDescription,
    brandMatches.length > 0,
    formapsChapters.length > 0
  ].filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileCheck2 className="text-rose-500" />
          Report Consolidato
        </h1>
        <p className="text-gray-500 mt-2">
          Visualizza, salva ed esporta l'analisi completa
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Completamento Report</span>
            <span className="text-primary-500 font-bold">{completedSections}/5 sezioni</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedSections / 5) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className={propertyData ? 'border-emerald-200 bg-emerald-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building className={propertyData ? 'text-emerald-500' : 'text-gray-300'} />
              <div>
                <p className="font-medium">Dati Immobile</p>
                <p className="text-sm text-gray-500">
                  {propertyData ? `${Object.keys(propertyData).length} campi` : 'Non compilato'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={contextAnalysis?.analysis ? 'border-blue-200 bg-blue-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <MapPinned className={contextAnalysis?.analysis ? 'text-blue-500' : 'text-gray-300'} />
              <div>
                <p className="font-medium">Analisi Contesto</p>
                <p className="text-sm text-gray-500">
                  {contextAnalysis?.pois ? `${contextAnalysis.pois.length} POI trovati` : 'Non completata'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={marketingDescription ? 'border-purple-200 bg-purple-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <PenTool className={marketingDescription ? 'text-purple-500' : 'text-gray-300'} />
              <div>
                <p className="font-medium">Descrizione Marketing</p>
                <p className="text-sm text-gray-500">
                  {marketingDescription ? 'Generata' : 'Non generata'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={brandMatches.length > 0 ? 'border-amber-200 bg-amber-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <GitCompareArrows className={brandMatches.length > 0 ? 'text-amber-500' : 'text-gray-300'} />
              <div>
                <p className="font-medium">Brand Matching</p>
                <p className="text-sm text-gray-500">
                  {brandMatches.length > 0 ? `${brandMatches.length} brand compatibili` : 'Non completato'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={formapsChapters.length > 0 ? 'border-cyan-200 bg-cyan-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Map className={formapsChapters.length > 0 ? 'text-cyan-500' : 'text-gray-300'} />
              <div>
                <p className="font-medium">Analisi Territoriale</p>
                <p className="text-sm text-gray-500">
                  {formapsChapters.length > 0 ? `${formapsChapters.length} capitoli` : 'Non completata'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={<Sparkles className="text-purple-500" size={20} />}>
              Executive Summary AI
            </CardTitle>
            <Button
              variant="secondary"
              onClick={handleGenerateSummary}
              loading={isGenerating}
              icon={isGenerating ? undefined : <RefreshCw size={16} />}
              disabled={completedSections === 0}
            >
              {aiSummary ? 'Rigenera' : 'Genera'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="prose prose-sm max-w-none bg-gray-50 p-6 rounded-lg">
              <div dangerouslySetInnerHTML={{
                __html: aiSummary
                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br/>')
              }} />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Clicca "Genera" per creare un executive summary AI</p>
              <p className="text-sm mt-2">Basato su tutte le sezioni completate</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div
              className="cursor-pointer flex items-center"
              onClick={() => setShowSavedReports(!showSavedReports)}
            >
              <CardTitle icon={<FolderOpen className="text-blue-500" size={20} />}>
                Report Salvati ({savedReports.length})
              </CardTitle>
            </div>
          </CardHeader>
          {showSavedReports && (
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{report.address}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(report.createdAt).toLocaleString('it-IT')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLoadReport(report)}
                      >
                        Carica
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id!)}
                        icon={<Trash2 size={14} />}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={handleSaveToLocal}
          loading={isSaving}
          icon={<Save size={18} />}
          disabled={completedSections === 0}
        >
          Salva Report
        </Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          icon={<Download size={18} />}
          disabled={completedSections === 0}
        >
          Esporta TXT
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportJSON}
          icon={<Download size={18} />}
          disabled={completedSections === 0}
        >
          Esporta JSON
        </Button>
      </div>
    </div>
  );
}

export default FullReport;
