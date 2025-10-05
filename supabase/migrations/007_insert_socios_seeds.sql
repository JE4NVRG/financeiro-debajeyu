-- Migração 007: Inserir seeds para os 3 sócios (Jean, Yuri, Bárbara)

-- Limpar dados existentes de sócios (se houver)
DELETE FROM socios;

-- Inserir os 3 sócios com pre_saldo = 0
INSERT INTO socios (nome, pre_saldo) VALUES 
('Jean', 0.00),
('Yuri', 0.00),
('Bárbara', 0.00);

-- Verificar se os sócios foram inseridos corretamente
-- (Comentário para referência - não executar em produção)
-- SELECT * FROM socios ORDER BY nome;