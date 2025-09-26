import { supabase } from './supabase'

/**
 * Script específico para configuração com JWT
 * Este script funciona com autenticação JWT do Supabase
 */
export class AdminSetupJWT {
  /**
   * Configurar super admin via JWT
   * Funciona apenas se o usuário estiver logado
   */
  static async setupSuperAdminJWT(): Promise<{ success: boolean; error?: string; userInfo?: any }> {
    try {
      const adminEmail = 'tavaresambroziovinicius@gmail.com'
      
      console.log('🔍 Verificando usuário logado...')
      
      // 1. Verificar se o usuário está logado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Erro ao verificar usuário:', authError)
        return { 
          success: false, 
          error: `Erro de autenticação: ${authError.message}` 
        }
      }
      
      if (!user) {
        return { 
          success: false, 
          error: 'Usuário não está logado. Faça login primeiro.' 
        }
      }
      
      console.log('✅ Usuário logado:', user.email)
      console.log('🆔 User ID:', user.id)
      
      // 2. Verificar se é o email correto
      if (user.email !== adminEmail) {
        return { 
          success: false, 
          error: `Email incorreto. Logado como: ${user.email}. Deve ser: ${adminEmail}`,
          userInfo: { email: user.email, id: user.id }
        }
      }
      
      // 3. Verificar se já é admin
      console.log('🔍 Verificando se já é admin...')
      const { data: existingAdmin, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      
      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar admin:', adminCheckError)
        return { 
          success: false, 
          error: `Erro ao verificar permissões: ${adminCheckError.message}` 
        }
      }
      
      if (existingAdmin) {
        console.log('✅ Usuário já é admin')
        return { 
          success: true, 
          error: 'Usuário já é administrador',
          userInfo: { email: user.email, id: user.id, role: existingAdmin.role }
        }
      }
      
      // 4. Inserir como super admin
      console.log('🔧 Configurando super admin...')
      const { data: newAdmin, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: user.id,
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
        console.error('❌ Erro ao inserir admin:', insertError)
        return { 
          success: false, 
          error: `Erro ao criar admin: ${insertError.message}` 
        }
      }
      
      console.log('✅ Admin criado:', newAdmin)
      
      // 5. Log da ação
      try {
        await supabase.rpc('log_audit_event', {
          p_user_id: user.id,
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
          p_user_agent: 'Admin Setup JWT Script',
          p_metadata: {
            setup_method: 'jwt',
            script_version: '1.0'
          }
        })
        console.log('✅ Log de auditoria criado')
      } catch (logError) {
        console.warn('⚠️ Erro ao criar log de auditoria:', logError)
        // Não falhar por causa do log
      }
      
      console.log('🎉 Super admin configurado com sucesso!')
      return { 
        success: true,
        userInfo: { 
          email: user.email, 
          id: user.id, 
          role: 'super_admin',
          adminId: newAdmin.id
        }
      }
      
    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      return { 
        success: false, 
        error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }
  
  /**
   * Verificar status do sistema
   */
  static async checkSystemStatus(): Promise<{ 
    isSetup: boolean; 
    adminCount: number; 
    currentUser: any;
    error?: string 
  }> {
    try {
      // Verificar usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        return { 
          isSetup: false, 
          adminCount: 0, 
          currentUser: null,
          error: `Erro de autenticação: ${authError.message}` 
        }
      }
      
      // Verificar admins
      const { data, error, count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
      
      if (error) {
        return { 
          isSetup: false, 
          adminCount: 0, 
          currentUser: user,
          error: `Erro ao verificar admins: ${error.message}` 
        }
      }
      
      return { 
        isSetup: (count || 0) > 0, 
        adminCount: count || 0, 
        currentUser: user
      }
      
    } catch (error) {
      return { 
        isSetup: false, 
        adminCount: 0, 
        currentUser: null,
        error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }
}

/**
 * Função global para setup via JWT
 */
export const setupAdminJWT = async () => {
  console.log('🚀 Iniciando configuração do super admin via JWT...')
  
  const result = await AdminSetupJWT.setupSuperAdminJWT()
  
  if (result.success) {
    console.log('✅ Super admin configurado com sucesso!')
    console.log('📧 Email:', result.userInfo?.email)
    console.log('🆔 ID:', result.userInfo?.id)
    console.log('🔑 Role:', result.userInfo?.role)
    console.log('🌐 Acesse: /admin')
  } else {
    console.error('❌ Erro na configuração:', result.error)
    if (result.userInfo) {
      console.log('👤 Usuário atual:', result.userInfo)
    }
  }
  
  return result
}

/**
 * Função global para verificar status
 */
export const checkAdminStatus = async () => {
  console.log('🔍 Verificando status do sistema admin...')
  
  const result = await AdminSetupJWT.checkSystemStatus()
  
  console.log('📊 Status do sistema:')
  console.log('- Configurado:', result.isSetup ? '✅ Sim' : '❌ Não')
  console.log('- Admins ativos:', result.adminCount)
  console.log('- Usuário atual:', result.currentUser?.email || 'Não logado')
  
  if (result.error) {
    console.error('❌ Erro:', result.error)
  }
  
  return result
}

// Exportar para uso global no console
if (typeof window !== 'undefined') {
  (window as any).setupAdminJWT = setupAdminJWT
  (window as any).checkAdminStatus = checkAdminStatus
  (window as any).AdminSetupJWT = AdminSetupJWT
}
