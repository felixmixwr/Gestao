import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Layout } from '../../components/Layout';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">
                    Erro no Módulo de Programação
                  </h3>
                </div>
              </div>
              
              <div className="text-red-700 mb-4">
                <p className="mb-2">Ocorreu um erro inesperado ao carregar o módulo de programação.</p>
                <p className="text-sm">Verifique se:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>A tabela 'programacao' foi criada no banco de dados</li>
                  <li>As tabelas 'companies', 'pumps' e 'colaboradores' existem</li>
                  <li>As políticas de RLS estão configuradas corretamente</li>
                  <li>Você está autenticado no sistema</li>
                </ul>
              </div>

              {this.state.error && (
                <div className="bg-red-100 rounded p-4 mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Detalhes do Erro:</h4>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-auto">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="bg-red-100 rounded p-4 mb-4">
                  <summary className="font-medium text-red-800 cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-auto mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.href = '/programacao/test-api'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Testar Conexão
                </button>
                <button
                  onClick={() => window.location.href = '/programacao/board'}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Ir para Quadro
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Recarregar Página
                </button>
              </div>
            </div>
          </div>
        </Layout>
      );
    }

    return this.props.children;
  }
}




