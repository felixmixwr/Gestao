import { supabase } from './supabase';

// Tipos para compatibilidade com navegadores
type ApiRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  [key: string]: unknown;
};

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Serviço para chamadas da API backend
 */
export class ApiService {
  /**
   * Obter token JWT do usuário autenticado
   */
  private static async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado');
    }
    
    return session.access_token;
  }

  /**
   * Fazer requisição autenticada para a API
   */
  private static async makeRequest(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<Response> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP ${response.status}`);
    }

    return response;
  }

  /**
   * Gerar nota fiscal via API backend
   */
  static async generateNote(payload: {
    report_id: string;
    company_logo: 'felixmix' | 'worldrental';
    phone: string;
    nf_date: string;
    nf_due_date: string;
    company_name: string;
    address: string;
    cnpj_cpf: string;
    city: string;
    cep: string;
    uf: string;
    nf_value: number;
    descricao: string;
    obs?: string;
  }) {
    const response = await this.makeRequest('/api/notes/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  /**
   * Verificar saúde da API
   */
  static async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  }
}

/**
 * Hook para usar a API service
 */
export const useApi = () => {
  return {
    generateNote: ApiService.generateNote,
    healthCheck: ApiService.healthCheck,
  };
};
