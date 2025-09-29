import React, { useState } from "react"
import { parseDate } from "@internationalized/date"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  RangeCalendar,
} from "@/components/ui/range-calendar"

export function RangeCalendarExample() {
  const [value, setValue] = useState({
    start: parseDate("2024-01-01"),
    end: parseDate("2024-01-07"),
  })

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Range Calendar Example</h2>
      <p className="text-gray-600">
        Selecione um intervalo de datas usando o calendário abaixo:
      </p>
      
      <RangeCalendar 
        aria-label="Selecionar intervalo de datas" 
        className="bg-background rounded-lg px-2 py-3 border shadow-sm"
        value={value}
        onChange={setValue}
      >
        <CalendarHeading />
        <CalendarGrid>
          <CalendarGridHeader>
            {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => <CalendarCell date={date} />}
          </CalendarGridBody>
        </CalendarGrid>
      </RangeCalendar>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Datas Selecionadas:</h3>
        <p>Início: {value.start.toString()}</p>
        <p>Fim: {value.end.toString()}</p>
      </div>
    </div>
  )
}

