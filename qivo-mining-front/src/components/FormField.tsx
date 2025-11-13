import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'textarea';
  placeholder?: string;
  helpText?: string;
  tooltip?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  type = 'text',
  placeholder,
  helpText,
  tooltip,
  disabled = false,
  rows = 4,
  className = '',
}: FormFieldProps) {
  const hasError = error !== null && error !== undefined && error !== '';
  const hasValue = value !== null && value !== undefined && value !== '';

  const inputClasses = `
    w-full px-4 py-2.5 rounded-lg border transition-all duration-200
    ${hasError
      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : hasValue
      ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200'
      : 'border-white/20 bg-white/5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
    }
    disabled:bg-[#171a4a] disabled:cursor-not-allowed
    placeholder:text-gray-400
  `;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
        />
      );
    }

    return (
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
      />
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label com tooltip */}
      <div className="flex items-center gap-2">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-400 transition-colors"
                  aria-label="Ajuda"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Input com ícone de status */}
      <div className="relative">
        {renderInput()}

        {/* Ícone de status */}
        {!disabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {!hasError && hasValue && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Texto de ajuda */}
      {helpText && !hasError && (
        <p className="text-sm text-gray-500 flex items-start gap-1">
          <span className="text-blue-500 font-medium">💡</span>
          {helpText}
        </p>
      )}

      {/* Mensagem de erro */}
      {hasError && (
        <p
          id={`${name}-error`}
          className="text-sm text-red-600 flex items-start gap-1 animate-in fade-in slide-in-from-top-1"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

