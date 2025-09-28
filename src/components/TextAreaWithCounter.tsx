import React, { useState } from 'react';

interface TextAreaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
}

/**
 * Componente de textarea com contador de caracteres
 */
export const TextAreaWithCounter: React.FC<TextAreaWithCounterProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder,
  maxLength = 500,
  rows = 3,
  required = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const getCharacterCountColor = () => {
    const percentage = (value.length / maxLength) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        
        {/* Contador de caracteres */}
        <div className="absolute bottom-2 right-2 text-xs">
          <span className={getCharacterCountColor()}>
            {value.length}/{maxLength}
          </span>
        </div>
      </div>

      {/* Preview do texto */}
      {value && isFocused && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">Preview:</span>
          <div className="mt-1 whitespace-pre-wrap">
            {value.length > 100 ? `${value.slice(0, 100)}...` : value}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
