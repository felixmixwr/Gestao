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

interface PagamentoInfo {
  forma_pagamento: 'pix' | 'boleto' | 'a_vista'
  status: 'aguardando' | 'proximo_vencimento' | 'vencido' | 'pago'
  prazo_data?: string
}

/**
 * Busca informações de pagamento relacionadas à nota fiscal
 */
async function buscarInfoPagamento(relatorioId: string): Promise<PagamentoInfo | null> {
  try {
    const { data, error } = await supabase
      .from('pagamentos_receber')
      .select('forma_pagamento, status, prazo_data')
      .eq('relatorio_id', relatorioId)
      .single()

    if (error) {
      console.log(`Nenhuma informação de pagamento encontrada para relatório ${relatorioId}`)
      return null
    }

    return data
  } catch (error) {
    console.log('Erro ao buscar informações de pagamento:', error)
    return null
  }
}

/**
 * Formata informação de forma de pagamento
 */
function formatarFormaPagamento(forma: string): string {
  switch (forma) {
    case 'pix':
      return 'PIX'
    case 'boleto':
      return 'Boleto'
    case 'a_vista':
      return 'À Vista'
    default:
      return forma
  }
}

/**
 * Verifica se já existe um evento de vencimento para a nota fiscal
 */
async function verificarEventoVencimentoExistente(numeroNota: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('title', `💰 Vencimento NF: ${numeroNota}`)
      .limit(1)

    if (error) {
      console.warn(`Erro ao verificar evento de vencimento existente para NF ${numeroNota}:`, error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.warn(`Erro ao verificar evento de vencimento existente para NF ${numeroNota}:`, error)
    return false
  }
}

/**
 * Integração melhorada para criar evento de vencimento
 */
export async function integrarNFCriadaEnhanced(notaFiscal: NotaFiscalData) {
  console.log(`[Integração Planner Enhanced] Tentando integrar NF ${notaFiscal.numero_nota} (Criação)`)
  
  // Verificar se já existe evento de vencimento
  const jaExisteVencimento = await verificarEventoVencimentoExistente(notaFiscal.numero_nota)
  if (jaExisteVencimento) {
    console.log(`⏭️ Evento de vencimento para NF ${notaFiscal.numero_nota} já existe, ignorando...`)
    return
  }
  
  try {
    // Buscar categoria Financeiro
    const categorias = await PlannerAPI.getCategories()
    const categoriaFinanceiro = categorias.find(cat => 
      cat.name === 'Financeiro' || cat.name === 'Vencimentos'
    )

    if (!categoriaFinanceiro) {
      console.warn('⚠️ Categoria Financeiro não encontrada. Criando evento sem categoria.')
    }

    // Buscar informações de pagamento se disponível
    let infoPagamento: PagamentoInfo | null = null
    if (notaFiscal.relatorio_id) {
      infoPagamento = await buscarInfoPagamento(notaFiscal.relatorio_id)
    }

    const eventTitle = `💰 Vencimento NF: ${notaFiscal.numero_nota}`
    
    let eventDescription = `
      Nota Fiscal: ${notaFiscal.numero_nota}
      Valor: R$ ${notaFiscal.valor.toFixed(2).replace('.', ',')}
      Data de Emissão: ${new Date(notaFiscal.data_emissao).toLocaleDateString('pt-BR')}
      Data de Vencimento: ${new Date(notaFiscal.data_vencimento).toLocaleDateString('pt-BR')}
      Status: ${notaFiscal.status}
    `.trim()

    // Adicionar informação de forma de pagamento se disponível
    if (infoPagamento) {
      eventDescription += `\n      Forma de Pagamento: ${formatarFormaPagamento(infoPagamento.forma_pagamento)}`
    }

    if (notaFiscal.relatorio_id) {
      eventDescription += `\n      Relatório ID: ${notaFiscal.relatorio_id}`
    }

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

/**
 * Verifica se já existe um evento de pagamento para a nota fiscal
 */
async function verificarEventoPagamentoExistente(numeroNota: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('title', `✅ Pagamento NF: ${numeroNota}`)
      .limit(1)

    if (error) {
      console.warn(`Erro ao verificar evento de pagamento existente para NF ${numeroNota}:`, error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.warn(`Erro ao verificar evento de pagamento existente para NF ${numeroNota}:`, error)
    return false
  }
}

/**
 * Integração melhorada para criar evento de pagamento
 */
export async function integrarNFAtualizadaEnhanced(notaFiscal: NotaFiscalData, oldStatus: string) {
  console.log(`[Integração Planner Enhanced] Tentando integrar NF ${notaFiscal.numero_nota} (Atualização)`)

  // Lógica para criar evento de pagamento se o status mudar para Paga
  if (notaFiscal.status === 'Paga' && oldStatus !== 'Paga') {
    // Verificar se já existe evento de pagamento
    const jaExistePagamento = await verificarEventoPagamentoExistente(notaFiscal.numero_nota)
    if (jaExistePagamento) {
      console.log(`⏭️ Evento de pagamento para NF ${notaFiscal.numero_nota} já existe, ignorando...`)
      return
    }
    
    try {
      const categorias = await PlannerAPI.getCategories()
      const categoriaPagamentos = categorias.find(cat => 
        cat.name === 'Pagamentos' || cat.name === 'Pagos'
      )

      // Buscar informações de pagamento se disponível
      let infoPagamento: PagamentoInfo | null = null
      if (notaFiscal.relatorio_id) {
        infoPagamento = await buscarInfoPagamento(notaFiscal.relatorio_id)
      }

      const eventTitle = `✅ Pagamento NF: ${notaFiscal.numero_nota}`
      
      let eventDescription = `
        Nota Fiscal: ${notaFiscal.numero_nota}
        Valor: R$ ${notaFiscal.valor.toFixed(2).replace('.', ',')}
        Data de Emissão: ${new Date(notaFiscal.data_emissao).toLocaleDateString('pt-BR')}
        Data de Vencimento: ${new Date(notaFiscal.data_vencimento).toLocaleDateString('pt-BR')}
        Data de Pagamento: ${new Date().toLocaleDateString('pt-BR')}
        Status: Paga
      `.trim()

      // Adicionar informação de forma de pagamento se disponível
      if (infoPagamento) {
        eventDescription += `\n        Forma de Pagamento: ${formatarFormaPagamento(infoPagamento.forma_pagamento)}`
        
        // Adicionar ícone baseado na forma de pagamento
        const iconePagamento = infoPagamento.forma_pagamento === 'pix' ? '🔗' : '📄'
        eventDescription += `\n        ${iconePagamento} ${formatarFormaPagamento(infoPagamento.forma_pagamento)} Confirmado`
      }

      if (notaFiscal.relatorio_id) {
        eventDescription += `\n        Relatório ID: ${notaFiscal.relatorio_id}`
      }

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

  // Se o status voltar para 'Faturada' e não houver evento de vencimento, criar um
  if (notaFiscal.status === 'Faturada' && oldStatus !== 'Faturada') {
    // Verificar se já existe um evento de vencimento para esta NF
    const { data: existingEvents, error: fetchEventsError } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('title', `💰 Vencimento NF: ${notaFiscal.numero_nota}`)
      .eq('start_date', notaFiscal.data_vencimento)
      .limit(1)

    if (fetchEventsError) {
      console.error('Erro ao buscar eventos existentes:', fetchEventsError)
    }

    if (!existingEvents || existingEvents.length === 0) {
      await integrarNFCriadaEnhanced(notaFiscal)
    }
  }
}

/**
 * Integração melhorada para cancelar NF
 */
export async function integrarNFCanceladaEnhanced(numeroNota: string) {
  console.log(`[Integração Planner Enhanced] Tentando remover eventos para NF ${numeroNota} (Cancelada)`)
  
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
