import { useAppStore } from '../../store/appStore';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastType } from '../../types';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="text-emerald-500" size={20} />,
  error: <AlertTriangle className="text-red-500" size={20} />,
  warning: <AlertTriangle className="text-amber-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />
};

const bgMap: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200'
};

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
            animate-in slide-in-from-right
            ${bgMap[toast.type]}
          `}
        >
          {iconMap[toast.type]}
          <span className="text-sm text-gray-700 flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
