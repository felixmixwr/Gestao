import React, { useState, useEffect } from 'react';
import { formatDocument } from '../utils/format';

interface DocumentInputWithValidationProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
  placeholder?: string;
}

/**
 * Componente de input para CNPJ/CPF com validação e máscara automática
 */
export const DocumentInputWithValidation: React.FC<DocumentInputWithValidationProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = "00.000.000/0000-00"
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj' | 'unknown'>('unknown');
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Atualizar displayValue quando value muda externamente
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Detectar tipo de documento baseado no tamanho
  useEffect(() => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue.length <= 11) {
      setDocumentType('cpf');
    } else if (numericValue.length <= 14) {
      setDocumentType('cnpj');
    } else {
      setDocumentType('unknown');
    }
  }, [value]);

  // Validar documento
  useEffect(() => {
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue.length === 0) {
      setIsValid(false);
      setValidationMessage('');
      return;
    }

    if (documentType === 'cpf' && numericValue.length === 11) {
      // Validação básica de CPF
      const cpf = numericValue.split('').map(Number);
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += cpf[i] * (10 - i);
      }
      let remainder = sum % 11;
      let digit1 = remainder < 2 ? 0 : 11 - remainder;
      
      if (cpf[9] !== digit1) {
        setIsValid(false);
        setValidationMessage('CPF inválido');
        return;
      }
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += cpf[i] * (11 - i);
      }
      remainder = sum % 11;
      let digit2 = remainder < 2 ? 0 : 11 - remainder;
      
      if (cpf[10] !== digit2) {
        setIsValid(false);
        setValidationMessage('CPF inválido');
        return;
      }
      
      setIsValid(true);
      setValidationMessage('✓ CPF válido');
    } else if (documentType === 'cnpj' && numericValue.length === 14) {
      // Validação básica de CNPJ
      const cnpj = numericValue.split('').map(Number);
      let sum = 0;
      const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      for (let i = 0; i < 12; i++) {
        sum += cnpj[i] * weights1[i];
      }
      let remainder = sum % 11;
      let digit1 = remainder < 2 ? 0 : 11 - remainder;
      
      if (cnpj[12] !== digit1) {
        setIsValid(false);
        setValidationMessage('CNPJ inválido');
        return;
      }
      
      sum = 0;
      const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      for (let i = 0; i < 13; i++) {
        sum += cnpj[i] * weights2[i];
      }
      remainder = sum % 11;
      let digit2 = remainder < 2 ? 0 : 11 - remainder;
      
      if (cnpj[13] !== digit2) {
        setIsValid(false);
        setValidationMessage('CNPJ inválido');
        return;
      }
      
      setIsValid(true);
      setValidationMessage('✓ CNPJ válido');
    } else {
      setIsValid(false);
      setValidationMessage('Documento incompleto');
    }
  }, [value, documentType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove tudo que não é número
    const numericValue = inputValue.replace(/[^\d]/g, '');
    
    // Aplica máscara baseada no tipo de documento
    let maskedValue = '';
    
    if (numericValue.length <= 11) {
      // CPF: 000.000.000-00
      if (numericValue.length <= 3) {
        maskedValue = numericValue;
      } else if (numericValue.length <= 6) {
        maskedValue = `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
      } else if (numericValue.length <= 9) {
        maskedValue = `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
      } else {
        maskedValue = `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
      }
    } else {
      // CNPJ: 00.000.000/0000-00
      if (numericValue.length <= 2) {
        maskedValue = numericValue;
      } else if (numericValue.length <= 5) {
        maskedValue = `${numericValue.slice(0, 2)}.${numericValue.slice(2)}`;
      } else if (numericValue.length <= 8) {
        maskedValue = `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5)}`;
      } else if (numericValue.length <= 12) {
        maskedValue = `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5, 8)}/${numericValue.slice(8)}`;
      } else {
        maskedValue = `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5, 8)}/${numericValue.slice(8, 12)}-${numericValue.slice(12, 14)}`;
      }
    }
    
    setDisplayValue(maskedValue);
    onChange(numericValue); // Salva apenas números
  };

  const getPlaceholder = () => {
    if (documentType === 'cpf') return '000.000.000-00';
    if (documentType === 'cnpj') return '00.000.000/0000-00';
    return placeholder;
  };

  const getIcon = () => {
    if (documentType === 'cpf') {
      return (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
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
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getIcon()}
        </div>
        
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={getPlaceholder()}
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

      {/* Indicador de tipo de documento */}
      {value && value.length > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Tipo:</span> {
            documentType === 'cpf' ? 'CPF' : 
            documentType === 'cnpj' ? 'CNPJ' : 
            'Documento'
          } - {formatDocument(value)}
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