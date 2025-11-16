import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/Toast';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { ContextAnalyzer } from './pages/ContextAnalyzer';
import { PropertyExtractor } from './pages/PropertyExtractor';
import { BrandMatcher } from './pages/BrandMatcher';
import { Report } from './pages/Report';
import { useSettingsStore } from './stores/useSettingsStore';

function App() {
  const isConfigured = useSettingsStore((state) => state.isConfigured());

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />

          {/* Protected routes - require API configuration */}
          <Route
            path="/context"
            element={isConfigured ? <ContextAnalyzer /> : <Navigate to="/settings" />}
          />
          <Route
            path="/property"
            element={isConfigured ? <PropertyExtractor /> : <Navigate to="/settings" />}
          />
          <Route
            path="/brands"
            element={isConfigured ? <BrandMatcher /> : <Navigate to="/settings" />}
          />
          <Route
            path="/report"
            element={isConfigured ? <Report /> : <Navigate to="/settings" />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;
