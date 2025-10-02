import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import clsx from 'clsx'

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  error?: string
  required?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDisplayItems?: number
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  error,
  required,
  placeholder = 'Selecione as opções',
  className,
  disabled = false,
  maxDisplayItems = 3
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    
    onChange(newValue)
  }

  const handleRemoveOption = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const newValue = value.filter(v => v !== optionValue)
    onChange(newValue)
  }

  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder
    }

    const selectedOptions = options.filter(option => value.includes(option.value))
    
    if (selectedOptions.length <= maxDisplayItems) {
      return selectedOptions.map(option => option.label).join(', ')
    }

    return `${selectedOptions.slice(0, maxDisplayItems).map(option => option.label).join(', ')} +${selectedOptions.length - maxDisplayItems} mais`
  }

  const getSelectedOptions = () => {
    return options.filter(option => value.includes(option.value))
  }

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={handleToggle}
          className={clsx(
            'input py-3 px-4 text-base cursor-pointer flex items-center justify-between min-h-[48px]',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            disabled && 'bg-gray-100 cursor-not-allowed',
            isOpen && 'ring-2 ring-blue-500 border-blue-500'
          )}
        >
          <div className="flex-1">
            {value.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {getSelectedOptions().slice(0, maxDisplayItems).map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {option.label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveOption(option.value, e)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {getSelectedOptions().length > maxDisplayItems && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{getSelectedOptions().length - maxDisplayItems} mais
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronDown className={clsx('w-5 h-5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={clsx(
                  'px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between',
                  value.includes(option.value) && 'bg-blue-50 text-blue-900'
                )}
              >
                <span>{option.label}</span>
                {value.includes(option.value) && (
                  <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Mostrar todos os itens selecionados em uma lista compacta */}
      {value.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-600">
            {value.length} status selecionado{value.length > 1 ? 's' : ''}:
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {getSelectedOptions().map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(option.value, { stopPropagation: () => {} } as any)}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
