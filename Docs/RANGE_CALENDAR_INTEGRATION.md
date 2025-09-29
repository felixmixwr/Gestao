# Range Calendar Component - Documentação

## Visão Geral

O componente `RangeCalendar` foi integrado com sucesso ao projeto WorldRental_FelixMix. Este componente permite a seleção de intervalos de datas usando uma interface moderna e acessível.

## Estrutura do Projeto

### Arquivos Criados

1. **`/src/components/ui/range-calendar.tsx`** - Componente principal do calendário
2. **`/src/components/ui/button.tsx`** - Componente Button compatível com shadcn/ui
3. **`/src/lib/utils.ts`** - Função utilitária `cn` para combinação de classes
4. **`/src/components/ui/range-calendar-demo.tsx`** - Demo básico
5. **`/src/components/ui/range-calendar-example.tsx`** - Exemplo completo com estado

### Dependências Instaladas

- `lucide-react` - Ícones (ChevronLeft, ChevronRight)
- `react-aria-components` - Componentes acessíveis
- `@internationalized/date` - Manipulação de datas
- `class-variance-authority` - Sistema de variantes para classes CSS

## Como Usar

### Uso Básico

```tsx
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  RangeCalendar,
} from "@/components/ui/range-calendar"

function MyComponent() {
  return (
    <RangeCalendar aria-label="Selecionar datas" className="bg-background rounded-lg px-2 py-3 border">
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
  )
}
```

### Uso com Estado

```tsx
import React, { useState } from "react"
import { parseDate } from "@internationalized/date"
import { RangeCalendar, /* outros imports */ } from "@/components/ui/range-calendar"

function MyComponent() {
  const [value, setValue] = useState({
    start: parseDate("2024-01-01"),
    end: parseDate("2024-01-07"),
  })

  return (
    <RangeCalendar 
      value={value}
      onChange={setValue}
      aria-label="Selecionar intervalo de datas"
    >
      {/* estrutura do calendário */}
    </RangeCalendar>
  )
}
```

## Características

### Acessibilidade
- Totalmente acessível com screen readers
- Navegação por teclado
- Suporte a ARIA labels

### Responsividade
- Design mobile-first
- Adaptável a diferentes tamanhos de tela

### Customização
- Classes CSS personalizáveis
- Variantes de tema
- Integração com Tailwind CSS

## Integração com o Projeto

### Estrutura shadcn/ui
O projeto agora segue a estrutura padrão do shadcn/ui:
- Componentes em `/src/components/ui/`
- Utilitários em `/src/lib/utils.ts`
- Sistema de variantes com `class-variance-authority`

### Compatibilidade
- ✅ TypeScript configurado
- ✅ Tailwind CSS configurado
- ✅ Path mapping (`@/*`) configurado
- ✅ Compilação sem erros

## Próximos Passos

1. **Teste o componente** em uma página existente
2. **Customize o tema** conforme necessário
3. **Integre com formulários** existentes
4. **Adicione validações** se necessário

## Exemplo de Integração em Página Existente

Para usar em uma página existente, importe o componente:

```tsx
import { RangeCalendarExample } from "@/components/ui/range-calendar-example"

// Em sua página
<RangeCalendarExample />
```

## Troubleshooting

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme que o path mapping está funcionando
3. Verifique se o Tailwind CSS está configurado corretamente
4. Execute `npm run build` para verificar erros de compilação

