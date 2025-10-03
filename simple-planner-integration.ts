import { PlannerAPI, CreateEventData } from './planner-api'
import { supabase } from './supabase'

interface NotaFiscalData {
  numero_nota: string
  valor: number
  data_vencimento: string
  data_emissao: string
  status: string
  relatorio_id?: string
}

/**
 * Versão simplificada da integração que assume categorias pré-existentes
 */
export async function integrarNFCriadaSimples(notaFiscal: NotaFiscalData) {
  console.log(`[Integração Planner] Tentando integrar NF ${notaFiscal.numero_nota} (Criação)`)
  
  try {
    // Buscar categoria Financeiro (deve existir)
    const categorias = await PlannerAPI.getCategories()
    const categoriaFinanceiro = categorias.find(cat => 
      cat.name === 'Financeiro' || cat.name === 'Vencimentos'
    )

    if (!categoriaFinanceiro) {
      console.warn('⚠️ Categoria Financeiro não encontrada. Criando evento sem categoria.')
    }

    const eventTitle = `💰 Vencimento NF: ${notaFiscal.numero_nota}`
    const eventDescription = `
      Nota Fiscal: ${notaFiscal.numero_nota}
      Valor: R$ ${notaFiscal.valor.toFixed(2).replace('.', ',')}
      Data de Emissão: ${new Date(notaFiscal.data_emissao).toLocaleDateString('pt-BR')}
      Data de Vencimento: ${new Date(notaFiscal.data_vencimento).toLocaleDateString('pt-BR')}
      Status: ${notaFiscal.status}
      ${notaFiscal.relatorio_id ? `Relatório ID: ${notaFiscal.relatorio_id}` : ''}
    `.trim()

    const eventData: CreateEventData = {
      title: eventTitle,
      description: eventDescription,
      start_date: notaFiscal.data_vencimento,
      all_day: true,
      category_id: categoriaFinanceiro?.id || '',
      location: 'Financeiro',
      reminder_minutes: 1440, // 1 dia antes
      is_recurring: false,
    }

    const newEvent = await PlannerAPI.createEvent(eventData)
    console.log(`✅ Evento de vencimento criado para NF ${notaFiscal.numero_nota}:`, newEvent)
    
  } catch (error) {
    console.error(`❌ Erro ao criar evento de vencimento para NF ${notaFiscal.numero_nota}:`, error)
    throw error
  }
}

export async function integrarNFAtualizadaSimples(notaFiscal: NotaFiscalData, oldStatus: string) {
  console.log(`[Integração Planner] Tentando integrar NF ${notaFiscal.numero_nota} (Atualização)`)

  // Lógica para criar evento de pagamento se o status mudar para Paga
  if (notaFiscal.status === 'Paga' && oldStatus !== 'Paga') {
    try {
      const categorias = await PlannerAPI.getCategories()
      const categoriaPagamentos = categorias.find(cat => 
        cat.name === 'Pagamentos' || cat.name === 'Pagos'
      )

      const eventTitle = `✅ Pagamento NF: ${notaFiscal.numero_nota}`
      const eventDescription = `
        Nota Fiscal: ${notaFiscal.numero_nota}
        Valor: R$ ${notaFiscal.valor.toFixed(2).replace('.', ',')}
        Data de Emissão: ${new Date(notaFiscal.data_emissao).toLocaleDateString('pt-BR')}
        Data de Vencimento: ${new Date(notaFiscal.data_vencimento).toLocaleDateString('pt-BR')}
        Data de Pagamento: ${new Date().toLocaleDateString('pt-BR')}
        Status: Paga
        ${notaFiscal.relatorio_id ? `Relatório ID: ${notaFiscal.relatorio_id}` : ''}
      `.trim()

      const eventData: CreateEventData = {
        title: eventTitle,
        description: eventDescription,
        start_date: new Date().toISOString().split('T')[0], // Data atual
        all_day: true,
        category_id: categoriaPagamentos?.id || '',
        location: 'Financeiro',
        is_recurring: false,
      }

      const newEvent = await PlannerAPI.createEvent(eventData)
      console.log(`✅ Evento de pagamento criado para NF ${notaFiscal.numero_nota}:`, newEvent)
      
    } catch (error) {
      console.error(`❌ Erro ao criar evento de pagamento para NF ${notaFiscal.numero_nota}:`, error)
      throw error
    }
  }
}

export async function integrarNFCanceladaSimples(numeroNota: string) {
  console.log(`[Integração Planner] Tentando remover eventos para NF ${numeroNota} (Cancelada)`)
  
  try {
    // Buscar e deletar eventos de vencimento
    const { data: vencimentoEvents, error: vencimentoError } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('title', `💰 Vencimento NF: ${numeroNota}`)

    if (vencimentoError) {
      console.error(`Erro ao buscar eventos de vencimento para NF ${numeroNota}:`, vencimentoError)
    } else if (vencimentoEvents && vencimentoEvents.length > 0) {
      for (const event of vencimentoEvents) {
        await PlannerAPI.deleteEvent(event.id)
        console.log(`🗑️ Evento de vencimento ${event.id} para NF ${numeroNota} removido.`)
      }
    }

    // Buscar e deletar eventos de pagamento
    const { data: pagamentoEvents, error: pagamentoError } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('title', `✅ Pagamento NF: ${numeroNota}`)

    if (pagamentoError) {
      console.error(`Erro ao buscar eventos de pagamento para NF ${numeroNota}:`, pagamentoError)
    } else if (pagamentoEvents && pagamentoEvents.length > 0) {
      for (const event of pagamentoEvents) {
        await PlannerAPI.deleteEvent(event.id)
        console.log(`🗑️ Evento de pagamento ${event.id} para NF ${numeroNota} removido.`)
      }
    }
    
    console.log(`✅ Todos os eventos para NF ${numeroNota} removidos com sucesso.`)
    
  } catch (error) {
    console.error(`❌ Erro ao remover eventos para NF ${numeroNota}:`, error)
    throw error
  }
}

