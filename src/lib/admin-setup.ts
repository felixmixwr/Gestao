import { supabase } from './supabase'

/**
 * Script para configurar o usuário super admin
 * Execute este script uma vez para adicionar tavaresambroziovinicius@gmail.com como super admin
 */
export class AdminSetup {
  /**
   * Configurar usuário super admin
   * Este método deve ser executado uma vez após a criação das tabelas
   */
  static async setupSuperAdmin(): Promise<{ success: boolean; error?: string }> {
    try {
      const adminEmail = 'tavaresambroziovinicius@gmail.com'
      
      // 1. Verificar se o usuário já existe no auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(adminEmail)
      
      if (authError) {
        console.error('Erro ao buscar usuário:', authError)
        return { success: false, error: 'Erro ao buscar usuário no sistema de autenticação' }
      }
      
      if (!authUser.user) {
        return { success: false, error: 'Usuário não encontrado no sistema de autenticação. Certifique-se de que o usuário já fez login pelo menos uma vez.' }
      }
      
      // 2. Verificar se já é admin
      const { data: existingAdmin, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.user.id)
        .eq('is_active', true)
        .single()
      
      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar admin existente:', adminCheckError)
        return { success: false, error: 'Erro ao verificar permissões de admin' }
      }
      
      if (existingAdmin) {
        return { success: true, error: 'Usuário já é administrador' }
      }
      
      // 3. Adicionar como super admin
      const { data: newAdmin, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: authUser.user.id,
          email: adminEmail,
          role: 'super_admin',
          is_active: true,
          permissions: {
            can_ban_users: true,
            can_view_all_logs: true,
            can_manage_admins: true,
            can_view_system_stats: true
          }
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Erro ao inserir admin:', insertError)
        return { success: false, error: 'Erro ao criar permissões de administrador' }
      }
      
      // 4. Log da ação
      await supabase.rpc('log_audit_event', {
        p_user_id: authUser.user.id,
        p_user_email: adminEmail,
        p_action: 'CREATE_ADMIN',
        p_resource_type: 'admin_user',
        p_resource_id: newAdmin.id,
        p_old_values: null,
        p_new_values: {
          role: 'super_admin',
          email: adminEmail
        },
        p_ip_address: null,
        p_user_agent: 'Admin Setup Script',
        p_metadata: {
          setup_method: 'manual',
          script_version: '1.0'
        }
      })
      
      console.log('✅ Super admin configurado com sucesso:', adminEmail)
      return { success: true }
      
    } catch (error) {
      console.error('Erro inesperado no setup do admin:', error)
      return { success: false, error: 'Erro inesperado durante a configuração' }
    }
  }
  
  /**
   * Verificar se o sistema admin está configurado
   */
  static async checkAdminSetup(): Promise<{ isSetup: boolean; adminCount: number; error?: string }> {
    try {
      const { data, error, count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
      
      if (error) {
        console.error('Erro ao verificar setup admin:', error)
        return { isSetup: false, adminCount: 0, error: 'Erro ao verificar configuração' }
      }
      
      return { isSetup: (count || 0) > 0, adminCount: count || 0 }
      
    } catch (error) {
      console.error('Erro inesperado ao verificar setup:', error)
      return { isSetup: false, adminCount: 0, error: 'Erro inesperado' }
    }
  }
  
  /**
   * Listar todos os administradores
   */
  static async listAdmins(): Promise<{ admins: any[]; error?: string }> {
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
        console.error('Erro ao listar admins:', error)
        return { admins: [], error: 'Erro ao listar administradores' }
      }
      
      return { admins: data || [] }
      
    } catch (error) {
      console.error('Erro inesperado ao listar admins:', error)
      return { admins: [], error: 'Erro inesperado' }
    }
  }
}

/**
 * Função utilitária para executar o setup do admin
 * Execute esta função no console do navegador ou em um script
 */
export const setupAdmin = async () => {
  console.log('🚀 Iniciando configuração do super admin...')
  
  const result = await AdminSetup.setupSuperAdmin()
  
  if (result.success) {
    console.log('✅ Super admin configurado com sucesso!')
    console.log('📧 Email: tavaresambroziovinicius@gmail.com')
    console.log('🔑 Role: super_admin')
    console.log('🌐 Acesse: /admin')
  } else {
    console.error('❌ Erro na configuração:', result.error)
  }
  
  return result
}

// Exportar para uso global no console
if (typeof window !== 'undefined') {
  (window as any).setupAdmin = setupAdmin
  (window as any).AdminSetup = AdminSetup
}
