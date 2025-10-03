-- Script para criar as categorias do planner manualmente
-- Execute este script no SQL Editor do Supabase Dashboard

-- Inserir categoria Financeiro se não existir
INSERT INTO task_categories (name, color, description)
SELECT 'Financeiro', 'red', 'Eventos relacionados a vencimentos e cobranças financeiras'
WHERE NOT EXISTS (
  SELECT 1 FROM task_categories WHERE name = 'Financeiro'
);

-- Inserir categoria Pagamentos se não existir
INSERT INTO task_categories (name, color, description)
SELECT 'Pagamentos', 'green', 'Eventos relacionados a pagamentos e recebimentos confirmados'
WHERE NOT EXISTS (
  SELECT 1 FROM task_categories WHERE name = 'Pagamentos'
);

-- Verificar se as categorias foram criadas
SELECT * FROM task_categories WHERE name IN ('Financeiro', 'Pagamentos');
