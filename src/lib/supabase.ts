import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? 'DEFINIDA' : 'NÃO DEFINIDA')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis de ambiente do Supabase não encontradas!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'DEFINIDA' : 'NÃO DEFINIDA')
  throw new Error('Missing Supabase environment variables')
}

console.log('✅ Supabase configurado com sucesso!')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      pumps: {
        Row: {
          id: string
          prefix: string
          model: string | null
          pump_type: string | null
          brand: string | null
          capacity_m3h: number | null
          year: number | null
          status: 'Disponível' | 'Em Uso' | 'Em Manutenção'
          owner_company_id: string
          total_billed: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prefix: string
          model?: string | null
          pump_type?: string | null
          brand?: string | null
          capacity_m3h?: number | null
          year?: number | null
          status?: 'Disponível' | 'Em Uso' | 'Em Manutenção'
          owner_company_id: string
          total_billed?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prefix?: string
          model?: string | null
          pump_type?: string | null
          brand?: string | null
          capacity_m3h?: number | null
          year?: number | null
          status?: 'Disponível' | 'Em Uso' | 'Em Manutenção'
          owner_company_id?: string
          total_billed?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          report_number: string
          client_id: string
          pump_id: string
          company_id: string
          start_date: string
          end_date: string
          total_hours: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_number?: string
          client_id: string
          pump_id: string
          company_id: string
          start_date: string
          end_date: string
          total_hours: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_number?: string
          client_id?: string
          pump_id?: string
          company_id?: string
          start_date?: string
          end_date?: string
          total_hours?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          nf_number: string
          company_name: string
          company_logo: string
          phone: string
          nf_date: string
          nf_due_date: string
          address: string | null
          cnpj_cpf: string | null
          city: string | null
          cep: string | null
          uf: string | null
          nf_value: number
          descricao: string | null
          obs: string | null
          report_id: string | null
          file_xlsx_path: string | null
          file_pdf_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nf_number: string
          company_name: string
          company_logo: string
          phone: string
          nf_date: string
          nf_due_date: string
          address?: string | null
          cnpj_cpf?: string | null
          city?: string | null
          cep?: string | null
          uf?: string | null
          nf_value: number
          descricao?: string | null
          obs?: string | null
          report_id?: string | null
          file_xlsx_path?: string | null
          file_pdf_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nf_number?: string
          company_name?: string
          company_logo?: string
          phone?: string
          nf_date?: string
          nf_due_date?: string
          address?: string | null
          cnpj_cpf?: string | null
          city?: string | null
          cep?: string | null
          uf?: string | null
          nf_value?: number
          descricao?: string | null
          obs?: string | null
          report_id?: string | null
          file_xlsx_path?: string | null
          file_pdf_path?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      colaboradores: {
        Row: {
          id: string
          nome: string
          funcao: 'Motorista Operador de Bomba' | 'Auxiliar de Bomba' | 'Programador' | 'Administrador Financeiro' | 'Fiscal de Obras' | 'Mecânico'
          tipo_contrato: 'fixo' | 'diarista'
          salario_fixo: number
          data_pagamento_1: string | null
          data_pagamento_2: string | null
          valor_pagamento_1: number | null
          valor_pagamento_2: number | null
          equipamento_vinculado_id: string | null
          registrado: boolean
          vale_transporte: boolean
          qtd_passagens_por_dia: number | null
          cpf: string | null
          telefone: string | null
          email: string | null
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          funcao: 'Motorista Operador de Bomba' | 'Auxiliar de Bomba' | 'Programador' | 'Administrador Financeiro' | 'Fiscal de Obras' | 'Mecânico'
          tipo_contrato?: 'fixo' | 'diarista'
          salario_fixo?: number
          data_pagamento_1?: string | null
          data_pagamento_2?: string | null
          valor_pagamento_1?: number | null
          valor_pagamento_2?: number | null
          equipamento_vinculado_id?: string | null
          registrado?: boolean
          vale_transporte?: boolean
          qtd_passagens_por_dia?: number | null
          cpf?: string | null
          telefone?: string | null
          email?: string | null
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          funcao?: 'Motorista Operador de Bomba' | 'Auxiliar de Bomba' | 'Programador' | 'Administrador Financeiro' | 'Fiscal de Obras' | 'Mecânico'
          tipo_contrato?: 'fixo' | 'diarista'
          salario_fixo?: number
          data_pagamento_1?: string | null
          data_pagamento_2?: string | null
          valor_pagamento_1?: number | null
          valor_pagamento_2?: number | null
          equipamento_vinculado_id?: string | null
          registrado?: boolean
          vale_transporte?: boolean
          qtd_passagens_por_dia?: number | null
          cpf?: string | null
          telefone?: string | null
          email?: string | null
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      colaboradores_dependentes: {
        Row: {
          id: string
          colaborador_id: string
          nome_completo: string
          data_nascimento: string
          local_nascimento: string | null
          tipo_dependente: string | null
          created_at: string
        }
        Insert: {
          id?: string
          colaborador_id: string
          nome_completo: string
          data_nascimento: string
          local_nascimento?: string | null
          tipo_dependente?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          colaborador_id?: string
          nome_completo?: string
          data_nascimento?: string
          local_nascimento?: string | null
          tipo_dependente?: string | null
          created_at?: string
        }
      }
      colaboradores_documentos: {
        Row: {
          id: string
          colaborador_id: string
          tipo_documento: 'CNH' | 'RG' | 'Comprovante Residência' | 'Reservista' | 'Título Eleitor' | 'CTPS' | 'PIS' | 'Outros'
          dados_texto: any | null
          arquivo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          colaborador_id: string
          tipo_documento: 'CNH' | 'RG' | 'Comprovante Residência' | 'Reservista' | 'Título Eleitor' | 'CTPS' | 'PIS' | 'Outros'
          dados_texto?: any | null
          arquivo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          colaborador_id?: string
          tipo_documento?: 'CNH' | 'RG' | 'Comprovante Residência' | 'Reservista' | 'Título Eleitor' | 'CTPS' | 'PIS' | 'Outros'
          dados_texto?: any | null
          arquivo_url?: string | null
          created_at?: string
        }
      }
      colaboradores_horas_extras: {
        Row: {
          id: string
          colaborador_id: string
          data: string
          horas: number
          valor_calculado: number
          tipo_dia: 'segunda-sexta' | 'sabado'
          created_at: string
        }
        Insert: {
          id?: string
          colaborador_id: string
          data: string
          horas: number
          valor_calculado: number
          tipo_dia: 'segunda-sexta' | 'sabado'
          created_at?: string
        }
        Update: {
          id?: string
          colaborador_id?: string
          data?: string
          horas?: number
          valor_calculado?: number
          tipo_dia?: 'segunda-sexta' | 'sabado'
          created_at?: string
        }
      }
      empresas_terceiras: {
        Row: {
          id: string
          nome_fantasia: string
          razao_social: string | null
          cnpj: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_fantasia: string
          razao_social?: string | null
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_fantasia?: string
          razao_social?: string | null
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pagamentos_receber: {
        Row: {
          id: string
          relatorio_id: string
          cliente_id: string
          empresa_id: string | null
          empresa_tipo: string | null
          valor_total: number
          forma_pagamento: string
          prazo_data: string | null
          prazo_dias: number | null
          status: string
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          relatorio_id: string
          cliente_id: string
          empresa_id?: string | null
          empresa_tipo?: string | null
          valor_total: number
          forma_pagamento: string
          prazo_data?: string | null
          prazo_dias?: number | null
          status?: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          relatorio_id?: string
          cliente_id?: string
          empresa_id?: string | null
          empresa_tipo?: string | null
          valor_total?: number
          forma_pagamento?: string
          prazo_data?: string | null
          prazo_dias?: number | null
          status?: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bombas_terceiras: {
        Row: {
          id: string
          empresa_id: string
          prefixo: string
          modelo: string | null
          ano: number | null
          status: 'ativa' | 'em manutenção' | 'indisponível'
          proxima_manutencao: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          prefixo: string
          modelo?: string | null
          ano?: number | null
          status?: 'ativa' | 'em manutenção' | 'indisponível'
          proxima_manutencao?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          prefixo?: string
          modelo?: string | null
          ano?: number | null
          status?: 'ativa' | 'em manutenção' | 'indisponível'
          proxima_manutencao?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notas_fiscais: {
        Row: {
          id: string
          relatorio_id: string
          numero_nota: string
          data_emissao: string
          data_vencimento: string
          valor: number
          anexo_url: string | null
          status: 'Faturada' | 'Paga' | 'Cancelada'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          relatorio_id: string
          numero_nota: string
          data_emissao: string
          data_vencimento: string
          valor: number
          anexo_url?: string | null
          status?: 'Faturada' | 'Paga' | 'Cancelada'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          relatorio_id?: string
          numero_nota?: string
          data_emissao?: string
          data_vencimento?: string
          valor?: number
          anexo_url?: string | null
          status?: 'Faturada' | 'Paga' | 'Cancelada'
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          descricao: string
          categoria: 'Mão de obra' | 'Diesel' | 'Manutenção' | 'Imposto' | 'Outros'
          valor: number
          tipo_custo: 'fixo' | 'variável'
          data_despesa: string
          pump_id: string
          company_id: string
          status: 'pendente' | 'pago' | 'cancelado'
          quilometragem_atual: number | null
          quantidade_litros: number | null
          custo_por_litro: number | null
          payment_method: 'cartao' | 'pix' | null
          discount_type: 'fixed' | 'percentage' | null
          discount_value: number | null
          fuel_station: string | null
          nota_fiscal_id: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          descricao: string
          categoria: 'Mão de obra' | 'Diesel' | 'Manutenção' | 'Imposto' | 'Outros'
          valor: number
          tipo_custo: 'fixo' | 'variável'
          data_despesa: string
          pump_id: string
          company_id: string
          status?: 'pendente' | 'pago' | 'cancelado'
          quilometragem_atual?: number | null
          quantidade_litros?: number | null
          custo_por_litro?: number | null
          payment_method?: 'cartao' | 'pix' | null
          discount_type?: 'fixed' | 'percentage' | null
          discount_value?: number | null
          fuel_station?: string | null
          nota_fiscal_id?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          descricao?: string
          categoria?: 'Mão de obra' | 'Diesel' | 'Manutenção' | 'Imposto' | 'Outros'
          valor?: number
          tipo_custo?: 'fixo' | 'variável'
          data_despesa?: string
          pump_id?: string
          company_id?: string
          status?: 'pendente' | 'pago' | 'cancelado'
          quilometragem_atual?: number | null
          quantidade_litros?: number | null
          custo_por_litro?: number | null
          payment_method?: 'cartao' | 'pix' | null
          discount_type?: 'fixed' | 'percentage' | null
          discount_value?: number | null
          fuel_station?: string | null
          nota_fiscal_id?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

