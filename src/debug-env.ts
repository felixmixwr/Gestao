// Arquivo de diagnóstico para verificar variáveis de ambiente
console.log('=== DIAGNÓSTICO DE VARIÁVEIS DE AMBIENTE ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log('VITE_OWNER_COMPANY_NAME:', import.meta.env.VITE_OWNER_COMPANY_NAME);
console.log('VITE_SECOND_COMPANY_NAME:', import.meta.env.VITE_SECOND_COMPANY_NAME);
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);
console.log('==========================================');
