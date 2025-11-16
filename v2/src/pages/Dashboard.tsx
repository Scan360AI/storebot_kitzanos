import { useNavigate } from 'react-router-dom';
import { MapPin, FileText, GitCompareArrows, FileCheck, Settings as SettingsIcon, Play } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const Dashboard = () => {
  const navigate = useNavigate();
  const analyses = useAnalysisStore((state) => state.analyses);
  const isConfigured = useSettingsStore((state) => state.isConfigured());
  const currentAnalysis = useAnalysisStore((state) => state.currentAnalysis);

  const modules = [
    {
      title: 'Analisi Contesto',
      description: 'Analizza POI e brand presenti nel quartiere',
      icon: MapPin,
      path: '/context',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Dati Immobile',
      description: 'Estrai o inserisci i dettagli della proprietà',
      icon: FileText,
      path: '/property',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Brand Matching',
      description: 'Suggerimenti brand compatibili con esclusione automatica',
      icon: GitCompareArrows,
      path: '/brands',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Report Finale',
      description: 'Genera scheda completa HTML con foto',
      icon: FileCheck,
      path: '/report',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Analisi Immobiliare Commerciale - Storebot Pro V2"
      action={
        isConfigured ? (
          <Button variant="primary" icon={Play} onClick={() => navigate('/context')}>
            Nuova Analisi
          </Button>
        ) : (
          <Button variant="primary" icon={SettingsIcon} onClick={() => navigate('/settings')}>
            Configura API
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Alert se non configurato */}
        {!isConfigured && (
          <Card padding="md">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Configurazione richiesta
                </h3>
                <p className="text-gray-600 mb-4">
                  Prima di iniziare, configura le tue API keys (Gemini e Google Maps).
                </p>
                <Button variant="primary" size="sm" onClick={() => navigate('/settings')}>
                  Vai alla Configurazione
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Analisi corrente */}
        {currentAnalysis && (
          <Card padding="md">
            <CardHeader
              title="Analisi in Corso"
              subtitle={currentAnalysis.address}
              icon={Play}
              action={
                <Badge variant={currentAnalysis.status === 'completed' ? 'success' : 'warning'}>
                  {currentAnalysis.status === 'completed' ? 'Completata' : 'In corso'}
                </Badge>
              }
            />
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">
                  {currentAnalysis.context?.pois.length || 0}
                </p>
                <p className="text-sm text-gray-600">POI trovati</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">
                  {currentAnalysis.context?.brandsPresentCount || 0}
                </p>
                <p className="text-sm text-gray-600">Brand presenti</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">
                  {currentAnalysis.brandMatching?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Suggerimenti</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">
                  {currentAnalysis.property?.images?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Foto</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="primary" size="sm" onClick={() => navigate('/report')}>
                Visualizza Report
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/context')}>
                Continua Analisi
              </Button>
            </div>
          </Card>
        )}

        {/* Moduli disponibili */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Moduli Disponibili</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => (
              <Card
                key={module.path}
                hover
                padding="md"
                onClick={() => navigate(module.path)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${module.bgColor} rounded-lg`}>
                    <module.icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{module.title}</h3>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Analisi recenti */}
        {analyses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analisi Recenti</h2>
            <div className="space-y-3">
              {analyses.slice(0, 5).map((analysis) => (
                <Card
                  key={analysis.id}
                  hover
                  padding="md"
                  onClick={() => {
                    useAnalysisStore.getState().loadAnalysis(analysis.id);
                    navigate('/report');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{analysis.address}</h4>
                      <p className="text-sm text-gray-500">
                        {format(new Date(analysis.createdAt), 'PPP', { locale: it })}
                      </p>
                    </div>
                    <Badge variant={analysis.status === 'completed' ? 'success' : 'warning'}>
                      {analysis.status === 'completed' ? 'Completata' : 'Bozza'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
