import { supabase } from './supabase'
import { integrarNFCriadaEnhanced, integrarNFAtualizadaEnhanced } from './notas-fiscais-planner-integration-enhanced'

/**
 * Verifica se já existe um evento para uma nota fiscal específica
 */
async function verificarEventoExistente(numeroNota: string, tipoEvento: 'vencimento' | 'pagamento'): Promise<boolean> {
  try {
    const titulo = tipoEvento === 'vencimento' 
      ? `💰 Vencimento NF: ${numeroNota}`
      : `✅ Pagamento NF: ${numeroNota}`

    const { data, error } = await supabase
      .from('user_calendar_events')
      .select('id')
      .eq('title', titulo)
      .limit(1)

    if (error) {
      console.warn(`Erro ao verificar evento existente para NF ${numeroNota}:`, error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.warn(`Erro ao verificar evento existente para NF ${numeroNota}:`, error)
    return false
  }
}

/**
 * Sincroniza todas as notas fiscais existentes com o planner
 */
export async function sincronizarTodasNotasFiscais(): Promise<void> {
  try {
    console.log('🔄 Iniciando sincronização de todas as notas fiscais...')
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Usuário não autenticado, pulando sincronização')
      return
    }

    // Buscar todas as notas fiscais existentes
    const { data: notasFiscais, error } = await supabase
      .from('notas_fiscais')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Erro ao buscar notas fiscais:', error)
      throw new Error(`Erro ao buscar notas fiscais: ${error.message}`)
    }

    if (!notasFiscais || notasFiscais.length === 0) {
      console.log('✅ Nenhuma nota fiscal encontrada para sincronizar')
      return
    }

    console.log(`📋 Encontradas ${notasFiscais.length} notas fiscais para sincronizar`)

    let sucessos = 0
    let erros = 0
    let ignorados = 0

    for (const nota of notasFiscais) {
      try {
        console.log(`🔄 Verificando NF ${nota.numero_nota}...`)

        let processouAlgum = false

        // Para notas faturadas, verificar se já existe evento de vencimento
        if (nota.status === 'Faturada') {
          const jaExisteVencimento = await verificarEventoExistente(nota.numero_nota, 'vencimento')
          
          if (jaExisteVencimento) {
            console.log(`⏭️ Evento de vencimento para NF ${nota.numero_nota} já existe, ignorando...`)
            ignorados++
          } else {
            await integrarNFCriadaEnhanced({
              numero_nota: nota.numero_nota,
              valor: nota.valor,
              data_vencimento: nota.data_vencimento,
              data_emissao: nota.data_emissao,
              status: nota.status,
              relatorio_id: nota.relatorio_id
            })
            console.log(`✅ Evento de vencimento criado para NF ${nota.numero_nota}`)
            processouAlgum = true
          }
        }

        // Para notas pagas, verificar se já existe evento de pagamento
        if (nota.status === 'Paga') {
          const jaExistePagamento = await verificarEventoExistente(nota.numero_nota, 'pagamento')
          
          if (jaExistePagamento) {
            console.log(`⏭️ Evento de pagamento para NF ${nota.numero_nota} já existe, ignorando...`)
            ignorados++
          } else {
            await integrarNFAtualizadaEnhanced(
              {
                numero_nota: nota.numero_nota,
                valor: nota.valor,
                data_vencimento: nota.data_vencimento,
                data_emissao: nota.data_emissao,
                status: nota.status,
                relatorio_id: nota.relatorio_id
              },
              'Faturada' // Status anterior assumido
            )
            console.log(`✅ Evento de pagamento criado para NF ${nota.numero_nota}`)
            processouAlgum = true
          }
        }

        if (processouAlgum) {
          sucessos++
        }

        // Pequena pausa para não sobrecarregar o sistema
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Erro ao sincronizar NF ${nota.numero_nota}:`, error)
        erros++
      }
    }

    console.log(`\n🎉 Sincronização concluída!`)
    console.log(`✅ Eventos criados: ${sucessos}`)
    console.log(`⏭️ Eventos ignorados (já existiam): ${ignorados}`)
    console.log(`❌ Erros: ${erros}`)
    console.log(`📊 Total processado: ${notasFiscais.length}`)

  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error)
    throw error
  }
}

/**
 * Verifica se já existem eventos relacionados a notas fiscais
 */
export async function verificarEventosExistentes(): Promise<{ total: number; vencimentos: number; pagamentos: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { total: 0, vencimentos: 0, pagamentos: 0 }
    }

    // Buscar todos os eventos do usuário
    const { data: eventos, error } = await supabase
      .from('user_calendar_events')
      .select('title, description')
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao buscar eventos:', error)
      return { total: 0, vencimentos: 0, pagamentos: 0 }
    }

    if (!eventos) {
      return { total: 0, vencimentos: 0, pagamentos: 0 }
    }

    let vencimentos = 0
    let pagamentos = 0

    eventos.forEach(evento => {
      if (evento.title.includes('Vencimento NF:')) {
        vencimentos++
      } else if (evento.title.includes('Pagamento NF:')) {
        pagamentos++
      }
    })

    return {
      total: eventos.length,
      vencimentos,
      pagamentos
    }

  } catch (error) {
    console.error('Erro ao verificar eventos:', error)
    return { total: 0, vencimentos: 0, pagamentos: 0 }
  }
}
