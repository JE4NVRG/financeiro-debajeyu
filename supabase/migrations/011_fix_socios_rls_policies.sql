-- Migração 011: Corrigir políticas RLS para tabela socios

-- 1. Primeiro, vamos verificar e dropar políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Usuários autenticados podem inserir sócios" ON socios;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar sócios" ON socios;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar sócios" ON socios;
DROP POLICY IF EXISTS "Usuários podem ver todos os sócios" ON socios;
DROP POLICY IF EXISTS "Enable read access for all users" ON socios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON socios;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON socios;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON socios;

-- 2. Criar políticas RLS simples e funcionais para socios
-- Política para SELECT (leitura)
CREATE POLICY "socios_select_policy" ON socios
    FOR SELECT USING (true);

-- Política para INSERT (inserção)
CREATE POLICY "socios_insert_policy" ON socios
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE (atualização)
CREATE POLICY "socios_update_policy" ON socios
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE (exclusão)
CREATE POLICY "socios_delete_policy" ON socios
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Garantir que RLS está habilitado
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;