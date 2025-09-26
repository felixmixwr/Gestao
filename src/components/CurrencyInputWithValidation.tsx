import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';

interface CurrencyInputWithValidationProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  minValue?: number;
  maxValue?: number;
}

/**
 * Componente de input para valores monetários com validação e formatação automática
 */
export const CurrencyInputWithValidation: React.FC<CurrencyInputWithValidationProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = "0,00",
  required = false,
  minValue = 0.01,
  maxValue = 999999.99
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Atualizar displayValue quando value muda externamente
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatCurrency(value) : '');
    }
  }, [value, isFocused]);

  // Validar valor
  useEffect(() => {
    if (value === 0) {
      setIsValid(false);
      setValidationMessage('');
      return;
    }

    if (value < minValue) {
      setIsValid(false);
      setValidationMessage(`Valor mínimo: ${formatCurrency(minValue)}`);
      return;
    }

    if (value > maxValue) {
      setIsValid(false);
      setValidationMessage(`Valor máximo: ${formatCurrency(maxValue)}`);
      return;
    }

    setIsValid(true);
    setValidationMessage('✓ Valor válido');
  }, [value, minValue, maxValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove tudo que não é número
    const numericValue = inputValue.replace(/[^\d]/g, '');
    
    if (numericValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Converte para número (centavos)
    const numberValue = parseInt(numericValue) / 100;
    
    setDisplayValue(formatCurrency(numberValue));
    onChange(numberValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Mostra apenas números quando foca
    setDisplayValue(value > 0 ? value.toString().replace('.', ',') : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Formata quando perde o foco
    setDisplayValue(value > 0 ? formatCurrency(value) : '');
  };

  const getValidationColor = () => {
    if (value === 0) return 'text-gray-500';
    if (isValid) return 'text-green-500';
    return 'text-red-500';
  };

  const getValidationIcon = () => {
    if (value === 0) return null;
    if (isValid) {
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">R$</span>
        </div>
        
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            w-full pl-8 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        
        {/* Ícone de validação */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {getValidationIcon()}
        </div>
      </div>

      {/* Preview do valor formatado */}
      {value > 0 && !isFocused && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Valor:</span> {formatCurrency(value)}
        </div>
      )}

      {/* Status de validação */}
      {value > 0 && (
        <div className={`text-sm ${getValidationColor()}`}>
          {validationMessage}
        </div>
      )}

      {/* Dicas de validação */}
      <div className="text-xs text-gray-500">
        Valor mínimo: {formatCurrency(minValue)} | Valor máximo: {formatCurrency(maxValue)}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};