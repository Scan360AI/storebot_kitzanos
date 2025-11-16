import { InputHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  helper?: string; // Alias for helperText
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      helper,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = true,
      className,
      ...props
    },
    ref
  ) => {
    const helperMessage = helper || helperText;
    return (
      <div className={clsx('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon className="w-5 h-5" />
            </div>
          )}

          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-2.5 rounded-lg border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'placeholder:text-gray-400',
              error
                ? 'border-error focus:ring-error'
                : 'border-gray-300 hover:border-gray-400',
              Icon && iconPosition === 'left' && 'pl-11',
              Icon && iconPosition === 'right' && 'pr-11',
              props.disabled && 'bg-gray-50 cursor-not-allowed',
              className
            )}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
        {helperMessage && !error && <p className="text-sm text-gray-500">{helperMessage}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
