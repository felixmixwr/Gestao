import { supabase } from './supabase'
import type { Database } from './supabase'

type AdminUser = Database['public']['Tables']['admin_users']['Row']
type BannedUser = Database['public']['Tables']['banned_users']['Row']
type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export interface AdminDashboardStats {
  total_users: number
  banned_users: number
  today_logs: number
  week_logs: number
  month_logs: number
}

export interface BanUserData {
  user_id: string
  email: string
  reason: string
  expires_at?: string | null
}

export interface AuditLogFilters {
  user_id?: string
  action?: string
  resource_type?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export class AdminAPI {
  /**
   * Check if current user is admin
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .rpc('is_admin', { p_user_id: user.id })

      if (error) {
        console.error('Error checking admin status:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  /**
   * Check if current user is super admin
   */
  static async isSuperAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error checking super admin status:', error)
        return false
      }

      return data?.role === 'super_admin'
    } catch (error) {
      console.error('Error checking super admin status:', error)
      return false
    }
  }

  /**
   * Check if user is banned
   */
  static async isUserBanned(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_user_banned', { p_user_id: userId })

      if (error) {
        console.error('Error checking ban status:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error checking ban status:', error)
      return false
    }
  }

  /**
   * Get admin dashboard statistics
   */
  static async getDashboardStats(): Promise<AdminDashboardStats | null> {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching dashboard stats:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return null
    }
  }

  /**
   * Get all users with pagination
   */
  static async getUsers(limit = 50, offset = 0): Promise<{ users: any[], total: number }> {
    try {
      // Get users from auth.users (this might need to be adjusted based on your setup)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          admin_users!left(*),
          banned_users!left(*)
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        return { users: [], total: 0 }
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.error('Error fetching users count:', countError)
        return { users: users || [], total: 0 }
      }

      return { users: users || [], total: count || 0 }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { users: [], total: 0 }
    }
  }

  /**
   * Get banned users
   */
  static async getBannedUsers(): Promise<BannedUser[]> {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select(`
          *,
          banned_by_user:users!banned_users_banned_by_fkey(*)
        `)
        .eq('is_active', true)
        .order('banned_at', { ascending: false })

      if (error) {
        console.error('Error fetching banned users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching banned users:', error)
      return []
    }
  }

  /**
   * Ban a user
   */
  static async banUser(banData: BanUserData): Promise<{ success: boolean; banId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await supabase
        .rpc('ban_user', {
          p_user_id: banData.user_id,
          p_reason: banData.reason,
          p_banned_by: user.id,
          p_expires_at: banData.expires_at
        })

      if (error) {
        console.error('Error banning user:', error)
        return { success: false, error: error.message }
      }

      return { success: true, banId: data }
    } catch (error) {
      console.error('Error banning user:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Unban a user
   */
  static async unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await supabase
        .rpc('unban_user', {
          p_user_id: userId,
          p_unbanned_by: user.id
        })

      if (error) {
        console.error('Error unbanning user:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error unbanning user:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Get audit logs with filters
   */
  static async getAuditLogs(filters: AuditLogFilters = {}): Promise<{ logs: AuditLog[], total: number }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // Apply pagination
      const limit = filters.limit || 50
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Order by created_at desc
      query = query.order('created_at', { ascending: false })

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
   * Log an audit event
   */
  static async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .rpc('log_audit_event', {
          p_user_id: user?.id || null,
          p_user_email: user?.email || null,
          p_action: action,
          p_resource_type: resourceType,
          p_resource_id: resourceId || null,
          p_old_values: oldValues || null,
          p_new_values: newValues || null,
          p_ip_address: null, // Will be handled by the application
          p_user_agent: null, // Will be handled by the application
          p_metadata: metadata || {}
        })

      if (error) {
        console.error('Error logging audit event:', error)
        return { success: false, error: error.message }
      }

      return { success: true, logId: data }
    } catch (error) {
      console.error('Error logging audit event:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Get admin users
   */
  static async getAdminUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select(`
          *,
          user:users!admin_users_user_id_fkey(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching admin users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching admin users:', error)
      return []
    }
  }

  /**
   * Add admin user (super admin only)
   */
  static async addAdminUser(userId: string, email: string, role: 'admin' | 'moderator' = 'admin'): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          email: email,
          role: role,
          is_active: true
        })

      if (error) {
        console.error('Error adding admin user:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error adding admin user:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  /**
   * Remove admin user (super admin only)
   */
  static async removeAdminUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing admin user:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error removing admin user:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }
}
