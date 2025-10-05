-- Verificar se a conta Cora existe
SELECT * FROM contas WHERE nome = 'Cora';

-- Verificar todas as contas ativas
SELECT * FROM contas WHERE ativa = true ORDER BY nome;

-- Verificar todas as contas
SELECT * FROM contas ORDER BY nome;