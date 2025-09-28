import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  label: string;
  placeholder?: string;
}

/**
 * Componente de input para valores monetários com formatação automática
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = "0,00"
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Atualizar displayValue quando value muda externamente
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatCurrency(value) : '');
    }
  }, [value, isFocused]);

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

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
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
            w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
        />
      </div>

      {/* Preview do valor formatado */}
      {value > 0 && !isFocused && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Valor:</span> {formatCurrency(value)}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
