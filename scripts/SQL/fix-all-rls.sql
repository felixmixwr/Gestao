-- Script para corrigir RLS em todas as tabelas do projeto
-- Execute este script no Supabase SQL Editor

-- 1. Verificar status atual do RLS em todas as tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'clients', 'pumps', 'reports', 'notes', 'users')
ORDER BY tablename;

-- 2. Habilitar RLS em todas as tabelas principais
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas para a tabela companies
CREATE POLICY "Permitir leitura para usuários autenticados" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON companies
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON companies
  FOR DELETE TO authenticated USING (true);

-- 4. Criar políticas para a tabela clients
CREATE POLICY "Permitir leitura para usuários autenticados" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON clients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON clients
  FOR DELETE TO authenticated USING (true);

-- 5. Criar políticas para a tabela pumps
CREATE POLICY "Permitir leitura para usuários autenticados" ON pumps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON pumps
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON pumps
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON pumps
  FOR DELETE TO authenticated USING (true);

-- 6. Criar políticas para a tabela reports
CREATE POLICY "Permitir leitura para usuários autenticados" ON reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON reports
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON reports
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON reports
  FOR DELETE TO authenticated USING (true);

-- 7. Criar políticas para a tabela notes
CREATE POLICY "Permitir leitura para usuários autenticados" ON notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON notes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON notes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON notes
  FOR DELETE TO authenticated USING (true);

-- 8. Criar políticas para a tabela users
CREATE POLICY "Permitir leitura para usuários autenticados" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON users
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON users
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON users
  FOR DELETE TO authenticated USING (true);

-- 9. Verificar se todas as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'clients', 'pumps', 'reports', 'notes', 'users')
ORDER BY tablename, policyname;

-- 10. Verificar status final do RLS
SELECT 
  'RLS habilitado em todas as tabelas' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'clients', 'pumps', 'reports', 'notes', 'users')
ORDER BY tablename;

-- 11. Verificar contagem de dados em cada tabela
SELECT 'companies' as tabela, COUNT(*) as total FROM companies
UNION ALL
SELECT 'clients' as tabela, COUNT(*) as total FROM clients
UNION ALL
SELECT 'pumps' as tabela, COUNT(*) as total FROM pumps
UNION ALL
SELECT 'reports' as tabela, COUNT(*) as total FROM reports
UNION ALL
SELECT 'notes' as tabela, COUNT(*) as total FROM notes
UNION ALL
SELECT 'users' as tabela, COUNT(*) as total FROM users
ORDER BY tabela;
