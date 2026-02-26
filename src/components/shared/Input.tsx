import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-light">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl
            bg-dark-700 border border-dark-500
            text-white placeholder-gray-text
            focus:outline-none focus:ring-2 focus:ring-blue-primary focus:border-transparent
            transition-colors duration-200
            ${error ? 'border-red-accent focus:ring-red-accent' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-red-accent">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-gray-text">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
