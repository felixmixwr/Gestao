import React, { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "R$ 0,00",
  className = "",
  id,
  required = false,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const isInternalUpdate = useRef(false);

  // Função para formatar valor de entrada (quando usuário digita)
  const formatCurrencyInput = (inputValue: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = inputValue.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Função para converter valor formatado de volta para número
  const parseCurrency = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    
    // Remove símbolos e espaços, mantém apenas números e vírgula
    const cleanValue = formattedValue.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Só atualizar displayValue se não for uma atualização interna
  useEffect(() => {
    if (!isInternalUpdate.current) {
      const formatted = formatCurrencyInput(value.toString());
      setDisplayValue(formatted);
    }
    isInternalUpdate.current = false;
  }, [value]);

  // Inicializar o displayValue na montagem
  useEffect(() => {
    const formatted = formatCurrencyInput(value.toString());
    setDisplayValue(formatted);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrencyInput(inputValue);
    
    setDisplayValue(formatted);
    
    // Marcar como atualização interna
    isInternalUpdate.current = true;
    
    // Converter para número e chamar onChange
    const numericValue = parseCurrency(formatted);
    onChange(numericValue);
  };

  return (
    <input
      type="text"
      id={id}
      required={required}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
};
