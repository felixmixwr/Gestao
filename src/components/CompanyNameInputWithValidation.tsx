import React, { useState, useEffect, useMemo } from 'react';

interface CompanyNameInputWithValidationProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Componente de input para nome da empresa com sugestões e validação
 */
export const CompanyNameInputWithValidation: React.FC<CompanyNameInputWithValidationProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = "Nome da empresa cliente",
  required = false
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Sugestões de empresas comuns
  const commonCompanies = useMemo(() => [
    'Construtora ABC LTDA',
    'Empresa XYZ S/A',
    'Comércio e Serviços LTDA',
    'Indústria Nacional S/A',
    'Prestação de Serviços LTDA',
    'Comércio Varejista LTDA',
    'Serviços Gerais LTDA',
    'Construção Civil LTDA',
    'Comércio Atacadista LTDA',
    'Prestação de Serviços S/A'
  ], []);

  // Validar nome da empresa
  useEffect(() => {
    if (value.length === 0) {
      setIsValid(false);
      setValidationMessage('');
      return;
    }

    if (value.length < 3) {
      setIsValid(false);
      setValidationMessage('Nome da empresa muito curto');
      return;
    }

    if (value.length > 100) {
      setIsValid(false);
      setValidationMessage('Nome da empresa muito longo');
      return;
    }

    // Verificar se contém apenas letras, números, espaços e caracteres especiais
    const companyRegex = /^[a-zA-ZÀ-ÿ0-9\s\-'&.,()]+$/;
    if (!companyRegex.test(value)) {
      setIsValid(false);
      setValidationMessage('Nome da empresa contém caracteres inválidos');
      return;
    }

    // Verificar se não é apenas números
    if (/^\d+$/.test(value)) {
      setIsValid(false);
      setValidationMessage('Nome da empresa não pode ser apenas números');
      return;
    }

    setIsValid(true);
    setValidationMessage('✓ Nome da empresa válido');
  }, [value]);

  useEffect(() => {
    if (value.length > 2) {
      const filtered = commonCompanies.filter(company =>
        company.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, commonCompanies]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay para permitir clique na sugestão
    setTimeout(() => setShowSuggestions(false), 200);
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
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
        
        {/* Dropdown de sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview do nome da empresa */}
      {value && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Empresa:</span> {value}
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
