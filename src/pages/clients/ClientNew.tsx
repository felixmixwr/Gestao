import { Layout } from '../../components/Layout'

export default function ClientNew() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Novo Cliente
            </h2>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500">
              Formulário de novo cliente será implementado aqui.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}








