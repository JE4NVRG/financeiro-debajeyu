-- Migração 008: Atualizar políticas RLS conforme nova especificação

-- 1. Dropar políticas antigas relacionadas à tabela pre_saldos (que será removida)
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os pré-saldos" ON pre_saldos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir pré-saldos" ON pre_saldos;
DROP POLICY IF EXISTS "Usuários podem editar pré-saldos que criaram" ON pre_saldos;
DROP POLICY IF EXISTS "Usuários podem deletar pré-saldos que criaram" ON pre_saldos;

-- 2. Dropar políticas antigas de investimentos para recriar sem campo criado_por
DROP POLICY IF EXISTS "Usuários podem editar investimentos que criaram" ON investimentos;
DROP POLICY IF EXISTS "Usuários podem deletar investimentos que criaram" ON investimentos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir investimentos" ON investimentos;

-- 3. Atualizar políticas para socios
-- Adicionar políticas de escrita para sócios
CREATE POLICY "Usuários autenticados podem inserir sócios" ON socios
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar sócios" ON socios
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar sócios" ON socios
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Atualizar políticas para investimentos (sem campo criado_por)
CREATE POLICY "Usuários autenticados podem inserir investimentos" ON investimentos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar investimentos" ON investimentos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar investimentos" ON investimentos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Nota: As políticas de SELECT já existem e permitem leitura geral para usuários autenticados