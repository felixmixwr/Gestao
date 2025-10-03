import { supabase } from './supabase'
import { PlannerAPI, CreateEventData } from './planner-api'

// =============================================
// INTEGRAÇÃO NOTAS FISCAIS + PLANNER
// =============================================

export interface NotaFiscalEventData {
  numero_nota: string
  valor: number
  data_vencimento: string
  data_emissao: string
  status: 'Faturada' | 'Paga' | 'Cancelada'
  relatorio_id?: string
}

/**
 * Cria evento no planner para vencimento de nota fiscal
 */
export async function criarEventoVencimentoNF(notaData: NotaFiscalEventData): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Usuário não autenticado, pulando criação de evento')
      return
    }

    // Criar categoria específica para notas fiscais se não existir
    const categoriaFinanceira = await obterOuCriarCategoriaFinanceira()

    const eventoData: CreateEventData = {
      title: `💰 Vencimento NF: ${notaData.numero_nota}`,
      description: `Nota Fiscal ${notaData.numero_nota}\nValor: R$ ${notaData.valor.toFixed(2).replace('.', ',')}\nData Emissão: ${formatarData(notaData.data_emissao)}\nData Vencimento: ${formatarData(notaData.data_vencimento)}`,
      start_date: notaData.data_vencimento,
      all_day: true,
      category_id: categoriaFinanceira.id,
      location: 'Financeiro',
      reminder_minutes: 1440, // Lembrete 1 dia antes
      is_recurring: false
    }

    await PlannerAPI.createEvent(eventoData)
    console.log(`✅ Evento de vencimento criado para NF ${notaData.numero_nota}`)
    
  } catch (error) {
    console.error('❌ Erro ao criar evento de vencimento:', error)
    // Não falha a operação principal, apenas loga o erro
  }
}

/**
 * Cria evento no planner quando nota fiscal é marcada como paga
 */
export async function criarEventoPagamentoNF(notaData: NotaFiscalEventData): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Usuário não autenticado, pulando criação de evento')
      return
    }

    // Criar categoria específica para pagamentos se não existir
    const categoriaPagamento = await obterOuCriarCategoriaPagamento()

    const eventoData: CreateEventData = {
      title: `✅ Pagamento NF: ${notaData.numero_nota}`,
      description: `Nota Fiscal PAGA: ${notaData.numero_nota}\nValor: R$ ${notaData.valor.toFixed(2).replace('.', ',')}\nData Emissão: ${formatarData(notaData.data_emissao)}\nData Vencimento: ${formatarData(notaData.data_vencimento)}\nData Pagamento: ${formatarData(new Date().toISOString())}`,
      start_date: new Date().toISOString().split('T')[0], // Data atual
      all_day: true,
      category_id: categoriaPagamento.id,
      location: 'Financeiro',
      reminder_minutes: 0, // Sem lembrete para pagamentos
      is_recurring: false
    }

    await PlannerAPI.createEvent(eventoData)
    console.log(`✅ Evento de pagamento criado para NF ${notaData.numero_nota}`)
    
  } catch (error) {
    console.error('❌ Erro ao criar evento de pagamento:', error)
    // Não falha a operação principal, apenas loga o erro
  }
}

/**
 * Obtém ou cria categoria financeira para vencimentos
 */
async function obterOuCriarCategoriaFinanceira() {
  try {
    // Buscar categoria existente
    const categorias = await PlannerAPI.getCategories()
    let categoriaFinanceira = categorias.find(cat => 
      cat.name === 'Financeiro' || cat.name === 'Vencimentos'
    )

    if (!categoriaFinanceira) {
      // Criar nova categoria
      categoriaFinanceira = await PlannerAPI.createCategory({
        name: 'Financeiro',
        color: 'red',
        description: 'Eventos relacionados a vencimentos e cobranças financeiras'
      })
    }

    return categoriaFinanceira
  } catch (error) {
    console.error('Erro ao obter/criar categoria financeira:', error)
    throw new Error(`Falha ao criar categoria Financeiro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Obtém ou cria categoria de pagamentos
 */
async function obterOuCriarCategoriaPagamento() {
  try {
    // Buscar categoria existente
    const categorias = await PlannerAPI.getCategories()
    let categoriaPagamento = categorias.find(cat => 
      cat.name === 'Pagamentos' || cat.name === 'Recebimentos'
    )

    if (!categoriaPagamento) {
      // Criar nova categoria
      categoriaPagamento = await PlannerAPI.createCategory({
        name: 'Pagamentos',
        color: 'green',
        description: 'Eventos relacionados a pagamentos e recebimentos confirmados'
      })
    }

    return categoriaPagamento
  } catch (error) {
    console.error('Erro ao obter/criar categoria de pagamentos:', error)
    throw new Error(`Falha ao criar categoria Pagamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Formata data para exibição
 */
function formatarData(dataISO: string): string {
  const data = new Date(dataISO)
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Remove eventos relacionados a uma nota fiscal quando ela é cancelada
 */
export async function removerEventosNF(numeroNota: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Usuário não autenticado, pulando remoção de eventos')
      return
    }

    // Buscar eventos relacionados à nota fiscal
    const eventos = await PlannerAPI.getEvents()
    const eventosNF = eventos.filter(evento => 
      evento.title.includes(`NF: ${numeroNota}`) || 
      evento.title.includes(`NF ${numeroNota}`)
    )

    // Remover cada evento encontrado
    for (const evento of eventosNF) {
      await PlannerAPI.deleteEvent(evento.id)
      console.log(`🗑️ Evento removido: ${evento.title}`)
    }

    if (eventosNF.length > 0) {
      console.log(`✅ ${eventosNF.length} evento(s) removido(s) para NF ${numeroNota}`)
    }
    
  } catch (error) {
    console.error('❌ Erro ao remover eventos da NF:', error)
  }
}

/**
 * Integração principal - chamada quando nota fiscal é criada
 */
export async function integrarNFCriada(notaData: NotaFiscalEventData): Promise<void> {
  console.log('🔄 Integrando nota fiscal criada com planner...')
  
  if (notaData.status === 'Faturada') {
    await criarEventoVencimentoNF(notaData)
  }
}

/**
 * Integração principal - chamada quando nota fiscal é atualizada
 */
export async function integrarNFAtualizada(notaData: NotaFiscalEventData, statusAnterior: string): Promise<void> {
  console.log('🔄 Integrando atualização de nota fiscal com planner...')
  
  // Se mudou para "Paga"
  if (statusAnterior !== 'Paga' && notaData.status === 'Paga') {
    await criarEventoPagamentoNF(notaData)
  }
  
  // Se mudou para "Cancelada"
  if (statusAnterior !== 'Cancelada' && notaData.status === 'Cancelada') {
    await removerEventosNF(notaData.numero_nota)
  }
}
