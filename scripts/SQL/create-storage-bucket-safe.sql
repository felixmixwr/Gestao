-- Script seguro para criar bucket de storage para documentos de colaboradores
-- Verifica se os elementos já existem antes de criar

-- Criar bucket para documentos (apenas se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para storage (apenas se não existirem)
DO $$ 
BEGIN
    -- Política para upload de arquivos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload documents') THEN
        CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' AND 
          auth.role() = 'authenticated'
        );
    END IF;

    -- Política para visualização de arquivos públicos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access to documents') THEN
        CREATE POLICY "Allow public access to documents" ON storage.objects
        FOR SELECT USING (bucket_id = 'documents');
    END IF;

    -- Política para atualização de arquivos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update documents') THEN
        CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' AND 
          auth.role() = 'authenticated'
        );
    END IF;

    -- Política para exclusão de arquivos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to delete documents') THEN
        CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' AND 
          auth.role() = 'authenticated'
        );
    END IF;
END $$;





