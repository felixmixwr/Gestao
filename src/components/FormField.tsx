import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface BaseFieldProps {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

function FormFieldBase({ label, error, required, className, children }: BaseFieldProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  error?: string
  required?: boolean
  className?: string
}

export function FormField({ label, error, required, className, ...inputProps }: InputProps) {
  return (
    <FormFieldBase label={label} error={error} required={required} className={className}>
      <input
        className={clsx(
          'input py-3 px-4 text-base',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
        )}
        {...inputProps}
      />
    </FormFieldBase>
  )
}

// Componente para usar com children (como Select, etc.)
export function FormFieldContainer({ label, error, required, className, children }: BaseFieldProps) {
  return (
    <FormFieldBase label={label} error={error} required={required} className={className}>
      {children}
    </FormFieldBase>
  )
}

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string
  error?: string
  required?: boolean
  className?: string
}

export function FormTextarea({ label, error, required, className, ...textareaProps }: TextareaProps) {
  return (
    <FormFieldBase label={label} error={error} required={required} className={className}>
      <textarea
        className={clsx(
          'input resize-none py-3 px-4 text-base',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
        )}
        rows={5}
        {...textareaProps}
      />
    </FormFieldBase>
  )
}
