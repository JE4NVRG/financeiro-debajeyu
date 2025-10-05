-- Conceder permissões básicas para role anon
GRANT SELECT ON socios TO anon;

-- Conceder permissões completas para role authenticated
GRANT ALL PRIVILEGES ON usuarios TO authenticated;
GRANT ALL PRIVILEGES ON socios TO authenticated;
GRANT ALL PRIVILEGES ON investimentos TO authenticated;
GRANT ALL PRIVILEGES ON pre_saldos TO authenticated;