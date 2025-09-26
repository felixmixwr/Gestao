import { Button } from '../../components/Button'

interface GenericErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}

export function GenericError({
  title = 'Ops! Algo deu errado',
  message = 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
  onRetry,
  showRetry = true
}: GenericErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {showRetry && onRetry && (
          <Button onClick={onRetry}>
            Tentar Novamente
          </Button>
        )}
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  )
}


