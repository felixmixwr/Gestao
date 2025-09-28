import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/format';

interface DateInputWithValidationProps {
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
export const DateInputWithValidation: React.FC<DateInputWithValidationProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder: _placeholder,
  minDate,
  maxDate,
  required = false
}) => {
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Validar data
  useEffect(() => {
    if (!value) {
      setIsValid(false);
      setValidationMessage('');
      return;
    }

    const selectedDate = new Date(value);
    const today = new Date();
    const minDateObj = minDate ? new Date(minDate) : null;
    const maxDateObj = maxDate ? new Date(maxDate) : null;

    // Verificar se a data é válida
    if (isNaN(selectedDate.getTime())) {
      setIsValid(false);
      setValidationMessage('Data inválida');
      return;
    }

    // Verificar se está dentro dos limites
    if (minDateObj && selectedDate < minDateObj) {
      setIsValid(false);
      setValidationMessage(`Data deve ser posterior a ${formatDate(minDate || '')}`);
      return;
    }

    if (maxDateObj && selectedDate > maxDateObj) {
      setIsValid(false);
      setValidationMessage(`Data deve ser anterior a ${formatDate(maxDate || '')}`);
      return;
    }

    // Verificar se não é muito antiga (mais de 10 anos)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(today.getFullYear() - 10);
    if (selectedDate < tenYearsAgo) {
      setIsValid(false);
      setValidationMessage('Data muito antiga (máximo 10 anos)');
      return;
    }

    // Verificar se não é muito futura (mais de 1 ano)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    if (selectedDate > oneYearFromNow) {
      setIsValid(false);
      setValidationMessage('Data muito futura (máximo 1 ano)');
      return;
    }

    setIsValid(true);
    setValidationMessage('✓ Data válida');
  }, [value, minDate, maxDate]);

  const getValidationColor = () => {
    if (value.length === 0) return 'text-gray-500';
    if (isValid) return 'text-green-500';
    return 'text-red-500';
  };

  // const _getValidationIcon = () => {
  //   if (value.length === 0) return null;
  //   if (isValid) {
  //     return (
  //       <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  //       </svg>
  //     );
  //   }
  //   return (
  //     <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  //     </svg>
  //   );
  // };

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

      {/* Preview da data formatada */}
      {value && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Data:</span> {formatDate(value)}
        </div>
      )}

      {/* Status de validação */}
      {value.length > 0 && (
        <div className={`text-sm ${getValidationColor()}`}>
          {validationMessage}
        </div>
      )}

      {/* Dicas de validação */}
      {minDate && (
        <div className="text-xs text-gray-500">
          Data mínima: {formatDate(minDate)}
        </div>
      )}
      
      {maxDate && (
        <div className="text-xs text-gray-500">
          Data máxima: {formatDate(maxDate)}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};