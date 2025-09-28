import { Button } from './Button'

interface ForceUpdateButtonProps {
  onForceUpdate: () => void
  loading?: boolean
}

export function ForceUpdateButton({ onForceUpdate, loading = false }: ForceUpdateButtonProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={onForceUpdate}
        loading={loading}
        className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
        size="sm"
      >
        🔄 Forçar Atualização
      </Button>
    </div>
  )
}



