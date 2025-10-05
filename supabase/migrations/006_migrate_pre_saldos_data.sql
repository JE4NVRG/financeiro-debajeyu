-- Migração 006: Migrar dados de pre_saldos para socios.pre_saldo e dropar tabela pre_saldos

-- 1. Migrar dados de pre_saldos para socios.pre_saldo (somando por sócio)
-- Atualizar pre_saldo dos sócios com a soma dos valores da tabela pre_saldos
UPDATE socios 
SET pre_saldo = COALESCE((
    SELECT SUM(ps.valor) 
    FROM pre_saldos ps 
    WHERE ps.socio_id = socios.id
), 0);

-- 2. Verificar se a migração foi bem-sucedida
-- (Opcional: criar uma view temporária para auditoria antes de dropar)
CREATE OR REPLACE VIEW v_pre_saldos_backup AS
SELECT 
    s.nome as socio_nome,
    s.pre_saldo as novo_pre_saldo,
    COALESCE(SUM(ps.valor), 0) as soma_pre_saldos_original
FROM socios s
LEFT JOIN pre_saldos ps ON ps.socio_id = s.id
GROUP BY s.id, s.nome, s.pre_saldo;

-- 3. Dropar índices relacionados à tabela pre_saldos
DROP INDEX IF EXISTS idx_pre_saldos_socio_id;
DROP INDEX IF EXISTS idx_pre_saldos_data;
DROP INDEX IF EXISTS idx_pre_saldos_criado_por;

-- 4. Dropar tabela pre_saldos
DROP TABLE IF EXISTS pre_saldos;

-- 5. Dropar view de backup (descomente se quiser manter para auditoria)
-- DROP VIEW IF EXISTS v_pre_saldos_backup;