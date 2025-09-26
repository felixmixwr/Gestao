import React, { useState } from 'react'
import { AdminSetup } from '../../lib/admin-setup'
import { AdminSetupJWT } from '../../lib/admin-setup-jwt'
import { Button } from '../../components/Button'

export const AdminSetupPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [adminStatus, setAdminStatus] = useState<{ isSetup: boolean; adminCount: number; error?: string } | null>(null)

  const handleSetup = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      // Usar o setup JWT que funciona com autenticação JWT
      const setupResult = await AdminSetupJWT.setupSuperAdminJWT()
      setResult(setupResult)
      
      if (setupResult.success) {
        // Recarregar a página após 2 segundos
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error('Erro no setup:', error)
      setResult({ success: false, error: 'Erro inesperado durante a configuração' })
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    try {
      const status = await AdminSetupJWT.checkSystemStatus()
      setAdminStatus({
        isSetup: status.isSetup,
        adminCount: status.adminCount,
        error: status.error
      })
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      setAdminStatus({ isSetup: false, adminCount: 0, error: 'Erro ao verificar status' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração do Admin</h1>
          <p className="text-gray-600">
            Configure o super admin para acessar o painel administrativo
          </p>
        </div>

        <div className="space-y-6">
          {/* Status Check */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Status Atual</h3>
            <Button 
              onClick={checkStatus} 
              variant="outline" 
              className="w-full mb-3"
            >
              Verificar Status
            </Button>
            
            {adminStatus && (
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Sistema configurado:</span>
                  <span className={adminStatus.isSetup ? 'text-green-600' : 'text-red-600'}>
                    {adminStatus.isSetup ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Admins ativos:</span>
                  <span className="font-medium">{adminStatus.adminCount}</span>
                </div>
                {adminStatus.error && (
                  <div className="text-red-600 mt-2">{adminStatus.error}</div>
                )}
              </div>
            )}
          </div>

          {/* Setup Button */}
          <div>
            <Button
              onClick={handleSetup}
              disabled={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? 'Configurando...' : 'Configurar Super Admin'}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Email: tavaresambroziovinicius@gmail.com
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                <div className="text-2xl mr-3">
                  {result.success ? '✅' : '❌'}
                </div>
                <div>
                  <h4 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Sucesso!' : 'Erro'}
                  </h4>
                  <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success 
                      ? 'Super admin configurado com sucesso! Redirecionando...' 
                      : result.error
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Instruções:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Certifique-se de estar logado com tavaresambroziovinicius@gmail.com</li>
              <li>2. Execute a migration no Supabase primeiro</li>
              <li>3. Clique em "Configurar Super Admin"</li>
              <li>4. Aguarde a confirmação</li>
              <li>5. Acesse /admin</li>
            </ol>
          </div>

          {/* Manual Setup */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Setup Manual (JWT):</h4>
            <p className="text-sm text-yellow-800 mb-2">
              Se o setup automático não funcionar, execute no console do navegador:
            </p>
            <code className="block bg-yellow-100 p-2 rounded text-xs text-yellow-900 mb-2">
              setupAdminJWT()
            </code>
            <p className="text-xs text-yellow-700">
              Ou para verificar status: <code>checkAdminStatus()</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
