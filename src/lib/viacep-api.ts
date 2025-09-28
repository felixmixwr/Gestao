import { ViaCepResponse } from '../types/programacao';

export class ViaCepAPI {
  private static readonly BASE_URL = 'https://viacep.com.br/ws';

  // Buscar endereço por CEP
  static async buscarCEP(cep: string): Promise<ViaCepResponse | null> {
    try {
      // Remove caracteres não numéricos do CEP
      const cleanCep = cep.replace(/\D/g, '');
      
      // Valida se o CEP tem 8 dígitos
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`${this.BASE_URL}/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data: ViaCepResponse = await response.json();

      // Verifica se o CEP foi encontrado
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      throw error;
    }
  }

  // Buscar CEPs por endereço (opcional, para casos específicos)
  static async buscarPorEndereco(
    uf: string, 
    cidade: string, 
    logradouro: string
  ): Promise<ViaCepResponse[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${uf}/${cidade}/${logradouro}/json/`
      );
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data: ViaCepResponse[] = await response.json();

      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      throw error;
    }
  }

  // Formatar endereço completo
  static formatarEndereco(data: ViaCepResponse): string {
    const parts = [
      data.logradouro,
      data.bairro,
      data.localidade,
      data.uf
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Validar formato do CEP
  static validarCEP(cep: string): boolean {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8;
  }

  // Formatar CEP (adicionar máscara)
  static formatarCEP(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
}

// Hook personalizado para busca de CEP
export const useViaCep = () => {
  const buscarCEP = async (cep: string) => {
    try {
      const data = await ViaCepAPI.buscarCEP(cep);
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  return {
    buscarCEP,
    validarCEP: ViaCepAPI.validarCEP,
    formatarCEP: ViaCepAPI.formatarCEP,
    formatarEndereco: ViaCepAPI.formatarEndereco
  };
};




