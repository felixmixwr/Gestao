import { supabase } from './supabase'
import type { Database } from './supabase'

type AuditLog = Database['public']['Tables']['audit_logs_comprehensive']['Row']

export interface AuditFilters {
  table_name?: string
  operation?: 'INSERT' | 'UPDATE' | 'DELETE'
  user_email?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export interface SystemStatistics {
  total_clients: number
  total_companies: number
  total_bombas: number
  total_reports: number
  total_notas_fiscais: number
  total_colaboradores: number
  total_programacao: number
  total_admins: number
  total_banned_users: number
  activity_24h: number
  activity_7d: number
  activity_30d: number
  top_users_7d: Array<{ email: string; count: number }>
  top_tables_7d: Array<{ table: string; count: number }>
}

export interface AuditSummary {
  table_name: string
  total_operations: number
  insertions: number
  updates: number
  deletions: number
  last_activity: string
}

export class AuditAPI {
  /**
   * Get comprehensive audit logs with filters
   */
  static async getAuditLogs(filters: AuditFilters = {}): Promise<{ logs: AuditLog[], total: number }> {
    try {
      let query = supabase
        .from('audit_logs_comprehensive')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name)
      }
      if (filters.operation) {
        query = query.eq('operation', filters.operation)
      }
      if (filters.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`)
      }
      if (filters.date_from) {
        query = query.gte('timestamp', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('timestamp', filters.date_to)
      }

      // Apply pagination
      const limit = filters.limit || 50
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Order by timestamp desc
      query = query.order('timestamp', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
        return { logs: [], total: 0 }
      }

      return { logs: data || [], total: count || 0 }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return { logs: [], total: 0 }
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStatistics(): Promise<SystemStatistics | null> {
    try {
      const { data, error } = await supabase
        .from('system_statistics')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching system statistics:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      return null
    }
  }

  /**
   * Get audit summary by table
   */
  static async getAuditSummaryByTable(
    tableName?: string, 
    days: number = 30
  ): Promise<AuditSummary[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_audit_summary_by_table', {
          p_table_name: tableName,
          p_days: days
        })

      if (error) {
        console.error('Error fetching audit summary:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching audit summary:', error)
      return []
    }
  }

  /**
   * Get audit dashboard data
   */
  static async getAuditDashboard(limit: number = 100): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_dashboard')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching audit dashboard:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching audit dashboard:', error)
      return []
    }
  }

  /**
   * Get recent activity for a specific table
   */
  static async getRecentActivity(
    tableName: string, 
    limit: number = 20
  ): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs_comprehensive')
        .select('*')
        .eq('table_name', tableName)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent activity:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(
    userEmail?: string,
    days: number = 30
  ): Promise<Array<{ user_email: string; total_operations: number; last_activity: string }>> {
    try {
      let query = supabase
        .from('audit_logs_comprehensive')
        .select('user_email, timestamp')
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (userEmail) {
        query = query.eq('user_email', userEmail)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user activity:', error)
        return []
      }

      // Group by user and count operations
      const userStats = new Map<string, { count: number; lastActivity: string }>()
      
      data?.forEach(log => {
        if (log.user_email) {
          const existing = userStats.get(log.user_email) || { count: 0, lastActivity: '' }
          existing.count++
          if (log.timestamp > existing.lastActivity) {
            existing.lastActivity = log.timestamp
          }
          userStats.set(log.user_email, existing)
        }
      })

      return Array.from(userStats.entries()).map(([email, stats]) => ({
        user_email: email,
        total_operations: stats.count,
        last_activity: stats.lastActivity
      })).sort((a, b) => b.total_operations - a.total_operations)
    } catch (error) {
      console.error('Error fetching user activity:', error)
      return []
    }
  }

  /**
   * Get table activity summary
   */
  static async getTableActivitySummary(
    days: number = 30
  ): Promise<Array<{ table_name: string; total_operations: number; last_activity: string }>> {
    try {
      const { data, error } = await supabase
        .from('audit_logs_comprehensive')
        .select('table_name, timestamp')
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (error) {
        console.error('Error fetching table activity:', error)
        return []
      }

      // Group by table and count operations
      const tableStats = new Map<string, { count: number; lastActivity: string }>()
      
      data?.forEach(log => {
        const existing = tableStats.get(log.table_name) || { count: 0, lastActivity: '' }
        existing.count++
        if (log.timestamp > existing.lastActivity) {
          existing.lastActivity = log.timestamp
        }
        tableStats.set(log.table_name, existing)
      })

      return Array.from(tableStats.entries()).map(([table, stats]) => ({
        table_name: table,
        total_operations: stats.count,
        last_activity: stats.lastActivity
      })).sort((a, b) => b.total_operations - a.total_operations)
    } catch (error) {
      console.error('Error fetching table activity:', error)
      return []
    }
  }

  /**
   * Export audit logs to CSV format
   */
  static async exportAuditLogs(filters: AuditFilters = {}): Promise<string> {
    try {
      const { logs } = await this.getAuditLogs({ ...filters, limit: 10000 })
      
      if (logs.length === 0) {
        return 'Nenhum log encontrado'
      }

      // Create CSV header
      const headers = [
        'ID',
        'Tabela',
        'Operação',
        'Usuário',
        'Data/Hora',
        'Dados Antigos',
        'Novos Dados',
        'Metadados'
      ]

      // Create CSV rows
      const rows = logs.map(log => [
        log.id,
        log.table_name,
        log.operation,
        log.user_email || 'Sistema',
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.old_data ? JSON.stringify(log.old_data) : '',
        log.new_data ? JSON.stringify(log.new_data) : '',
        log.metadata ? JSON.stringify(log.metadata) : ''
      ])

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      return csvContent
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      return 'Erro ao exportar logs'
    }
  }
}
