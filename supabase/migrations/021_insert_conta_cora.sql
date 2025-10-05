-- Inserir conta Cora se não existir
INSERT INTO contas (nome, ativa) 
VALUES ('Cora', true)
ON CONFLICT (nome) DO NOTHING;