-- Criar tabela pagamentos_fornecedores
CREATE TABLE pagamentos_fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES contas(id),
    data_pagamento DATE NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL CHECK (valor_pago > 0),
    observacao TEXT,
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pagamentos_fornecedores_compra_id ON pagamentos_fornecedores(compra_id);
CREATE INDEX idx_pagamentos_fornecedores_conta_id ON pagamentos_fornecedores(conta_id);
CREATE INDEX idx_pagamentos_fornecedores_usuario_id ON pagamentos_fornecedores(usuario_id);
CREATE INDEX idx_pagamentos_fornecedores_data ON pagamentos_fornecedores(data_pagamento DESC);

-- RLS Policies
ALTER TABLE pagamentos_fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os pagamentos" ON pagamentos_fornecedores
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir próprios pagamentos" ON pagamentos_fornecedores
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar próprios pagamentos" ON pagamentos_fornecedores
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar próprios pagamentos" ON pagamentos_fornecedores
    FOR DELETE USING (auth.uid() = usuario_id);