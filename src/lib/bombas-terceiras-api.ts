import { supabase } from './supabase'
import { 
  EmpresaTerceira, 
  BombaTerceira, 
  BombaTerceiraWithEmpresa,
  EmpresaTerceiraWithBombas,
  CreateEmpresaTerceiraData,
  UpdateEmpresaTerceiraData,
  CreateBombaTerceiraData,
  UpdateBombaTerceiraData,
  EmpresaTerceiraFilters,
  BombaTerceiraFilters,
  EmpresaTerceiraStats,
  BombaTerceiraStatsByEmpresa
} from '../types/bombas-terceiras'

/**
 * Serviço para operações de empresas terceiras
 */
export class EmpresasTerceirasService {
  /**
   * Listar todas as empresas terceiras
   */
  static async listarEmpresas(filters?: EmpresaTerceiraFilters): Promise<EmpresaTerceira[]> {
    let query = supabase
      .from('empresas_terceiras')
      .select('*')
      .order('nome_fantasia')

    if (filters?.search) {
      query = query.or(`nome_fantasia.ilike.%${filters.search}%,razao_social.ilike.%${filters.search}%`)
    }

    if (filters?.cnpj) {
      query = query.eq('cnpj', filters.cnpj)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Erro ao listar empresas: ${error.message}`)
    }

    return data || []
  }

  /**
   * Buscar empresa terceira por ID
   */
  static async buscarEmpresaPorId(id: string): Promise<EmpresaTerceiraWithBombas | null> {
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas_terceiras')
      .select('*')
      .eq('id', id)
      .single()

    if (empresaError) {
      throw new Error(`Erro ao buscar empresa: ${empresaError.message}`)
    }

    if (!empresa) return null

    // Buscar bombas associadas
    const { data: bombas, error: bombasError } = await supabase
      .from('bombas_terceiras')
      .select('*')
      .eq('empresa_id', id)
      .order('prefixo')

    if (bombasError) {
      throw new Error(`Erro ao buscar bombas da empresa: ${bombasError.message}`)
    }

    return {
      ...empresa,
      bombas: bombas || []
    }
  }

  /**
   * Criar nova empresa terceira
   */
  static async criarEmpresa(data: CreateEmpresaTerceiraData): Promise<EmpresaTerceira> {
    const { data: empresa, error } = await supabase
      .from('empresas_terceiras')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar empresa: ${error.message}`)
    }

    return empresa
  }

  /**
   * Atualizar empresa terceira
   */
  static async atualizarEmpresa(data: UpdateEmpresaTerceiraData): Promise<EmpresaTerceira> {
    const { id, ...updateData } = data

    const { data: empresa, error } = await supabase
      .from('empresas_terceiras')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar empresa: ${error.message}`)
    }

    return empresa
  }

  /**
   * Excluir empresa terceira
   */
  static async excluirEmpresa(id: string): Promise<void> {
    const { error } = await supabase
      .from('empresas_terceiras')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir empresa: ${error.message}`)
    }
  }

  /**
   * Obter estatísticas das empresas terceiras
   */
  static async obterEstatisticas(): Promise<EmpresaTerceiraStats> {
    // Contar empresas
    const { count: totalEmpresas, error: empresasError } = await supabase
      .from('empresas_terceiras')
      .select('*', { count: 'exact', head: true })

    if (empresasError) {
      throw new Error(`Erro ao contar empresas: ${empresasError.message}`)
    }

    // Contar bombas por status
    const { data: bombasPorStatus, error: bombasError } = await supabase
      .from('bombas_terceiras')
      .select('status')

    if (bombasError) {
      throw new Error(`Erro ao contar bombas: ${bombasError.message}`)
    }

    const totalBombas = bombasPorStatus?.length || 0
    const bombasAtivas = bombasPorStatus?.filter(b => b.status === 'ativa').length || 0
    const bombasEmManutencao = bombasPorStatus?.filter(b => b.status === 'em manutenção').length || 0
    const bombasIndisponiveis = bombasPorStatus?.filter(b => b.status === 'indisponível').length || 0

    // Contar bombas com manutenção próxima (próximos 30 dias)
    return {
      total_empresas: totalEmpresas || 0,
      total_bombas: totalBombas,
      bombas_ativas: bombasAtivas,
      bombas_em_manutencao: bombasEmManutencao,
      bombas_indisponiveis: bombasIndisponiveis
    }
  }
}

/**
 * Serviço para operações de bombas terceiras
 */
export class BombasTerceirasService {
  /**
   * Listar bombas terceiras com dados da empresa
   */
  static async listarBombas(filters?: BombaTerceiraFilters): Promise<BombaTerceiraWithEmpresa[]> {
    let query = supabase
      .from('view_bombas_terceiras_com_empresa')
      .select('*')
      .order('empresa_nome_fantasia, prefixo')

    if (filters?.empresa_id) {
      query = query.eq('empresa_id', filters.empresa_id)
    }

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`prefixo.ilike.%${filters.search}%,modelo.ilike.%${filters.search}%,empresa_nome_fantasia.ilike.%${filters.search}%`)
    }


    const { data, error } = await query

    if (error) {
      throw new Error(`Erro ao listar bombas: ${error.message}`)
    }

    return data || []
  }

  /**
   * Buscar bomba terceira por ID
   */
  static async buscarBombaPorId(id: string): Promise<BombaTerceiraWithEmpresa | null> {
    const { data, error } = await supabase
      .from('view_bombas_terceiras_com_empresa')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Erro ao buscar bomba: ${error.message}`)
    }

    return data
  }

  /**
   * Criar nova bomba terceira
   */
  static async criarBomba(data: CreateBombaTerceiraData): Promise<BombaTerceira> {
    const { data: bomba, error } = await supabase
      .from('bombas_terceiras')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar bomba: ${error.message}`)
    }

    return bomba
  }

  /**
   * Atualizar bomba terceira
   */
  static async atualizarBomba(data: UpdateBombaTerceiraData): Promise<BombaTerceira> {
    const { id, ...updateData } = data

    const { data: bomba, error } = await supabase
      .from('bombas_terceiras')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar bomba: ${error.message}`)
    }

    return bomba
  }

  /**
   * Excluir bomba terceira
   */
  static async excluirBomba(id: string): Promise<void> {
    const { error } = await supabase
      .from('bombas_terceiras')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir bomba: ${error.message}`)
    }
  }

  /**
   * Listar bombas por empresa
   */
  static async listarBombasPorEmpresa(empresaId: string): Promise<BombaTerceira[]> {
    const { data, error } = await supabase
      .from('bombas_terceiras')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('prefixo')

    if (error) {
      throw new Error(`Erro ao listar bombas da empresa: ${error.message}`)
    }

    return data || []
  }

  /**
   * Obter estatísticas de bombas por empresa
   */
  static async obterEstatisticasPorEmpresa(): Promise<BombaTerceiraStatsByEmpresa[]> {
    const { data, error } = await supabase
      .from('view_bombas_terceiras_com_empresa')
      .select('empresa_id, empresa_nome_fantasia, status')

    if (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`)
    }

    // Agrupar por empresa
    const statsMap = new Map<string, BombaTerceiraStatsByEmpresa>()

    data?.forEach(bomba => {
      const empresaId = bomba.empresa_id
      const empresaNome = bomba.empresa_nome_fantasia

      if (!statsMap.has(empresaId)) {
        statsMap.set(empresaId, {
          empresa_id: empresaId,
          empresa_nome: empresaNome,
          total_bombas: 0,
          bombas_ativas: 0,
          bombas_em_manutencao: 0,
          bombas_indisponiveis: 0
        })
      }

      const stats = statsMap.get(empresaId)!
      stats.total_bombas++

      switch (bomba.status) {
        case 'ativa':
          stats.bombas_ativas++
          break
        case 'em manutenção':
          stats.bombas_em_manutencao++
          break
        case 'indisponível':
          stats.bombas_indisponiveis++
          break
      }
    })

    return Array.from(statsMap.values())
  }
}

/**
 * Hook para usar os serviços de bombas terceiras
 */
export const useBombasTerceiras = () => {
  return {
    empresas: EmpresasTerceirasService,
    bombas: BombasTerceirasService
  }
}

