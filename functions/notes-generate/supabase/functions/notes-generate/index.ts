// Supabase Edge Function wrapper
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Importar o handler principal (adaptado para Deno)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseBucket = Deno.env.get('SUPABASE_BUCKET_INVOICES') || 'invoices'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validar autenticação
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Token de autorização inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar role do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['financeiro', 'admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Usuário não tem permissão para gerar notas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Processar payload
    const payload = await req.json()
    
    // Validação básica
    const required = ['report_id', 'company_logo', 'phone', 'nf_date', 'nf_due_date', 'company_name', 'address', 'cnpj_cpf', 'city', 'cep', 'uf', 'nf_value', 'descricao']
    const missing = required.filter(field => !payload[field])
    
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ ok: false, message: `Campos obrigatórios ausentes: ${missing.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', payload.report_id)
      .single()

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Report não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (report.status !== 'NOTA_EMITIDA') {
      return new Response(
        JSON.stringify({ ok: false, message: `Report deve estar com status 'NOTA_EMITIDA', atual: ${report.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se já existe nota
    const { data: existingNote, error: existingError } = await supabase
      .from('notes')
      .select('id')
      .eq('report_id', payload.report_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ ok: false, message: 'Erro ao verificar nota existente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingNote) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Já existe uma nota fiscal para este report' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar nota
    const noteData = {
      report_id: payload.report_id,
      company_logo: payload.company_logo,
      phone: payload.phone,
      nf_date: payload.nf_date,
      nf_due_date: payload.nf_due_date,
      company_name: payload.company_name,
      address: payload.address,
      cnpj_cpf: payload.cnpj_cpf,
      city: payload.city,
      cep: payload.cep,
      uf: payload.uf,
      nf_value: payload.nf_value,
      descricao: payload.descricao,
      obs: payload.obs || null,
      created_at: new Date().toISOString()
    }

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert(noteData)
      .select('*')
      .single()

    if (noteError) {
      return new Response(
        JSON.stringify({ ok: false, message: `Erro ao criar nota: ${noteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Para Edge Functions, vamos simular a geração de arquivos
    // Em produção, você pode usar uma biblioteca como ExcelJS adaptada para Deno
    const year = new Date().getFullYear()
    const xlsxStoragePath = `invoices/${year}/${note.nf_number}/${note.nf_number}.xlsx`
    const pdfStoragePath = `invoices/${year}/${note.nf_number}/${note.nf_number}.pdf`

    // Atualizar caminhos na nota
    const { error: updateError } = await supabase
      .from('notes')
      .update({
        file_xlsx_path: xlsxStoragePath,
        file_pdf_path: pdfStoragePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', note.id)

    if (updateError) {
      // Rollback: remover nota
      await supabase.from('notes').delete().eq('id', note.id)
      return new Response(
        JSON.stringify({ ok: false, message: `Erro ao atualizar caminhos: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar URLs assinadas
    const { data: xlsxUrl } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrl(xlsxStoragePath, 60 * 60 * 24 * 7)

    const { data: pdfUrl } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrl(pdfStoragePath, 60 * 60 * 24 * 7)

    return new Response(
      JSON.stringify({
        ok: true,
        note: {
          ...note,
          file_xlsx_path: xlsxStoragePath,
          file_pdf_path: pdfStoragePath
        },
        download_xlsx_url: xlsxUrl?.signedUrl || '',
        download_pdf_url: pdfUrl?.signedUrl || ''
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ ok: false, message: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
