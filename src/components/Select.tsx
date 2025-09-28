// import { ReactNode } from 'react' // Removido import não utilizado
import clsx from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Select({
  label,
  options,
  value,
  onChange,
  error,
  required,
  placeholder = 'Selecione uma opção',
  className,
  disabled = false
}: SelectProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          'input py-3 px-4 text-base',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          disabled && 'bg-gray-100 cursor-not-allowed'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}


