-- =============================================
-- SCRIPT DE ROLLBACK DE EMERGÊNCIA
-- =============================================
-- ⚠️  ATENÇÃO: USE APENAS EM CASO DE EMERGÊNCIA ⚠️
-- Este script restaura os dados originais a partir dos backups

-- 1. RESTAURAR RELATÓRIOS (se necessário)
-- DESCOMENTE APENAS SE PRECISAR RESTAURAR:
-- TRUNCATE TABLE reports;
-- INSERT INTO reports SELECT * FROM backup_reports_antes_integracao;

-- 2. RESTAURAR PAGAMENTOS (se necessário)
-- DESCOMENTE APENAS SE PRECISAR RESTAURAR:
-- TRUNCATE TABLE pagamentos_receber;
-- INSERT INTO pagamentos_receber SELECT * FROM backup_pagamentos_receber_antes_integracao;

-- 3. RESTAURAR NOTAS FISCAIS (se necessário)
-- DESCOMENTE APENAS SE PRECISAR RESTAURAR:
-- TRUNCATE TABLE notas_fiscais;
-- INSERT INTO notas_fiscais SELECT * FROM backup_notas_fiscais_antes_integracao;

-- 4. RESTAURAR TRIGGERS (se necessário)
-- Os triggers serão recriados pelos scripts de migração

-- 5. VERIFICAR INTEGRIDADE APÓS ROLLBACK
SELECT '=== VERIFICAÇÃO PÓS-ROLLBACK ===' as info;

SELECT 
    'reports' as tabela,
    COUNT(*) as registros_atuais,
    (SELECT COUNT(*) FROM backup_reports_antes_integracao) as registros_backup
FROM reports
UNION ALL
SELECT 
    'pagamentos_receber' as tabela,
    COUNT(*) as registros_atuais,
    (SELECT COUNT(*) FROM backup_pagamentos_receber_antes_integracao) as registros_backup
FROM pagamentos_receber
UNION ALL
SELECT 
    'notas_fiscais' as tabela,
    COUNT(*) as registros_atuais,
    (SELECT COUNT(*) FROM backup_notas_fiscais_antes_integracao) as registros_backup
FROM notas_fiscais;

-- 6. INSTRUÇÕES DE USO
SELECT '=== INSTRUÇÕES DE USO ===' as info;
SELECT '1. Descomente apenas as seções que precisam ser restauradas' as passo1;
SELECT '2. Execute o script seção por seção' as passo2;
SELECT '3. Verifique a integridade dos dados' as passo3;
SELECT '4. Entre em contato com o desenvolvedor se necessário' as passo4;
