-- Teste da query de despesas com JOINs
SELECT 
  d.id,
  d.descricao,
  d.valor,
  d.data_vencimento,
  d.status,
  d.tipo,
  d.categoria_id,
  d.conta_id,
  d.usuario_id,
  c.nome as categoria_nome,
  c.cor as categoria_cor,
  c.icone as categoria_icone,
  ct.nome as conta_nome,
  u.login as usuario_login
FROM despesas d
LEFT JOIN categorias_despesas c ON d.categoria_id = c.id
LEFT JOIN contas ct ON d.conta_id = ct.id
LEFT JOIN usuarios u ON d.usuario_id = u.id
ORDER BY d.created_at DESC
LIMIT 10;