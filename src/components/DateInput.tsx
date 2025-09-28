import React from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

/**
 * Componente de input para datas com validação inteligente
 */
export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder: _placeholder,
  minDate,
  maxDate,
  required = false
}) => {
  // const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={minDate}
          max={maxDate}
          placeholder={_placeholder}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        
        {/* Ícone de calendário */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Dicas de validação */}
      {minDate && (
        <div className="text-xs text-gray-500">
          Data mínima: {new Date(minDate).toLocaleDateString('pt-BR')}
        </div>
      )}
      
      {maxDate && (
        <div className="text-xs text-gray-500">
          Data máxima: {new Date(maxDate).toLocaleDateString('pt-BR')}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
