-- Corrigir foreign key constraint para referenciar a tabela usuarios ao invés de auth.users
-- O sistema usa autenticação customizada com tabela usuarios, não auth.users

-- 1. Remover a constraint existente que referencia auth.users
ALTER TABLE pagamentos_fornecedores 
DROP CONSTRAINT IF EXISTS pagamentos_fornecedores_usuario_id_fkey;

-- 2. Adicionar nova constraint que referencia a tabela usuarios
ALTER TABLE pagamentos_fornecedores 
ADD CONSTRAINT pagamentos_fornecedores_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- 3. Verificar se a constraint foi criada corretamente
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'pagamentos_fornecedores'
    AND kcu.column_name = 'usuario_id';