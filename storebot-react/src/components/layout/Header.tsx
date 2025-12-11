import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Settings,
  MapPinned,
  FileSpreadsheet,
  PenTool,
  GitCompareArrows,
  Map,
  FileCheck2,
  Trash2
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/settings', label: 'Configurazione', icon: Settings },
  { path: '/context-analyzer', label: 'Analisi Contesto', icon: MapPinned },
  { path: '/property-extractor', label: 'Dati Immobile', icon: FileSpreadsheet },
  { path: '/marketing-generator', label: 'Descrizione Marketing', icon: PenTool },
  { path: '/brand-matcher', label: 'Matching Brand', icon: GitCompareArrows },
  { path: '/formaps', label: 'Formaps', icon: Map },
  { path: '/report', label: 'Report', icon: FileCheck2 }
];

export function Header() {
  const location = useLocation();
  const { resetAll, addToast } = useAppStore();

  const handleReset = () => {
    if (window.confirm('Sei sicuro di voler resettare tutti i dati? Questa azione non può essere annullata.')) {
      resetAll();
      addToast({ message: 'Dati resettati con successo', type: 'success' });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Storebot" className="h-8" />
            <span className="font-bold text-lg text-gray-900 hidden sm:block">
              Storebot Pro
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span className="hidden xl:block">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="btn-icon text-gray-500 hover:text-red-500"
            title="Reset tutti i dati"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                  whitespace-nowrap transition-colors
                  ${isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Header;
