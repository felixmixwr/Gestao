import { supabase } from '../lib/supabase'

/**
 * Gera um número único de relatório
 * Tenta usar RPC primeiro, depois fallback para geração sequencial
 */
export async function generateReportNumber(date: string): Promise<string> {
  try {
    // Primeira tentativa: usar RPC se disponível
    const { data, error } = await supabase.rpc('create_report_with_number', {
      date_param: date,
      payload_json: {}
    })

    if (!error && data?.report_number) {
      console.log('Número gerado via RPC:', data.report_number)
      return data.report_number
    }
  } catch (error) {
    console.log('RPC não disponível, usando fallback:', error)
  }

  // Segunda tentativa: geração sequencial baseada na data
  try {
    const dateObj = new Date(date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`

    // Buscar o último número usado para esta data
    const { data: lastReport, error } = await supabase
      .from('reports')
      .select('report_number')
      .like('report_number', `RPT-${dateStr}-%`)
      .order('report_number', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (!error && lastReport?.report_number) {
      const match = lastReport.report_number.match(/RPT-\d{8}-(\d{4})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    // Gerar número com padding de 4 dígitos
    const reportNumber = `RPT-${dateStr}-${String(nextNumber).padStart(4, '0')}`
    
    // Verificar se já existe (dupla verificação)
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('report_number', reportNumber)
      .single()

    if (existingReport) {
      // Se existe, tentar próximo número
      nextNumber++
      return `RPT-${dateStr}-${String(nextNumber).padStart(4, '0')}`
    }

    console.log('Número gerado via fallback:', reportNumber)
    return reportNumber

  } catch (error) {
    console.error('Erro na geração sequencial:', error)
    
    // Terceira tentativa: geração com timestamp
    const timestamp = Date.now().toString().slice(-6)
    const dateObj = new Date(date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    
    const reportNumber = `RPT-${dateStr}-${timestamp}`
    console.log('Número gerado via timestamp:', reportNumber)
    return reportNumber
  }
}

/**
 * Gera um número simples de relatório (formato antigo)
 * Para compatibilidade com relatórios existentes
 */
export async function generateSimpleReportNumber(): Promise<string> {
  try {
    // Buscar o último número usado
    const { data: lastReport } = await supabase
      .from('reports')
      .select('report_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastReport?.report_number) {
      // Tentar diferentes formatos
      const patterns = [
        /#REL-(\d+)/,
        /REL-(\d+)/,
        /RPT-\d{8}-(\d{4})/,
        /(\d+)/
      ]
      
      for (const pattern of patterns) {
        const match = lastReport.report_number.match(pattern)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
          break
        }
      }
    }

    const reportNumber = `#REL-${String(nextNumber).padStart(2, '0')}`
    
    // Verificar se já existe
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('report_number', reportNumber)
      .single()

    if (existingReport) {
      nextNumber++
      return `#REL-${String(nextNumber).padStart(2, '0')}`
    }

    return reportNumber

  } catch (error) {
    console.error('Erro na geração simples:', error)
    // Fallback com timestamp
    const timestamp = Date.now().toString().slice(-4)
    return `#REL-${timestamp}`
  }
}
