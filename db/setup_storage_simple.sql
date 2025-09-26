-- Setup Supabase Storage - Versão Simplificada
-- Execute este script no Supabase SQL Editor

-- IMPORTANTE: Execute este script como SUPERUSER ou com permissões adequadas
-- Se você receber erro de permissão, use o Supabase Dashboard para configurar as políticas

-- 1. Criar bucket via Dashboard (recomendado):
--    - Vá para Storage → Buckets
--    - Clique em "New Bucket"
--    - Nome: "attachments"
--    - Marque como "Public"
--    - Clique em "Create Bucket"

-- 2. Configurar políticas via Dashboard (alternativa se SQL falhar):
--    - Vá para Storage → Buckets → attachments → Policies
--    - Adicione as seguintes políticas:

-- Política 1: Upload (INSERT)
-- Name: "Allow authenticated uploads"
-- Operation: INSERT
-- Target roles: authenticated
-- Policy definition: bucket_id = 'attachments'

-- Política 2: Leitura (SELECT)  
-- Name: "Allow public read"
-- Operation: SELECT
-- Target roles: public
-- Policy definition: bucket_id = 'attachments'

-- Política 3: Atualização (UPDATE)
-- Name: "Allow authenticated update"
-- Operation: UPDATE
-- Target roles: authenticated
-- Policy definition: bucket_id = 'attachments'

-- Política 4: Exclusão (DELETE)
-- Name: "Allow authenticated delete"
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition: bucket_id = 'attachments'

-- 3. Verificar se as políticas foram aplicadas:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Teste de upload (opcional):
-- Teste se consegue fazer upload de um arquivo pequeno via Dashboard
