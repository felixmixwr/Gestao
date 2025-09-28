-- Script de Diagnóstico para Storage Policies
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o bucket existe
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'attachments';

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Testar inserção (substitua 'test-user-id' pelo ID real do usuário)
-- ATENÇÃO: Este é apenas um teste, não execute em produção
/*
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('attachments', 'test-file.txt', 'test-user-id', '{"size": 100}');
*/

-- 5. Se necessário, criar políticas mais permissivas para teste
-- CUIDADO: Estas políticas são muito permissivas, use apenas para teste

-- Política temporária para teste (remover depois)
CREATE POLICY "Temporary test policy" ON storage.objects
FOR ALL USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Para remover a política temporária depois:
-- DROP POLICY "Temporary test policy" ON storage.objects;
