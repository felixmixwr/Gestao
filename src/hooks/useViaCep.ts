import { useState } from 'react'

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
  erro?: boolean
}

export function useViaCep() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCep = async (cep: string): Promise<ViaCepResponse | null> => {
    const cleanCep = cep.replace(/\D/g, '')
    console.log('ViaCEP: Buscando CEP limpo:', cleanCep)
    
    if (cleanCep.length !== 8) {
      console.log('ViaCEP: CEP inválido, deve ter 8 dígitos')
      setError('CEP deve ter 8 dígitos')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const url = `https://viacep.com.br/ws/${cleanCep}/json/`
      console.log('ViaCEP: Fazendo requisição para:', url)
      
      const response = await fetch(url)
      console.log('ViaCEP: Resposta recebida:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data: ViaCepResponse = await response.json()
      console.log('ViaCEP: Dados recebidos:', data)

      if (data.erro) {
        console.log('ViaCEP: CEP não encontrado')
        setError('CEP não encontrado')
        return null
      }

      console.log('ViaCEP: CEP encontrado com sucesso')
      return data
    } catch (err) {
      console.error('ViaCEP: Erro na requisição:', err)
      setError('Erro ao buscar CEP')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { fetchCep, loading, error }
}
