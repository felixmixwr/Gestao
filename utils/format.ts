/**
 * Utilitários de formatação para o sistema
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 * @param value - Valor numérico para formatar
 * @returns String formatada como moeda brasileira
 */
export const formatCurrency = (value: number): string => {
  // Usar formatação nativa que já inclui o sinal de menos no lugar correto
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

/**
 * Formata uma data para o padrão brasileiro (dd/MM/yyyy)
 * @param date - Data como string ou objeto Date
 * @returns String formatada como data brasileira
 */
export const formatDate = (date: string | Date): string => {
  try {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      console.warn('Data inválida recebida:', date);
      return 'Data inválida';
    }
    
    return new Intl.DateTimeFormat('pt-BR').format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data:', date, error);
    return 'Erro na data';
  }
};

/**
 * Formata uma data para o padrão brasileiro com hora (dd/MM/yyyy HH:mm)
 * @param date - Data como string ou objeto Date
 * @returns String formatada como data e hora brasileira
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      console.warn('Data inválida recebida:', date);
      return 'Data inválida';
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data/hora:', date, error);
    return 'Erro na data';
  }
};

/**
 * Formata um número de telefone brasileiro
 * @param phone - Número de telefone
 * @returns String formatada como telefone brasileiro
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Formata um CNPJ/CPF
 * @param document - Documento (CNPJ ou CPF)
 * @returns String formatada como CNPJ ou CPF
 */
export const formatDocument = (document: string): string => {
  const cleaned = document.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // CPF
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    // CNPJ
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return document;
};

/**
 * Formata um CEP brasileiro
 * @param cep - CEP
 * @returns String formatada como CEP brasileiro
 */
export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
};
