import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPinned,
  FileSpreadsheet,
  PenTool,
  GitCompareArrows,
  FileCheck2,
  SlidersHorizontal,
  Map
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { useApiKeys } from '../hooks/useApiKeys';

const modules = [
  {
    path: '/context-analyzer',
    icon: MapPinned,
    title: 'Analisi Contesto',
    description: 'Esplora i dintorni, i POI e la vocazione del quartiere.',
    color: 'text-blue-500',
    requiresAddress: true
  },
  {
    path: '/property-extractor',
    icon: FileSpreadsheet,
    title: 'Dati Immobile',
    description: 'Estrai o inserisci i dettagli chiave della proprietà.',
    color: 'text-emerald-500',
    requiresAddress: false
  },
  {
    path: '/marketing-generator',
    icon: PenTool,
    title: 'Descrizione Marketing',
    description: 'Genera testi promozionali efficaci con l\'AI.',
    color: 'text-purple-500',
    requiresAddress: false
  },
  {
    path: '/brand-matcher',
    icon: GitCompareArrows,
    title: 'Matching Brand',
    description: 'Scopri i brand più compatibili con l\'immobile.',
    color: 'text-amber-500',
    requiresAddress: false
  },
  {
    path: '/formaps',
    icon: Map,
    title: 'Formaps',
    description: 'Analisi territoriale e demografica.',
    color: 'text-cyan-500',
    requiresAddress: false
  },
  {
    path: '/report',
    icon: FileCheck2,
    title: 'Report Consolidato',
    description: 'Visualizza ed esporta l\'analisi completa.',
    color: 'text-rose-500',
    requiresAddress: false
  },
  {
    path: '/settings',
    icon: SlidersHorizontal,
    title: 'Configurazione',
    description: 'Gestisci le tue API Keys.',
    color: 'text-gray-500',
    requiresAddress: false
  }
];

export function Home() {
  const navigate = useNavigate();
  const { currentAddress, lastAddress, setCurrentAddress, addToast } = useAppStore();
  const { testAllKeys } = useApiKeys();

  const [address, setAddress] = useState(currentAddress || lastAddress || '');

  useEffect(() => {
    // Test API keys all'avvio
    testAllKeys();
  }, []);

  useEffect(() => {
    setAddress(currentAddress || lastAddress || '');
  }, [currentAddress, lastAddress]);

  const handleAnalyzeContext = () => {
    if (!address.trim()) {
      addToast({ message: 'Inserisci un indirizzo prima di procedere.', type: 'error' });
      return;
    }
    setCurrentAddress(address.trim());
    navigate('/context-analyzer');
  };

  const handleModuleClick = (path: string, requiresAddress: boolean) => {
    if (requiresAddress && !address.trim()) {
      addToast({ message: 'Inserisci un indirizzo per questa funzione.', type: 'error' });
      return;
    }
    if (address.trim()) {
      setCurrentAddress(address.trim());
    }
    navigate(path);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Storebot - My Storebook AI Pro Suite
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          La tua piattaforma integrata per l'analisi immobiliare commerciale avanzata.
        </p>
      </section>

      {/* Start Analysis */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Inizia una Nuova Analisi
        </h2>
        <div className="max-w-xl mx-auto">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="es. Via Roma 123, Milano"
            className="text-lg py-3"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeContext()}
          />
          <Button
            onClick={handleAnalyzeContext}
            className="w-full mt-4"
            size="lg"
            icon={<Map size={20} />}
          >
            Analizza Contesto Quartiere
          </Button>
          <p className="text-sm text-gray-500 text-center mt-4">
            Inserisci un indirizzo e inizia con l'analisi del contesto, oppure accedi direttamente agli altri moduli.
          </p>
        </div>
      </section>

      {/* Modules Grid */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Moduli Disponibili
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(({ path, icon: Icon, title, description, color, requiresAddress }) => (
            <Card
              key={path}
              hover
              onClick={() => handleModuleClick(path, requiresAddress)}
              className="group"
            >
              <div className={`${color} mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={32} />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
