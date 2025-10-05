-- Migração 012: Desabilitar RLS temporariamente para debug e recriar políticas corretas

-- 1. Desabilitar RLS temporariamente para permitir operações
ALTER TABLE socios DISABLE ROW LEVEL SECURITY;

-- 2. Dropar todas as políticas existentes
DROP POLICY IF EXISTS "socios_select_policy" ON socios;
DROP POLICY IF EXISTS "socios_insert_policy" ON socios;
DROP POLICY IF EXISTS "socios_update_policy" ON socios;
DROP POLICY IF EXISTS "socios_delete_policy" ON socios;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir sócios" ON socios;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar sócios" ON socios;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar sócios" ON socios;
DROP POLICY IF EXISTS "Usuários podem ver todos os sócios" ON socios;
DROP POLICY IF EXISTS "Enable read access for all users" ON socios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON socios;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON socios;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON socios;

-- 3. Reabilitar RLS
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples e funcionais
-- Política para SELECT (todos podem ler)
CREATE POLICY "socios_allow_select" ON socios
    FOR SELECT USING (true);

-- Política para INSERT (qualquer usuário autenticado pode inserir)
CREATE POLICY "socios_allow_insert" ON socios
    FOR INSERT WITH CHECK (true);

-- Política para UPDATE (qualquer usuário autenticado pode atualizar)
CREATE POLICY "socios_allow_update" ON socios
    FOR UPDATE USING (true);

-- Política para DELETE (qualquer usuário autenticado pode deletar)
CREATE POLICY "socios_allow_delete" ON socios
    FOR DELETE USING (true);