import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { ContextAnalyzer } from './pages/ContextAnalyzer';
import { PropertyExtractor } from './pages/PropertyExtractor';
import { MarketingGenerator } from './pages/MarketingGenerator';
import { BrandMatcher } from './pages/BrandMatcher';
import { FormapsIntegration } from './pages/FormapsIntegration';
import { FullReport } from './pages/FullReport';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="settings" element={<Settings />} />
            <Route path="context-analyzer" element={<ContextAnalyzer />} />
            <Route path="property-extractor" element={<PropertyExtractor />} />
            <Route path="marketing-generator" element={<MarketingGenerator />} />
            <Route path="brand-matcher" element={<BrandMatcher />} />
            <Route path="formaps" element={<FormapsIntegration />} />
            <Route path="report" element={<FullReport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
