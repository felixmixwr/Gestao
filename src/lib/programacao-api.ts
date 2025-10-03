import { supabase } from './supabase';
import { Programacao, ProgramacaoFormData, ProgramacaoFilters } from '../types/programacao';

export class ProgramacaoAPI {
  // Criar nova programação
  static async create(data: ProgramacaoFormData): Promise<Programacao> {
    console.log('🔍 [ProgramacaoAPI] Dados sendo enviados:', data);
    console.log('🔍 [ProgramacaoAPI] company_id:', data.company_id);
    console.log('🔍 [ProgramacaoAPI] status:', data.status);
    
    // Validação de UUIDs vazios
    if (!data.company_id || data.company_id.trim() === '') {
      throw new Error('Company ID é obrigatório e não pode estar vazio');
    }
    
    if (data.cliente_id && data.cliente_id.trim() === '') {
      throw new Error('Cliente ID não pode estar vazio se fornecido');
    }
    
    if (data.bomba_id && data.bomba_id.trim() === '') {
      throw new Error('Bomba ID não pode estar vazio se fornecido');
    }
    
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
    try {
      // 1. Buscar programação básica
      const { data: programacaoData, error: programacaoError } = await supabase
        .from('programacao')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (programacaoError) {
        if (programacaoError.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw new Error(`Erro ao buscar programação: ${programacaoError.message}`);
      }

      if (!programacaoData) {
        return null;
      }

      // 2. Buscar dados da bomba (interna ou terceira)
      let pumpData = null;
      if (programacaoData.bomba_id) {
        // Tentar buscar bomba interna primeiro
        const { data: pumpsData } = await supabase
          .from('pumps')
          .select('id, prefix, model, brand')
          .eq('id', programacaoData.bomba_id)
          .single();

        if (pumpsData) {
          pumpData = pumpsData;
        } else {
          // Se não encontrou bomba interna, buscar bomba terceira
          const { data: bombaTerceira } = await supabase
            .from('view_bombas_terceiras_com_empresa')
            .select('id, prefixo, modelo, empresa_nome_fantasia, valor_diaria')
            .eq('id', programacaoData.bomba_id)
            .single();

          if (bombaTerceira) {
            pumpData = {
              id: bombaTerceira.id,
              prefix: bombaTerceira.prefixo,
              model: bombaTerceira.modelo || '',
              brand: `${bombaTerceira.empresa_nome_fantasia} - R$ ${bombaTerceira.valor_diaria || 0}/dia`,
              is_terceira: true,
              empresa_nome: bombaTerceira.empresa_nome_fantasia,
              valor_diaria: bombaTerceira.valor_diaria
            };
          }
        }
      }

      return {
        ...programacaoData,
        pumps: pumpData
      };
    } catch (error) {
      console.error('Erro ao buscar programação por ID:', error);
      throw error;
    }
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
    
    try {
      // 1. Buscar programações básicas
      const { data: programacoesData, error: programacoesError } = await supabase
        .from('programacao')
        .select(`
          id,
          prefixo_obra,
          data,
          horario,
          fc,
          cliente_id,
          cliente,
          responsavel,
          cep,
          endereco,
          numero,
          bairro,
          cidade,
          estado,
          volume_previsto,
          quantidade_material,
          peca_concretada,
          fck,
          brita,
          slump,
          equipe,
          motorista_operador,
          auxiliares_bomba,
          bomba_id,
          status,
          company_id,
          created_at,
          updated_at,
          companies (
            id,
            name
          )
        `)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (programacoesError) {
        console.error('❌ [ProgramacaoAPI] Erro ao buscar programações:', programacoesError);
        throw new Error(`Erro ao buscar programações por período: ${programacoesError.message}`);
      }

      if (!programacoesData || programacoesData.length === 0) {
        console.log('⚠️ [ProgramacaoAPI] Nenhuma programação encontrada');
        return [];
      }

      // Debug: Log dos dados retornados
      console.log('🔍 [ProgramacaoAPI] Dados retornados:', programacoesData.map(p => ({
        id: p.id,
        horario: p.horario,
        volume_previsto: p.volume_previsto,
        quantidade_material: p.quantidade_material,
        peca_concretada: p.peca_concretada,
        fck: p.fck,
        brita: p.brita,
        slump: p.slump
      })));

      // 2. Buscar bombas internas
      const pumpIds = [...new Set(programacoesData.map(p => p.bomba_id).filter(Boolean))];
      console.log('🔍 [ProgramacaoAPI] Pump IDs únicos:', pumpIds);
      
      const { data: pumpsData } = await supabase
        .from('pumps')
        .select('id, prefix, model, brand')
        .in('id', pumpIds);
      
      console.log('📊 [ProgramacaoAPI] Bombas internas carregadas:', pumpsData?.length || 0);
      
      // 3. Buscar bombas terceiras para IDs que não foram encontrados nas bombas internas
      const foundPumpIds = pumpsData?.map(p => p.id) || [];
      const missingPumpIds = pumpIds.filter(id => !foundPumpIds.includes(id));
      
      let bombasTerceirasData: Array<{
        id: string;
        prefixo: string;
        modelo: string;
        empresa_nome_fantasia: string;
        valor_diaria: number;
      }> = [];
      if (missingPumpIds.length > 0) {
        console.log('🔍 [ProgramacaoAPI] Buscando bombas terceiras para IDs:', missingPumpIds);
        const { data: bombasTerceiras } = await supabase
          .from('view_bombas_terceiras_com_empresa')
          .select('id, prefixo, modelo, empresa_nome_fantasia, valor_diaria')
          .in('id', missingPumpIds);
        
        bombasTerceirasData = bombasTerceiras || [];
        console.log('📊 [ProgramacaoAPI] Bombas terceiras carregadas:', bombasTerceirasData.length);
      }
      
      // 4. Enriquecer programações com dados das bombas
      const enrichedProgramacoes = programacoesData.map(programacao => {
        // Buscar bomba interna primeiro
        let pumpData = pumpsData?.find(p => p.id === programacao.bomba_id);
        
        // Se não encontrou bomba interna, buscar bomba terceira
        if (!pumpData) {
          const bombaTerceira = bombasTerceirasData?.find(bt => bt.id === programacao.bomba_id);
          if (bombaTerceira) {
            pumpData = {
              id: bombaTerceira.id,
              prefix: bombaTerceira.prefixo,
              model: bombaTerceira.modelo || '',
              brand: `${bombaTerceira.empresa_nome_fantasia} - R$ ${bombaTerceira.valor_diaria || 0}/dia`,
              is_terceira: true,
              empresa_nome: bombaTerceira.empresa_nome_fantasia,
              valor_diaria: bombaTerceira.valor_diaria
            } as any;
          }
        }
        
        return {
          ...programacao,
          pumps: pumpData
        };
      });
      
      console.log('✅ [ProgramacaoAPI] Programações enriquecidas:', enrichedProgramacoes.length);
      
      // 5. Garantir que todas as programações tenham status definido
      enrichedProgramacoes.forEach(programacao => {
        if (!programacao.status) {
          programacao.status = 'programado';
          console.log('⚠️ [ProgramacaoAPI] Programação sem status, definindo como programado:', programacao.id);
        }
      });
      
      return enrichedProgramacoes;
    } catch (error) {
      console.error('❌ [ProgramacaoAPI] Erro ao buscar programações por período:', error);
      throw error;
    }
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

  // Buscar bombas disponíveis (internas + terceiras) com priorização
  static async getBombas(): Promise<Array<{ id: string; prefix: string; model: string; brand: string; is_terceira?: boolean; empresa_nome?: string; valor_diaria?: number; has_programacao?: boolean }>> {
    try {
      // Buscar bombas internas
      const { data: pumpsData, error: pumpsError } = await supabase
        .from('pumps')
        .select('id, prefix, model, brand')
        .order('prefix');

      if (pumpsError) {
        throw new Error(`Erro ao buscar bombas internas: ${pumpsError.message}`);
      }

      // Buscar bombas de terceiros
      const { data: bombasTerceirasData, error: bombasTerceirasError } = await supabase
        .from('view_bombas_terceiras_com_empresa')
        .select('id, prefixo, modelo, empresa_nome_fantasia, valor_diaria')
        .order('empresa_nome_fantasia, prefixo');

      if (bombasTerceirasError) {
        throw new Error(`Erro ao buscar bombas terceiras: ${bombasTerceirasError.message}`);
      }

      // Buscar programações ativas para identificar bombas com programação
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7); // Próximos 7 dias
      
      const { data: programacoesData } = await supabase
        .from('programacao')
        .select('bomba_id, bomba_prefixo')
        .gte('data', today.toISOString().split('T')[0])
        .lte('data', endDate.toISOString().split('T')[0]);

      // Criar conjunto de bombas com programação
      const bombasComProgramacao = new Set<string>();
      programacoesData?.forEach(p => {
        if (p.bomba_id) bombasComProgramacao.add(p.bomba_id);
        if (p.bomba_prefixo) bombasComProgramacao.add(p.bomba_prefixo);
      });

      // Combinar as bombas internas e terceiras
      const bombasInternas = (pumpsData || []).map(pump => ({
        id: pump.id,
        prefix: pump.prefix,
        model: pump.model,
        brand: pump.brand,
        is_terceira: false,
        has_programacao: bombasComProgramacao.has(pump.id)
      }));

      const bombasTerceiras = (bombasTerceirasData || []).map(bomba => ({
        id: bomba.id,
        prefix: bomba.prefixo,
        model: bomba.modelo || '',
        brand: `${bomba.empresa_nome_fantasia} - R$ ${bomba.valor_diaria || 0}/dia`,
        is_terceira: true,
        empresa_nome: bomba.empresa_nome_fantasia,
        valor_diaria: bomba.valor_diaria,
        has_programacao: bombasComProgramacao.has(bomba.prefixo)
      }));

      // Combinar e ordenar com priorização
      const todasBombas = [...bombasInternas, ...bombasTerceiras].sort((a, b) => {
        // 1. PRIORIDADE: Bombas com programação primeiro
        if (a.has_programacao !== b.has_programacao) {
          return a.has_programacao ? -1 : 1;
        }
        
        // 2. PRIORIDADE: Bombas internas antes das terceiras
        if (a.is_terceira !== b.is_terceira) {
          return a.is_terceira ? 1 : -1;
        }
        
        // 3. Ordenar por prefixo dentro da mesma categoria
        return a.prefix.localeCompare(b.prefix);
      });

      return todasBombas;
    } catch (error) {
      console.error('Erro ao buscar bombas:', error);
      throw error;
    }
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
