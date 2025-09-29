import { supabase } from './supabase';
import { Programacao, ProgramacaoFormData, ProgramacaoFilters } from '../types/programacao';

export class ProgramacaoAPI {
  // Criar nova programação
  static async create(data: ProgramacaoFormData): Promise<Programacao> {
    console.log('🔍 [ProgramacaoAPI] Dados sendo enviados:', data);
    console.log('🔍 [ProgramacaoAPI] company_id:', data.company_id);
    console.log('🔍 [ProgramacaoAPI] status:', data.status);
    
    const { data: programacao, error } = await supabase
      .from('programacao')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('❌ [ProgramacaoAPI] Erro detalhado:', error);
      console.error('❌ [ProgramacaoAPI] Código do erro:', error.code);
      console.error('❌ [ProgramacaoAPI] Detalhes do erro:', error.details);
      throw new Error(`Erro ao criar programação: ${error.message}`);
    }

    console.log('✅ [ProgramacaoAPI] Programação criada com sucesso:', programacao);
    return programacao;
  }

  // Buscar programação por ID
  static async getById(id: string): Promise<Programacao | null> {
    const { data, error } = await supabase
      .from('programacao')
      .select(`
        *,
        pumps (
          id,
          prefix,
          model,
          brand
        ),
        companies (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      throw new Error(`Erro ao buscar programação: ${error.message}`);
    }

    return data;
  }

  // Listar programações com filtros
  static async list(filters?: ProgramacaoFilters): Promise<Programacao[]> {
    let query = supabase
      .from('programacao')
      .select(`
        *,
        pumps (
          id,
          prefix,
          model,
          brand
        ),
        companies (
          id,
          name
        )
      `)
      .order('data', { ascending: true })
      .order('horario', { ascending: true });

    if (filters) {
      if (filters.company_id) {
        query = query.eq('company_id', filters.company_id);
      }
      if (filters.cliente) {
        query = query.ilike('cliente', `%${filters.cliente}%`);
      }
      if (filters.bomba_id) {
        query = query.eq('bomba_id', filters.bomba_id);
      }
      if (filters.data_inicio) {
        query = query.gte('data', filters.data_inicio);
      }
      if (filters.data_fim) {
        query = query.lte('data', filters.data_fim);
      }
      if (filters.colaborador_id) {
        query = query.contains('auxiliares_bomba', [filters.colaborador_id]);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar programações: ${error.message}`);
    }

    return data || [];
  }

  // Atualizar programação
  static async update(id: string, data: Partial<ProgramacaoFormData>): Promise<Programacao> {
    const { data: programacao, error } = await supabase
      .from('programacao')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar programação: ${error.message}`);
    }

    return programacao;
  }

  // Deletar programação
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('programacao')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar programação: ${error.message}`);
    }
  }

  // Buscar programações por período (para o board)
  static async getByPeriod(startDate: string, endDate: string): Promise<Programacao[]> {
    console.log('🔍 [ProgramacaoAPI] Buscando programações por período:', { startDate, endDate });
    
    const { data, error } = await supabase
      .from('programacao')
      .select(`
        *,
        pumps (
          id,
          prefix,
          model,
          brand
        ),
        companies (
          id,
          name
        )
      `)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: true })
      .order('horario', { ascending: true });

    if (error) {
      console.error('❌ [ProgramacaoAPI] Erro ao buscar programações:', error);
      throw new Error(`Erro ao buscar programações por período: ${error.message}`);
    }

    console.log('✅ [ProgramacaoAPI] Programações encontradas:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('🔍 [ProgramacaoAPI] Primeira programação:', data[0]);
      console.log('🔍 [ProgramacaoAPI] Status da primeira:', data[0].status);
      
      // Garantir que todas as programações tenham status definido
      data.forEach(programacao => {
        if (!programacao.status) {
          programacao.status = 'programado';
          console.log('⚠️ [ProgramacaoAPI] Programação sem status, definindo como programado:', programacao.id);
        }
      });
    }
    return data || [];
  }

  // Buscar programações agrupadas por data (para o board)
  static async getGroupedByDate(startDate: string, endDate: string): Promise<Record<string, Programacao[]>> {
    const programacoes = await this.getByPeriod(startDate, endDate);
    
    return programacoes.reduce((acc, programacao) => {
      const date = programacao.data;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(programacao);
      return acc;
    }, {} as Record<string, Programacao[]>);
  }

  // Mover programação (drag & drop)
  static async moveProgramacao(id: string, newDate: string, newTime?: string): Promise<Programacao> {
    const updateData: Partial<ProgramacaoFormData> = { data: newDate };
    
    if (newTime) {
      updateData.horario = newTime;
    }

    return this.update(id, updateData);
  }

  // Buscar colaboradores disponíveis
  static async getColaboradores(): Promise<Array<{ id: string; nome: string; funcao: string }>> {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nome, funcao')
        .order('nome');

      if (error) {
        throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      throw new Error(`Erro ao buscar colaboradores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Buscar bombas disponíveis
  static async getBombas(): Promise<Array<{ id: string; prefix: string; model: string; brand: string }>> {
    const { data, error } = await supabase
      .from('pumps')
      .select('id, prefix, model, brand')
      .order('prefix');

    if (error) {
      throw new Error(`Erro ao buscar bombas: ${error.message}`);
    }

    return data || [];
  }

  // Buscar empresas do usuário
  // Buscar clientes disponíveis
  static async getClientes(): Promise<Array<{ id: string; name: string; company_name: string | null }>> {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, company_name')
      .order('name');

    if (error) {
      throw new Error(`Erro ao buscar clientes: ${error.message}`);
    }

    return data || [];
  }

  static async getEmpresas(): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (error) {
      throw new Error(`Erro ao buscar empresas: ${error.message}`);
    }

    return data || [];
  }

  // Validar se há conflito de horário para uma bomba
  static async checkBombaConflict(
    bombaId: string, 
    data: string, 
    horario: string, 
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('programacao')
      .select('id')
      .eq('bomba_id', bombaId)
      .eq('data', data)
      .eq('horario', horario);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: conflict, error } = await query;

    if (error) {
      throw new Error(`Erro ao verificar conflito de bomba: ${error.message}`);
    }

    return (conflict && conflict.length > 0);
  }
}

// Hook para subscriptions em tempo real (exportado para compatibilidade)
export { useProgramacaoSubscription } from '../hooks/useSupabaseSubscription';
