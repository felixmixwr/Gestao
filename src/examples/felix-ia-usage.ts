/**
 * Exemplos de uso da FELIX IA - WorldRental Felix Mix
 * Demonstra como utilizar as funções principais da FELIX IA
 */

import { 
  felixAsk, 
  felixAnalyzeData, 
  felixGenerateReport, 
  isFelixConfigured,
  getFelixInfo,
  felixAnalyzeFinancial,
  felixAnalyzePumps,
  felixAnalyzeCollaborators,
  felixAnalyzeReports,
  felixGenerateExecutiveReport,
  felixAnalyzeFinancialTrends,
  felixAnalyzeOperations
} from '../lib/felix-ia'

// Exemplo 1: Pergunta simples para a FELIX IA
async function exemploPerguntaSimples() {
  console.log('🤖 [EXEMPLO] Pergunta simples para FELIX IA')
  
  const resposta = await felixAsk(
    'Qual é a situação atual das bombas de concreto da empresa? Preciso de um resumo executivo.'
  )
  
  console.log('Resposta:', resposta)
  return resposta
}

// Exemplo 2: Análise de dados financeiros
async function exemploAnaliseFinanceira() {
  console.log('🤖 [EXEMPLO] Análise de dados financeiros')
  
  const dadosFinanceiros = {
    receitas: {
      janeiro: 150000,
      fevereiro: 180000,
      marco: 165000
    },
    despesas: {
      janeiro: 120000,
      fevereiro: 140000,
      marco: 130000
    },
    lucro_liquido: {
      janeiro: 30000,
      fevereiro: 40000,
      marco: 35000
    },
    bombas_ativas: 8,
    clientes_ativos: 25
  }
  
  const analise = await felixAnalyzeData(
    dadosFinanceiros, 
    'Analisar performance financeira do primeiro trimestre e identificar oportunidades de crescimento'
  )
  
  console.log('Análise financeira:', analise)
  return analise
}

// Exemplo 3: Análise de dados operacionais
async function exemploAnaliseOperacional() {
  console.log('🤖 [EXEMPLO] Análise de dados operacionais')
  
  const dadosOperacionais = {
    programacao_semanal: {
      segunda: 4,
      terca: 6,
      quarta: 5,
      quinta: 7,
      sexta: 8,
      sabado: 3,
      domingo: 1
    },
    bombas_utilizacao: {
      'Bomba-01': { horas: 45, volume: 1200, status: 'ativa' },
      'Bomba-02': { horas: 38, volume: 980, status: 'manutencao' },
      'Bomba-03': { horas: 52, volume: 1450, status: 'ativa' }
    },
    clientes_volume: {
      'Construtora ABC': 800,
      'Obras XYZ': 650,
      'Engenharia 123': 420
    }
  }
  
  const analise = await felixAnalyzeData(
    dadosOperacionais,
    'Otimizar programação de bombas e identificar gargalos operacionais'
  )
  
  console.log('Análise operacional:', analise)
  return analise
}

// Exemplo 4: Geração de relatório mensal
async function exemploRelatorioMensal() {
  console.log('🤖 [EXEMPLO] Geração de relatório mensal')
  
  const contextoRelatorio = {
    report_type: 'Relatório Mensal de Performance',
    period: 'Março 2024',
    data: {
      faturamento_total: 165000,
      volume_bombeado: 4200,
      bombas_ativas: 8,
      clientes_atendidos: 25,
      horas_trabalhadas: 320,
      despesas_operacionais: 130000,
      lucro_liquido: 35000
    },
    metrics: {
      ticket_medio: 6600,
      utilizacao_bombas: 0.75,
      satisfacao_cliente: 4.2,
      eficiencia_operacional: 0.85
    }
  }
  
  const relatorio = await felixGenerateReport(contextoRelatorio)
  
  console.log('Relatório mensal:', relatorio)
  return relatorio
}

// Exemplo 5: Análise de RH e colaboradores
async function exemploAnaliseRH() {
  console.log('🤖 [EXEMPLO] Análise de RH e colaboradores')
  
  const dadosRH = {
    colaboradores: {
      motoristas: 6,
      auxiliares: 8,
      administrativos: 3
    },
    custos_mensais: {
      salarios: 45000,
      horas_extras: 8500,
      beneficios: 12000
    },
    produtividade: {
      horas_por_colaborador: 180,
      eficiencia_media: 0.88,
      absenteismo: 0.05
    }
  }
  
  const analise = await felixAnalyzeData(
    dadosRH,
    'Otimizar custos de RH e melhorar produtividade da equipe'
  )
  
  console.log('Análise de RH:', analise)
  return analise
}

// Exemplo 6: Pergunta com contexto específico
async function exemploPerguntaComContexto() {
  console.log('🤖 [EXEMPLO] Pergunta com contexto específico')
  
  const contexto = {
    cliente: 'Construtora ABC',
    bomba: 'Bomba-01',
    periodo: 'últimos 30 dias',
    volume_bombeado: 1200,
    horas_utilizacao: 45,
    status_pagamento: 'em dia'
  }
  
  const resposta = await felixAsk(
    'Como está a performance deste cliente? Quais são as oportunidades de crescimento?',
    contexto
  )
  
  console.log('Resposta com contexto:', resposta)
  return resposta
}

// Exemplo 7: Verificação de configuração
function exemploVerificacaoConfig() {
  console.log('🤖 [EXEMPLO] Verificação de configuração')
  
  const configurado = isFelixConfigured()
  const info = getFelixInfo()
  
  console.log('FELIX IA configurada:', configurado)
  console.log('Informações:', info)
  
  return { configurado, info }
}

// ========================================
// EXEMPLOS DAS FUNÇÕES INTEGRADAS COM SUPABASE
// ========================================

// Exemplo 8: Análise financeira integrada
async function exemploAnaliseFinanceiraIntegrada() {
  console.log('💰 [EXEMPLO] Análise financeira integrada com Supabase')
  
  const analise = await felixAnalyzeFinancial()
  
  console.log('Análise financeira integrada:', analise)
  return analise
}

// Exemplo 9: Análise de bombas integrada
async function exemploAnaliseBombasIntegrada() {
  console.log('🚛 [EXEMPLO] Análise de bombas integrada com Supabase')
  
  const analise = await felixAnalyzePumps()
  
  console.log('Análise de bombas integrada:', analise)
  return analise
}

// Exemplo 10: Análise de colaboradores integrada
async function exemploAnaliseColaboradoresIntegrada() {
  console.log('👥 [EXEMPLO] Análise de colaboradores integrada com Supabase')
  
  const analise = await felixAnalyzeCollaborators()
  
  console.log('Análise de colaboradores integrada:', analise)
  return analise
}

// Exemplo 11: Análise de relatórios integrada
async function exemploAnaliseRelatoriosIntegrada() {
  console.log('📊 [EXEMPLO] Análise de relatórios integrada com Supabase')
  
  const analise = await felixAnalyzeReports(30) // Últimos 30 relatórios
  
  console.log('Análise de relatórios integrada:', analise)
  return analise
}

// Exemplo 12: Relatório executivo completo
async function exemploRelatorioExecutivoCompleto() {
  console.log('📋 [EXEMPLO] Relatório executivo completo integrado')
  
  const relatorio = await felixGenerateExecutiveReport()
  
  console.log('Relatório executivo completo:', relatorio)
  return relatorio
}

// Exemplo 13: Análise de tendências financeiras
async function exemploAnaliseTendenciasFinanceiras() {
  console.log('📈 [EXEMPLO] Análise de tendências financeiras')
  
  const analise = await felixAnalyzeFinancialTrends()
  
  console.log('Análise de tendências financeiras:', analise)
  return analise
}

// Exemplo 14: Análise operacional completa
async function exemploAnaliseOperacionalCompleta() {
  console.log('⚙️ [EXEMPLO] Análise operacional completa')
  
  const analise = await felixAnalyzeOperations()
  
  console.log('Análise operacional completa:', analise)
  return analise
}

// Função para executar todos os exemplos
export async function executarTodosExemplos() {
  console.log('🚀 [EXEMPLOS] Iniciando todos os exemplos da FELIX IA')
  
  try {
    // Verificar configuração primeiro
    const config = exemploVerificacaoConfig()
    if (!config.configurado) {
      console.error('❌ FELIX IA não está configurada corretamente')
      return
    }
    
    // Executar exemplos básicos
    await exemploPerguntaSimples()
    await exemploAnaliseFinanceira()
    await exemploAnaliseOperacional()
    await exemploRelatorioMensal()
    await exemploAnaliseRH()
    await exemploPerguntaComContexto()
    
    console.log('🔄 [EXEMPLOS] Executando exemplos integrados com Supabase...')
    
    // Executar exemplos integrados
    await exemploAnaliseFinanceiraIntegrada()
    await exemploAnaliseBombasIntegrada()
    await exemploAnaliseColaboradoresIntegrada()
    await exemploAnaliseRelatoriosIntegrada()
    await exemploRelatorioExecutivoCompleto()
    await exemploAnaliseTendenciasFinanceiras()
    await exemploAnaliseOperacionalCompleta()
    
    console.log('✅ [EXEMPLOS] Todos os exemplos executados com sucesso!')
    
  } catch (error) {
    console.error('❌ [EXEMPLOS] Erro ao executar exemplos:', error)
  }
}

// Função para executar apenas exemplos integrados
export async function executarExemplosIntegrados() {
  console.log('🔄 [EXEMPLOS] Executando apenas exemplos integrados com Supabase')
  
  try {
    const config = exemploVerificacaoConfig()
    if (!config.configurado) {
      console.error('❌ FELIX IA não está configurada corretamente')
      return
    }
    
    await exemploAnaliseFinanceiraIntegrada()
    await exemploAnaliseBombasIntegrada()
    await exemploAnaliseColaboradoresIntegrada()
    await exemploAnaliseRelatoriosIntegrada()
    await exemploRelatorioExecutivoCompleto()
    await exemploAnaliseTendenciasFinanceiras()
    await exemploAnaliseOperacionalCompleta()
    
    console.log('✅ [EXEMPLOS] Exemplos integrados executados com sucesso!')
    
  } catch (error) {
    console.error('❌ [EXEMPLOS] Erro ao executar exemplos integrados:', error)
  }
}

// Exportar funções para uso em outros arquivos
export {
  exemploPerguntaSimples,
  exemploAnaliseFinanceira,
  exemploAnaliseOperacional,
  exemploRelatorioMensal,
  exemploAnaliseRH,
  exemploPerguntaComContexto,
  exemploVerificacaoConfig
}
