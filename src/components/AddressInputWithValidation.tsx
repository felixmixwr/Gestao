import React, { useState, useEffect, useMemo } from 'react';

interface AddressInputWithValidationProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
  placeholder?: string;
}

/**
 * Componente de input para endereço com sugestões e validação
 */
export const AddressInputWithValidation: React.FC<AddressInputWithValidationProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder = "Rua, número, bairro"
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Sugestões de endereços comuns
  const commonAddresses = useMemo(() => [
    'Rua das Flores, 123, Centro',
    'Avenida Principal, 456, Jardim das Américas',
    'Rua Comercial, 789, Centro',
    'Avenida Industrial, 321, Distrito Industrial',
    'Rua Residencial, 654, Vila Nova',
    'Avenida Comercial, 987, Centro',
    'Rua das Palmeiras, 147, Jardim Botânico',
    'Avenida das Nações, 258, Centro',
    'Rua das Rosas, 369, Vila das Flores',
    'Avenida Central, 741, Centro'
  ], []);

  // Validar endereço
  useEffect(() => {
    if (value.length === 0) {
      setIsValid(false);
      setValidationMessage('');
      return;
    }

    if (value.length < 5) {
      setIsValid(false);
      setValidationMessage('Endereço muito curto');
      return;
    }

    if (value.length > 100) {
      setIsValid(false);
      setValidationMessage('Endereço muito longo');
      return;
    }

    // Verificar se contém pelo menos uma vírgula (separador comum)
    if (!value.includes(',')) {
      setIsValid(false);
      setValidationMessage('Endereço deve conter vírgulas para separar rua, número e bairro');
      return;
    }

    setIsValid(true);
    setValidationMessage('✓ Endereço válido');
  }, [value]);

  useEffect(() => {
    if (value.length > 3) {
      const filtered = commonAddresses.filter(address =>
        address.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, commonAddresses]);

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
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

      {/* Preview do endereço */}
      {value && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Endereço:</span> {value}
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
