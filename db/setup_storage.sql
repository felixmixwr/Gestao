-- Setup Supabase Storage for Notas Fiscais
-- Execute este script no Supabase SQL Editor após criar o bucket 'attachments'

-- 1. Primeiro, crie o bucket 'attachments' via Supabase Dashboard:
--    - Vá para Storage → Buckets
--    - Clique em "New Bucket"
--    - Nome: "attachments"
--    - Marque como "Public"
--    - Clique em "Create Bucket"

-- 2. Configurar políticas do Storage (execute apenas se o bucket já existir)
-- Verificar se o bucket existe antes de criar políticas
DO $$
BEGIN
    -- Verificar se o bucket 'attachments' existe
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments') THEN
        -- Política para permitir upload por usuários autenticados
        BEGIN
            CREATE POLICY "Allow authenticated uploads" ON storage.objects
            FOR INSERT WITH CHECK (
                auth.role() = 'authenticated' 
                AND bucket_id = 'attachments'
            );
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Allow authenticated uploads" already exists';
        END;

        -- Política para permitir leitura pública dos anexos
        BEGIN
            CREATE POLICY "Allow public read" ON storage.objects
            FOR SELECT USING (bucket_id = 'attachments');
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Allow public read" already exists';
        END;

        -- Política para permitir usuários autenticados atualizarem arquivos
        BEGIN
            CREATE POLICY "Allow authenticated update" ON storage.objects
            FOR UPDATE USING (
                auth.role() = 'authenticated' 
                AND bucket_id = 'attachments'
            );
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Allow authenticated update" already exists';
        END;

        -- Política para permitir usuários autenticados deletarem arquivos
        BEGIN
            CREATE POLICY "Allow authenticated delete" ON storage.objects
            FOR DELETE USING (
                auth.role() = 'authenticated' 
                AND bucket_id = 'attachments'
            );
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Policy "Allow authenticated delete" already exists';
        END;

        RAISE NOTICE 'Storage policies configured successfully for bucket "attachments"';
    ELSE
        RAISE NOTICE 'Bucket "attachments" does not exist. Please create it first via Supabase Dashboard.';
    END IF;
END $$;
