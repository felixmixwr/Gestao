import React, { useState, useEffect } from 'react';
import { formatCEP } from '../utils/format';

interface CEPInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressFound?: (address: {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
  }) => void;
  error?: string;
  label: string;
  placeholder?: string;
}

/**
 * Componente de input para CEP com busca automática de endereço
 */
export const CEPInput: React.FC<CEPInputProps> = ({
  value,
  onChange,
  onAddressFound,
  error,
  label,
  placeholder = "00000-000"
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar displayValue quando value muda externamente
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove tudo que não é número
    const numericValue = inputValue.replace(/[^\d]/g, '');
    
    // Aplica máscara de CEP
    let maskedValue = '';
    
    if (numericValue.length <= 5) {
      maskedValue = numericValue;
    } else {
      maskedValue = `${numericValue.slice(0, 5)}-${numericValue.slice(5, 8)}`;
    }
    
    setDisplayValue(maskedValue);
    onChange(numericValue); // Salva apenas números
  };

  const handleBlur = async () => {
    if (value.length === 8) {
      setIsLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        
        if (!data.erro && onAddressFound) {
          onAddressFound({
            logradouro: data.logradouro,
            bairro: data.bairro,
            localidade: data.localidade,
            uf: data.uf
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoading(false);
      }
    }
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
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Preview do CEP formatado */}
      {value && value.length === 8 && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">CEP:</span> {formatCEP(value)}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
