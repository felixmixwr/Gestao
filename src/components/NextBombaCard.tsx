import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface NextBombaCardProps {
  proximaBomba: {
    hora: string
    endereco: string
    responsavel: string
    bomba_prefix?: string
    motorista?: string
    auxiliares?: string[]
    tempo_restante?: string
  } | null
  loading?: boolean
}

export function NextBombaCard({ proximaBomba, loading = false }: NextBombaCardProps) {
  const [tempoRestante, setTempoRestante] = useState<string>('')

  useEffect(() => {
    if (!proximaBomba?.hora) return

    const updateCountdown = () => {
      const agora = new Date()
      const [hora, minuto] = proximaBomba.hora.split(':').map(Number)
      const horaProgramacao = new Date()
      horaProgramacao.setHours(hora, minuto, 0, 0)

      const diferenca = horaProgramacao.getTime() - agora.getTime()

      if (diferenca <= 0) {
        setTempoRestante('Saindo agora!')
        return
      }

      const horas = Math.floor(diferenca / (1000 * 60 * 60))
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60))

      if (horas > 0) {
        setTempoRestante(`${horas}h ${minutos}min`)
      } else {
        setTempoRestante(`${minutos}min`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Atualiza a cada minuto

    return () => clearInterval(interval)
  }, [proximaBomba])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-300 rounded w-32"></div>
          <div className="h-6 bg-gray-300 rounded w-16"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!proximaBomba) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-600">Próxima Bomba</h3>
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">Nenhuma bomba programada para hoje</p>
        </div>
      </div>
    )
  }

  return (
    <Link to="/programacao" className="block">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-5 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-blue-800">Próxima Bomba</h3>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
              {tempoRestante || proximaBomba.tempo_restante}
            </span>
          </div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="space-y-4">
          {/* Endereço e horário */}
          <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {proximaBomba.endereco}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  {proximaBomba.bomba_prefix && `🚛 Bomba ${proximaBomba.bomba_prefix}`}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-sm font-bold text-gray-700 bg-white px-2 py-1 rounded border">
                  {proximaBomba.hora}
                </span>
              </div>
            </div>
          </div>
          
          {/* Responsável */}
          <div className="bg-white/40 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Responsável</p>
                <p className="text-sm font-semibold text-gray-900">{proximaBomba.responsavel}</p>
              </div>
            </div>
          </div>
          
          {/* Equipe */}
          <div className="space-y-3">
            {/* Motorista */}
            <div className="bg-white/40 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Motorista</p>
                  <p className="text-sm font-semibold text-gray-900">{proximaBomba.motorista || 'Não definido'}</p>
                </div>
              </div>
            </div>
            
            {/* Auxiliares */}
            {proximaBomba.auxiliares && proximaBomba.auxiliares.length > 0 && (
              <div className="bg-white/40 rounded-lg p-3 border border-blue-100">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-2">Auxiliares</p>
                    <div className="space-y-1">
                      {proximaBomba.auxiliares.map((auxiliar, index) => (
                        <div key={index} className="text-sm text-gray-800 bg-white/60 px-2 py-1 rounded border">
                          {auxiliar}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
