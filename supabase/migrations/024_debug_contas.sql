-- Verificar se existem contas na tabela
SELECT COUNT(*) as total_contas FROM contas;

-- Verificar contas ativas
SELECT COUNT(*) as contas_ativas FROM contas WHERE ativa = true;

-- Verificar todas as contas
SELECT id, nome, ativa, created_at FROM contas ORDER BY created_at;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'contas';

-- Inserir conta Cora se não existir
INSERT INTO contas (nome, ativa) 
VALUES ('Cora', true) 
ON CONFLICT (nome) DO NOTHING;

-- Verificar novamente após inserção
SELECT id, nome, ativa, created_at FROM contas ORDER BY created_at;