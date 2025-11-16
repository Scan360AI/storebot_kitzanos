import { useNavigate } from 'react-router-dom';
import { Settings, Home } from 'lucide-react';
import { Button } from '../ui/Button';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Storebot" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-primary-600">Storebot Pro</h1>
              <p className="text-xs text-gray-500">Analisi Immobiliare</p>
            </div>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={Home}
              onClick={() => navigate('/')}
            >
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Settings}
              onClick={() => navigate('/settings')}
            >
              <span className="hidden sm:inline">Configurazione</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
