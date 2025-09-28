import React from 'react';

interface CompanySelectorProps {
  value: 'felixmix' | 'worldrental';
  onChange: (value: 'felixmix' | 'worldrental') => void;
  error?: string;
}

/**
 * Componente para seleção de empresa com visual aprimorado
 */
export const CompanySelector: React.FC<CompanySelectorProps> = ({ value, onChange, error }) => {
  const companies = [
    {
      id: 'felixmix' as const,
      name: 'Félix Mix',
      description: 'Especializada em bombas e equipamentos',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      selectedBgColor: 'bg-blue-100',
      selectedBorderColor: 'border-blue-500'
    },
    {
      id: 'worldrental' as const,
      name: 'World Rental',
      description: 'Locação de equipamentos industriais',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      selectedBgColor: 'bg-green-100',
      selectedBorderColor: 'border-green-500'
    }
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Logo da Empresa *
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {companies.map((company) => {
          const isSelected = value === company.id;
          
          return (
            <button
              key={company.id}
              type="button"
              onClick={() => onChange(company.id)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? `${company.selectedBgColor} ${company.selectedBorderColor} ring-2 ring-${company.color}-200` 
                  : `${company.bgColor} ${company.borderColor} hover:${company.selectedBgColor}`
                }
                ${error ? 'border-red-300' : ''}
              `}
            >
              {/* Checkbox visual */}
              <div className="absolute top-2 right-2">
                {isSelected ? (
                  <div className={`w-5 h-5 bg-${company.color}-500 rounded-full flex items-center justify-center`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="text-left">
                <div className={`font-semibold ${company.textColor}`}>
                  {company.name}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {company.description}
                </div>
              </div>

              {/* Logo placeholder */}
              <div className={`mt-3 w-12 h-12 ${company.bgColor} rounded-lg flex items-center justify-center`}>
                <div className={`text-2xl font-bold ${company.textColor}`}>
                  {company.id === 'felixmix' ? 'FM' : 'WR'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
