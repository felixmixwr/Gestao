-- ============================================
-- SCRIPT PARA CRIAR CATEGORIAS DO PLANNER
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Vá em: Supabase Dashboard > SQL Editor > New Query

-- 1. Criar categoria Financeiro
INSERT INTO task_categories (name, color, description)
VALUES ('Financeiro', 'red', 'Eventos relacionados a vencimentos e cobranças financeiras')
ON CONFLICT (name) DO NOTHING;

-- 2. Criar categoria Pagamentos  
INSERT INTO task_categories (name, color, description)
VALUES ('Pagamentos', 'green', 'Eventos relacionados a pagamentos e recebimentos confirmados')
ON CONFLICT (name) DO NOTHING;

-- 3. Verificar se foram criadas
SELECT id, name, color, description 
FROM task_categories 
WHERE name IN ('Financeiro', 'Pagamentos')
ORDER BY name;
