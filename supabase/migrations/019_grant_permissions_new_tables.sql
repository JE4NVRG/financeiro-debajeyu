-- Grant permissions for contas table
GRANT SELECT ON contas TO anon;
GRANT ALL PRIVILEGES ON contas TO authenticated;

-- Grant permissions for marketplaces table
GRANT SELECT ON marketplaces TO anon;
GRANT ALL PRIVILEGES ON marketplaces TO authenticated;

-- Grant permissions for entradas table
GRANT SELECT ON entradas TO anon;
GRANT ALL PRIVILEGES ON entradas TO authenticated;