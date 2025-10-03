export type ProgramacaoStatus = 'programado' | 'reservado';

export interface Programacao {
  id: string;
  prefixo_obra?: string; // Agora opcional
  data: string; // YYYY-MM-DD format
  horario: string; // HH:MM format
  cliente_id?: string; // Mudou para cliente_id
  cliente?: string; // Para compatibilidade com dados antigos
  responsavel?: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  volume_previsto?: number;
  quantidade_material?: number;
  peca_concretada?: string;
  fck?: string;
  brita?: string;
  slump?: string;
  motorista_operador?: string;
  auxiliares_bomba?: string[]; // Array de IDs dos auxiliares
  bomba_id?: string;
  status: ProgramacaoStatus; // Status da programação
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramacaoFormData {
  prefixo_obra?: string; // Agora opcional
  data: string;
  horario: string;
  cliente_id: string; // Mudou para cliente_id
  cliente?: string; // Nome do cliente para compatibilidade
  responsavel?: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  volume_previsto?: number;
  quantidade_material?: number;
  peca_concretada?: string;
  fck?: string;
  brita?: string;
  slump?: string;
  motorista_operador?: string;
  auxiliares_bomba?: string[];
  bomba_id?: string;
  status: ProgramacaoStatus; // Status da programação
  company_id: string;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface ProgramacaoBoardColumn {
  id: string;
  title: string;
  programacoes: Programacao[];
}

export interface DragDropResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
}

// Opções para selects
export interface BritaOption {
  value: string;
  label: string;
}

export interface ColaboradorOption {
  id: string;
  nome: string;
  funcao: string;
}

export interface BombaOption {
  id: string;
  prefix: string;
  model: string;
  brand: string;
  is_terceira?: boolean;
  empresa_nome?: string;
  valor_diaria?: number;
  has_programacao?: boolean;
}

export interface ClienteOption {
  id: string;
  name: string;
  company_name: string | null;
}

export interface EmpresaOption {
  id: string;
  name: string;
}

// Filtros para o board
export interface ProgramacaoFilters {
  company_id?: string;
  cliente?: string;
  bomba_id?: string;
  colaborador_id?: string;
  data_inicio?: string;
  data_fim?: string;
}
