import { Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export function LoadingOverlay() {
  const { isLoading, loadingText } = useAppStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-xl">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-gray-700 font-medium">{loadingText}</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
