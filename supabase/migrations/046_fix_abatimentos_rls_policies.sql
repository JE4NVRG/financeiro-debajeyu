-- Corrigir políticas RLS para abatimentos_pre_saldo
-- O problema é que auth.role() = 'authenticated' não funciona corretamente
-- Devemos usar auth.uid() IS NOT NULL para verificar se o usuário está autenticado

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem ver abatimentos" ON abatimentos_pre_saldo;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir abatimentos" ON abatimentos_pre_saldo;

-- Criar novas políticas corretas
CREATE POLICY "Usuários autenticados podem ver abatimentos" ON abatimentos_pre_saldo
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir abatimentos" ON abatimentos_pre_saldo
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para atualização (caso necessário no futuro)
CREATE POLICY "Usuários autenticados podem atualizar abatimentos" ON abatimentos_pre_saldo
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Política para exclusão (caso necessário no futuro)
CREATE POLICY "Usuários autenticados podem deletar abatimentos" ON abatimentos_pre_saldo
    FOR DELETE USING (auth.uid() IS NOT NULL);