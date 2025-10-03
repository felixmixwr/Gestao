import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Calendar,
  Clock,
  Trash2,
  X,
  MapPin,
  Tag,
  AlertCircle,
  DollarSign,
  FileText
} from 'lucide-react'
import { PlannerAPI, UserCalendarEvent } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string | null
  onEventDeleted?: () => void
}

// Função para formatar data
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'long'
  })
}

// Função para formatar hora
const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':')
  return `${hours}:${minutes}`
}

// Função para obter cor do indicador da categoria
const getCategoryIndicatorColor = (color: string) => {
  const colorMap: Record<string, string> = {
    'green': 'bg-green-500',
    'red': 'bg-red-500',
    'blue': 'bg-blue-500',
    'orange': 'bg-orange-500',
    'yellow': 'bg-yellow-500',
    'teal': 'bg-teal-500',
    'brown': 'bg-amber-500',
    'gray': 'bg-gray-500',
    'black': 'bg-gray-800',
    'indigo': 'bg-indigo-500'
  }
  
  return colorMap[color] || 'bg-gray-500'
}

// Função para obter cor da categoria
const getCategoryColor = (color: string) => {
  const colorMap: Record<string, string> = {
    'green': 'bg-green-100 text-green-800 border-green-200',
    'red': 'bg-red-100 text-red-800 border-red-200',
    'blue': 'bg-blue-100 text-blue-800 border-blue-200',
    'orange': 'bg-orange-100 text-orange-800 border-orange-200',
    'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'teal': 'bg-teal-100 text-teal-800 border-teal-200',
    'brown': 'bg-amber-100 text-amber-800 border-amber-200',
    'gray': 'bg-gray-100 text-gray-800 border-gray-200',
    'black': 'bg-gray-800 text-white border-gray-600',
    'indigo': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
  
  return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Função para obter ícone baseado no título do evento
const getEventIcon = (title: string) => {
  if (title.includes('Vencimento') || title.includes('💰')) {
    return <AlertCircle className="h-5 w-5 text-red-600" />
  }
  if (title.includes('Pagamento') || title.includes('✅')) {
    return <DollarSign className="h-5 w-5 text-green-600" />
  }
  if (title.includes('NF') || title.includes('Nota')) {
    return <FileText className="h-5 w-5 text-blue-600" />
  }
  return <Calendar className="h-5 w-5 text-blue-600" />
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onEventDeleted
}) => {
  const [event, setEvent] = useState<UserCalendarEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { addToast } = useToast()

  // Carregar evento quando o modal abrir
  useEffect(() => {
    if (isOpen && eventId) {
      loadEvent()
    }
  }, [isOpen, eventId])

  const loadEvent = async () => {
    if (!eventId) return
    
    try {
      setLoading(true)
      const eventData = await PlannerAPI.getEvent(eventId)
      setEvent(eventData)
    } catch (error) {
      console.error('Erro ao carregar evento:', error)
      addToast({
        message: 'Erro ao carregar detalhes do evento',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !eventId) return
    
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o evento "${event.title}"?`
    )
    
    if (!confirmed) return

    try {
      setDeleting(true)
      await PlannerAPI.deleteEvent(eventId)
      
      addToast({
        message: 'Evento excluído com sucesso!',
        type: 'success'
      })
      
      if (onEventDeleted) {
        onEventDeleted()
      }
      
      onClose()
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
      addToast({
        message: 'Erro ao excluir evento',
        type: 'error'
      })
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {event && getEventIcon(event.title)}
            <span>Detalhes do Evento</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Carregando detalhes do evento...</div>
          </div>
        ) : event ? (
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {event.title}
                </h3>
                
                {event.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </div>

              {/* Data e hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Data de Início</p>
                    <p className="text-gray-900">{formatDate(event.start_date)}</p>
                  </div>
                </div>

                {event.end_date && event.end_date !== event.start_date && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Data de Fim</p>
                      <p className="text-gray-900">{formatDate(event.end_date)}</p>
                    </div>
                  </div>
                )}

                {!event.all_day && event.start_date && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duração</p>
                      <p className="text-gray-900">
                        {event.all_day ? 'Dia inteiro' : 'Evento com horário específico'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Categoria */}
              {event.category && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Tag className="h-5 w-5 text-purple-600" />
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getCategoryIndicatorColor(event.category.color)}`} />
                    <span className="text-sm font-medium text-gray-700">Categoria:</span>
                    <Badge className={`${getCategoryColor(event.category.color)} border`}>
                      {event.category.name}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Localização */}
              {event.location && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Localização</p>
                    <p className="text-gray-900">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Lembrete */}
              {event.reminder_minutes && event.reminder_minutes > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Lembrete</p>
                    <p className="text-gray-900">
                      {event.reminder_minutes >= 1440 
                        ? `${Math.floor(event.reminder_minutes / 1440)} dia(s) antes`
                        : event.reminder_minutes >= 60
                        ? `${Math.floor(event.reminder_minutes / 60)} hora(s) antes`
                        : `${event.reminder_minutes} minuto(s) antes`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Recorrência */}
              {event.is_recurring && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Evento Recorrente</p>
                    <p className="text-gray-900">
                      {event.recurrence_pattern || 'Recorrência configurada'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={deleting}
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Evento
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Evento não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
