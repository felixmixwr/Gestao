-- Script para criar bucket de storage para documentos de colaboradores

-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir upload de arquivos para usuários autenticados
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Criar política para permitir visualização de arquivos públicos
CREATE POLICY "Allow public access to documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- Criar política para permitir atualização de arquivos
CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Criar política para permitir exclusão de arquivos
CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);





