import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface PageContainerProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const PageContainer = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  maxWidth = '2xl',
}: PageContainerProps) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className={clsx('mx-auto px-4 sm:px-6 lg:px-8', maxWidthClasses[maxWidth])}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {Icon && (
                <div className="p-3 bg-primary-100 rounded-xl">
                  <Icon className="w-8 h-8 text-primary-600" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="mt-2 text-lg text-gray-600">{subtitle}</p>}
              </div>
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>

        {/* Page Content */}
        <div className="animate-fade-in">{children}</div>
      </div>
    </div>
  );
};
