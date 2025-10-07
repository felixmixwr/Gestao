// Máscaras para formatação de campos

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  
  if (digits.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else {
    // Celular: (00) 00000-0000
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export function validatePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}

export function validateCep(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 8
}
