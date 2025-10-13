-- Verificar se as funções foram atualizadas corretamente
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('process_pagamento_total', 'process_pagamento_parcial')
ORDER BY p.proname;