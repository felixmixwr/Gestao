import { supabase } from './supabase'
import { PlannerAPI } from './planner-api'

/**
 * Integração Universal para TODOS os tipos de RECEITAS/PAGAMENTOS RECEBIDOS
 * Captura: PIX, Boleto, à vista, com/sem nota fiscal
 * NÃO inclui despesas (que são saídas de dinheiro)
 */

// Tipos de pagamento identificados (apenas RECEITAS, não despesas)
export type PaymentSource = 
  | 'pagamentos_receber'
  | 'reports_pagos' 
  | 'notas_fiscais_pagas'

export interface UniversalPaymentData {
  id: string
  source: PaymentSource
  valor: number
  data_pagamento: string
  forma_pagamento: string
  descricao: string
  cliente_nome?: string
  empresa_nome?: string
  observacoes?: string
  relatorio_id?: string
  nota_fiscal_numero?: string
}

/**
 * Busca todos os pagamentos de todas as fontes
 */
export async function buscarTodosPagamentos(): Promise<UniversalPaymentData[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.warn('Usuário não autenticado')
    return []
  }

  const todosPagamentos: UniversalPaymentData[] = []

  try {
    // 1. Pagamentos a Receber (status = 'pago')
    const { data: pagamentosReceber, error: errorPR } = await supabase
      .from('pagamentos_receber')
      .select(`
        id,
        valor_total,
        forma_pagamento,
        updated_at,
        observacoes,
        relatorio_id,
        clients!inner(name),
        reports!inner(report_number)
      `)
      .eq('status', 'pago')

    if (!errorPR && pagamentosReceber) {
      pagamentosReceber.forEach(pag => {
        todosPagamentos.push({
          id: pag.id,
          source: 'pagamentos_receber',
          valor: pag.valor_total,
          data_pagamento: pag.updated_at,
          forma_pagamento: pag.forma_pagamento,
          descricao: `Pagamento Recebido - Relatório ${pag.reports?.report_number || 'N/A'}`,
          cliente_nome: pag.clients?.name,
          observacoes: pag.observacoes,
          relatorio_id: pag.relatorio_id
        })
      })
    }

    // 2. Relatórios Pagos (status = 'PAGO')
    const { data: reportsPagos, error: errorRP } = await supabase
      .from('reports')
      .select(`
        id,
        total_value,
        paid_at,
        report_number,
        clients!inner(name),
        companies!inner(name)
      `)
      .eq('status', 'PAGO')
      .not('paid_at', 'is', null)

    if (!errorRP && reportsPagos) {
      reportsPagos.forEach(rel => {
        todosPagamentos.push({
          id: rel.id,
          source: 'reports_pagos',
          valor: rel.total_value,
          data_pagamento: rel.paid_at,
          forma_pagamento: 'Não especificado',
          descricao: `Relatório Pago - ${rel.report_number}`,
          cliente_nome: rel.clients?.name,
          empresa_nome: rel.companies?.name,
          relatorio_id: rel.id
        })
      })
    }

    // 3. Despesas Pagas (status = 'pago') - REMOVIDO pois são SAÍDAS, não receitas
    // As despesas pagas são custos/saídas, não pagamentos recebidos

    // 3. Notas Fiscais Pagas (status = 'Paga')
    const { data: notasPagas, error: errorNP } = await supabase
      .from('notas_fiscais')
      .select(`
        id,
        valor,
        data_emissao,
        numero_nota,
        status,
        relatorio_id,
        reports!inner(report_number, clients(name))
      `)
      .eq('status', 'Paga')

    if (!errorNP && notasPagas) {
      notasPagas.forEach(nota => {
        todosPagamentos.push({
          id: nota.id,
          source: 'notas_fiscais_pagas',
          valor: nota.valor,
          data_pagamento: nota.data_emissao, // Assumindo que foi paga na emissão
          forma_pagamento: 'Nota Fiscal',
          descricao: `Nota Fiscal Paga - NF ${nota.numero_nota}`,
          cliente_nome: nota.reports?.clients?.name,
          nota_fiscal_numero: nota.numero_nota,
          relatorio_id: nota.relatorio_id
        })
      })
    }

    console.log(`📊 Total de pagamentos encontrados: ${todosPagamentos.length}`)
    console.log(`💰 Pagamentos a Receber: ${pagamentosReceber?.length || 0}`)
    console.log(`📋 Relatórios Pagos: ${reportsPagos?.length || 0}`)
    console.log(`🧾 Notas Fiscais Pagas: ${notasPagas?.length || 0}`)
    console.log(`💸 Despesas REMOVIDAS (são saídas, não receitas)`)

    return todosPagamentos.sort((a, b) => 
      new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime()
    )

  } catch (error) {
    console.error('❌ Erro ao buscar pagamentos:', error)
    return []
  }
}

/**
 * Cria evento no planner para um pagamento específico
 */
export async function criarEventoPagamento(pagamento: UniversalPaymentData): Promise<void> {
  try {
    // Buscar categoria Pagamentos
    const categorias = await PlannerAPI.getCategories()
    const categoriaPagamentos = categorias.find(cat => 
      cat.name === 'Pagamentos' || cat.name === 'Pagos' || cat.name === 'Recebimentos'
    )

    if (!categoriaPagamentos) {
      console.warn('⚠️ Categoria "Pagamentos" não encontrada, criando evento sem categoria')
    }

    // Determinar ícone baseado na forma de pagamento
    const icone = getIconeFormaPagamento(pagamento.forma_pagamento)
    
    // Criar título do evento
    const titulo = `${icone} Pagamento: ${formatarValor(pagamento.valor)}`
    
    // Criar descrição detalhada
    const descricao = criarDescricaoPagamento(pagamento)

    // Data do pagamento (se não tiver, usar hoje)
    const dataPagamento = pagamento.data_pagamento || new Date().toISOString()

    // Criar evento no planner
    const eventData = {
      title: titulo,
      description: descricao,
      start_date: dataPagamento,
      end_date: dataPagamento,
      category_id: categoriaPagamentos?.id || '',
      reminder_minutes: 0 // Sem lembrete para pagamentos
    }
    
    console.log('📝 Dados do evento a ser criado:', eventData)
    
    await PlannerAPI.createEvent(eventData)

    console.log(`✅ Evento de pagamento criado: ${titulo}`)

  } catch (error) {
    console.error(`❌ Erro ao criar evento para pagamento ${pagamento.id}:`, error)
    throw error
  }
}

/**
 * Sincroniza TODOS os pagamentos com o planner
 */
export async function sincronizarTodosPagamentos(): Promise<void> {
  try {
    console.log('🔄 Iniciando sincronização universal de pagamentos...')
    
    const pagamentos = await buscarTodosPagamentos()
    
    if (pagamentos.length === 0) {
      console.log('✅ Nenhum pagamento encontrado para sincronizar')
      return
    }

    console.log(`📋 Processando ${pagamentos.length} pagamentos...`)

    let sucessos = 0
    let erros = 0
    let ignorados = 0

    for (const pagamento of pagamentos) {
      try {
        // Verificar se já existe evento para este pagamento
        const jaExiste = await verificarEventoPagamentoExistente(pagamento)
        
        if (jaExiste) {
          console.log(`⏭️ Evento para pagamento ${pagamento.id} já existe, ignorando...`)
          ignorados++
          continue
        }

        await criarEventoPagamento(pagamento)
        sucessos++

        // Pequena pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Erro ao processar pagamento ${pagamento.id}:`, error)
        erros++
      }
    }

    console.log('\n🎉 Sincronização universal concluída!')
    console.log(`✅ Eventos criados: ${sucessos}`)
    console.log(`⏭️ Eventos ignorados: ${ignorados}`)
    console.log(`❌ Erros: ${erros}`)
    console.log(`📊 Total processado: ${pagamentos.length}`)

  } catch (error) {
    console.error('❌ Erro geral na sincronização universal:', error)
    throw error
  }
}

/**
 * Verifica se já existe evento para um pagamento específico
 */
async function verificarEventoPagamentoExistente(pagamento: UniversalPaymentData): Promise<boolean> {
  try {
    const icone = getIconeFormaPagamento(pagamento.forma_pagamento)
    const titulo = `${icone} Pagamento: ${formatarValor(pagamento.valor)}`

    const { data, error } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('title', titulo)
      .limit(1)

    if (error) {
      console.warn(`Erro ao verificar evento existente para pagamento ${pagamento.id}:`, error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.warn(`Erro ao verificar evento existente para pagamento ${pagamento.id}:`, error)
    return false
  }
}

/**
 * Determina o ícone baseado na forma de pagamento
 */
function getIconeFormaPagamento(formaPagamento: string): string {
  const forma = formaPagamento.toLowerCase()
  
  if (forma.includes('pix')) return '💳'
  if (forma.includes('boleto')) return '🏦'
  if (forma.includes('vista') || forma.includes('dinheiro')) return '💵'
  if (forma.includes('cartao')) return '💳'
  if (forma.includes('nota') || forma.includes('fiscal')) return '🧾'
  
  return '💰' // Ícone padrão
}

/**
 * Formata valor para exibição
 */
function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * Cria descrição detalhada do pagamento
 */
function criarDescricaoPagamento(pagamento: UniversalPaymentData): string {
  let descricao = `💰 Pagamento Recebido\n\n`
  
  descricao += `💵 Valor: ${formatarValor(pagamento.valor)}\n`
  descricao += `📅 Data: ${new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}\n`
  descricao += `💳 Forma: ${pagamento.forma_pagamento}\n`
  descricao += `📋 Fonte: ${getSourceName(pagamento.source)}\n\n`

  if (pagamento.cliente_nome) {
    descricao += `👤 Cliente: ${pagamento.cliente_nome}\n`
  }

  if (pagamento.empresa_nome) {
    descricao += `🏢 Empresa: ${pagamento.empresa_nome}\n`
  }

  if (pagamento.nota_fiscal_numero) {
    descricao += `🧾 Nota Fiscal: ${pagamento.nota_fiscal_numero}\n`
  }

  if (pagamento.observacoes) {
    descricao += `\n📝 Observações: ${pagamento.observacoes}\n`
  }

  descricao += `\n🆔 ID: ${pagamento.id}`

  return descricao
}

/**
 * Retorna nome amigável da fonte
 */
function getSourceName(source: PaymentSource): string {
  switch (source) {
    case 'pagamentos_receber':
      return 'Pagamento a Receber'
    case 'reports_pagos':
      return 'Relatório Pago'
    case 'notas_fiscais_pagas':
      return 'Nota Fiscal Paga'
    default:
      return 'Pagamento'
  }
}

/**
 * Monitora mudanças em tempo real e cria eventos automaticamente
 */
export async function monitorarPagamentosTempoReal(): Promise<void> {
  console.log('🔍 Iniciando monitoramento de pagamentos em tempo real...')

  // Monitorar pagamentos_receber
  supabase
    .channel('pagamentos_receber_changes')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'pagamentos_receber',
        filter: 'status=eq.pago'
      }, 
      async (payload) => {
        console.log('🔔 Pagamento a receber marcado como pago:', payload.new)
        // Criar evento automaticamente
        try {
          // Buscar dados completos do pagamento
          const { data } = await supabase
            .from('pagamentos_receber')
            .select(`
              id,
              valor_total,
              forma_pagamento,
              updated_at,
              observacoes,
              relatorio_id,
              clients!inner(name),
              reports!inner(report_number)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            const pagamento: UniversalPaymentData = {
              id: data.id,
              source: 'pagamentos_receber',
              valor: data.valor_total,
              data_pagamento: data.updated_at,
              forma_pagamento: data.forma_pagamento,
              descricao: `Pagamento Recebido - Relatório ${data.reports?.report_number || 'N/A'}`,
              cliente_nome: data.clients?.name,
              observacoes: data.observacoes,
              relatorio_id: data.relatorio_id
            }

            await criarEventoPagamento(pagamento)
          }
        } catch (error) {
          console.error('❌ Erro ao criar evento em tempo real:', error)
        }
      }
    )
    .subscribe()

  console.log('✅ Monitoramento de pagamentos ativado!')
}
