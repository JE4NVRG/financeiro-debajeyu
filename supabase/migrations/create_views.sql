-- Criar views necessárias para o sistema de fornecedores

-- View para detalhes de compras
CREATE OR REPLACE VIEW view_compras_detalhes AS
SELECT 
    c.id,
    c.fornecedor_id,
    c.data,
    c.descricao,
    c.categoria,
    c.valor_total,
    c.forma,
    c.vencimento,
    c.status,
    c.created_at,
    c.updated_at,
    c.usuario_id,
    f.nome as fornecedor_nome,
    f.tipo as fornecedor_tipo,
    COALESCE(SUM(pf.valor_pago), 0) as valor_pago,
    (c.valor_total - COALESCE(SUM(pf.valor_pago), 0)) as valor_pendente
FROM compras c
LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
LEFT JOIN pagamentos_fornecedores pf ON c.id = pf.compra_id
GROUP BY c.id, f.nome, f.tipo;

-- View para detalhes de pagamentos de fornecedores
CREATE OR REPLACE VIEW view_pagamentos_fornecedores_detalhes AS
SELECT 
    pf.id,
    pf.compra_id,
    pf.conta_id,
    pf.data_pagamento,
    pf.valor_pago,
    pf.observacao,
    pf.usuario_id,
    pf.created_at,
    c.fornecedor_id,
    c.descricao as compra_descricao,
    c.valor_total as compra_valor_total,
    f.nome as fornecedor_nome,
    f.tipo as fornecedor_tipo,
    co.nome as conta_nome
FROM pagamentos_fornecedores pf
LEFT JOIN compras c ON pf.compra_id = c.id
LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
LEFT JOIN contas co ON pf.conta_id = co.id;

-- Drop e recriar view para totais de fornecedores
DROP VIEW IF EXISTS view_fornecedores_totais;
CREATE VIEW view_fornecedores_totais AS
SELECT 
    f.id,
    f.nome,
    f.tipo,
    f.status,
    f.observacao,
    f.created_at,
    f.updated_at,
    f.usuario_id,
    COALESCE(SUM(c.valor_total), 0) as total_gasto,
    COALESCE(SUM(pf.valor_pago), 0) as total_pago,
    COALESCE(SUM(c.valor_total), 0) - COALESCE(SUM(pf.valor_pago), 0) as total_aberto,
    COUNT(c.id) as quantidade_compras,
    MAX(c.data) as ultima_compra
FROM fornecedores f
LEFT JOIN compras c ON f.id = c.fornecedor_id
LEFT JOIN pagamentos_fornecedores pf ON c.id = pf.compra_id
GROUP BY f.id, f.nome, f.tipo, f.status, f.observacao, f.created_at, f.updated_at, f.usuario_id;