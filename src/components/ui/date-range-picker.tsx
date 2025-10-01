"use client"

import React, { useState } from "react"
import { parseDate } from "@internationalized/date"
import {
  JollyRangeCalendar,
} from "@/components/ui/range-calendar"
import { Calendar, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  value: { start: string; end: string } | null
  onChange: (value: { start: string; end: string } | null) => void
  error?: string
  label: string
  placeholder?: string
  minDate?: string
  maxDate?: string
  required?: boolean
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  error,
  label,
  placeholder,
  minDate,
  maxDate,
  required = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Converter strings para DateValue
  const selectedRange = value && value.start && value.end && value.start.trim() && value.end.trim() ? {
    start: parseDate(value.start),
    end: parseDate(value.end)
  } : null
  
  // Converter min/max dates
  const minDateValue = minDate && minDate.trim() ? parseDate(minDate) : undefined
  const maxDateValue = maxDate && maxDate.trim() ? parseDate(maxDate) : undefined

  const handleRangeChange = (range: any) => {
    if (range) {
      // Converter para formato YYYY-MM-DD para evitar problemas de fuso horário
      const formatDate = (date: any) => {
        const year = date.year
        const month = String(date.month).padStart(2, '0')
        const day = String(date.day).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      onChange({
        start: formatDate(range.start),
        end: formatDate(range.end)
      })
    } else {
      onChange(null)
    }
    setIsOpen(false)
  }

  const formatDisplayRange = (range: { start: string; end: string } | null) => {
    if (!range) return placeholder || "Selecionar período"
    
    // Usar o formato YYYY-MM-DD diretamente para evitar problemas de fuso horário
    const formatDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('pt-BR')
    }
    
    const startFormatted = formatDate(range.start)
    const endFormatted = formatDate(range.end)
    
    return `${startFormatted} - ${endFormatted}`
  }

  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md text-left font-normal",
            "bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
            !value && "text-gray-500",
            error && "border-red-300"
          )}
        >
          <Calendar className="mr-2 h-4 w-4 inline" />
          {formatDisplayRange(value)}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Selecionar Período</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <JollyRangeCalendar
                value={selectedRange}
                onChange={handleRangeChange}
                minValue={minDateValue}
                maxValue={maxDateValue}
                className="border-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dicas de validação */}
      {minDate && (
        <div className="text-xs text-gray-500">
          Data mínima: {new Date(minDate).toLocaleDateString('pt-BR')}
        </div>
      )}
      
      {maxDate && (
        <div className="text-xs text-gray-500">
          Data máxima: {new Date(maxDate).toLocaleDateString('pt-BR')}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
