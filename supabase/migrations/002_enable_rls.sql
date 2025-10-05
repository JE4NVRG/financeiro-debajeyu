-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_saldos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios
CREATE POLICY "Usuarios podem ver apenas seus próprios dados" ON usuarios
    FOR ALL USING (auth.uid()::text = id::text);

-- Políticas RLS para socios
CREATE POLICY "Usuários autenticados podem ver todos os sócios" ON socios
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas RLS para investimentos
CREATE POLICY "Usuários autenticados podem ver todos os investimentos" ON investimentos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir investimentos" ON investimentos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem editar investimentos que criaram" ON investimentos
    FOR UPDATE USING (criado_por::text = auth.uid()::text);

CREATE POLICY "Usuários podem deletar investimentos que criaram" ON investimentos
    FOR DELETE USING (criado_por::text = auth.uid()::text);

-- Políticas RLS para pre_saldos
CREATE POLICY "Usuários autenticados podem ver todos os pré-saldos" ON pre_saldos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir pré-saldos" ON pre_saldos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem editar pré-saldos que criaram" ON pre_saldos
    FOR UPDATE USING (criado_por::text = auth.uid()::text);

CREATE POLICY "Usuários podem deletar pré-saldos que criaram" ON pre_saldos
    FOR DELETE USING (criado_por::text = auth.uid()::text);