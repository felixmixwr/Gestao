import React, { useState, useEffect } from 'react';
import { formatPhone } from '../utils/format';

interface PhoneInputWithValidationProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Componente de input para telefone com validação e máscara automática
 */
export const PhoneInputWithValidation: React.FC<PhoneInputWithValidationProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = "(11) 99999-9999",
  required = false
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Atualizar displayValue quando value muda externamente
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Validar telefone
  useEffect(() => {
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue.length === 0) {
      setIsValid(false);
      setValidationMessage('');
      return;
    }

    if (numericValue.length < 10) {
      setIsValid(false);
      setValidationMessage('Telefone deve ter pelo menos 10 dígitos');
      return;
    }

    if (numericValue.length > 11) {
      setIsValid(false);
      setValidationMessage('Telefone deve ter no máximo 11 dígitos');
      return;
    }

    // Verificar se o DDD é válido (11-99)
    const ddd = parseInt(numericValue.slice(0, 2));
    if (ddd < 11 || ddd > 99) {
      setIsValid(false);
      setValidationMessage('DDD inválido');
      return;
    }

    setIsValid(true);
    setValidationMessage('✓ Telefone válido');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove tudo que não é número
    const numericValue = inputValue.replace(/[^\d]/g, '');
    
    // Aplica máscara baseada no tamanho
    let maskedValue = '';
    
    if (numericValue.length <= 2) {
      maskedValue = numericValue;
    } else if (numericValue.length <= 6) {
      maskedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
    } else if (numericValue.length <= 10) {
      maskedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
    } else {
      maskedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
    }
    
    setDisplayValue(maskedValue);
    onChange(numericValue); // Salva apenas números
  };

  const getValidationColor = () => {
    if (value.length === 0) return 'text-gray-500';
    if (isValid) return 'text-green-500';
    return 'text-red-500';
  };

  const getValidationIcon = () => {
    if (value.length === 0) return null;
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
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        
        {/* Ícone de validação */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {getValidationIcon()}
        </div>
      </div>

      {/* Preview do telefone formatado */}
      {value && value.length >= 10 && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Telefone:</span> {formatPhone(value)}
        </div>
      )}

      {/* Status de validação */}
      {value.length > 0 && (
        <div className={`text-sm ${getValidationColor()}`}>
          {validationMessage}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};