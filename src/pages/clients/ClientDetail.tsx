import { Layout } from '../../components/Layout'
import { useParams } from 'react-router-dom'

export default function ClientDetail() {
  const { id } = useParams()

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Detalhes do Cliente
            </h2>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500">
              Detalhes do cliente {id} serão implementados aqui.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}








