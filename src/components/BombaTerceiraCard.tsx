import { Link } from 'react-router-dom'
import { BombaTerceiraWithEmpresa, getCorStatus, formatarData } from '../types/bombas-terceiras'

interface BombaTerceiraCardProps {
  bomba: BombaTerceiraWithEmpresa
}

export function BombaTerceiraCard({ bomba }: BombaTerceiraCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{bomba.prefixo}</h3>
              <p className="text-sm text-gray-600">{bomba.empresa_nome_fantasia}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {bomba.modelo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{bomba.modelo}</span>
              </div>
            )}
            
            {bomba.ano && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Ano {bomba.ano}</span>
              </div>
            )}
          </div>

          {/* Status e valor da diária */}
          <div className="flex items-center gap-3 text-sm">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCorStatus(bomba.status)}`}>
              {bomba.status}
            </span>
            
            {bomba.valor_diaria && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                R$ {bomba.valor_diaria.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}/dia
              </span>
            )}
          </div>

          {/* Data de criação */}
          <div className="mt-3 text-xs text-gray-500">
            Cadastrada em {formatarData(bomba.created_at)}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link 
            to={`/bombas-terceiras/bombas/${bomba.id}`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ver detalhes
          </Link>
          
          <Link 
            to={`/bombas-terceiras/bombas/${bomba.id}/editar`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  )
}

