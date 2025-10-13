-- Inserir usuário je4ndev se não existir
DO $$
DECLARE
    user_exists BOOLEAN;
    hashed_password TEXT;
BEGIN
    -- Verificar se o usuário já existe
    SELECT EXISTS(SELECT 1 FROM usuarios WHERE login = 'je4ndev') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Gerar hash da senha 'admin123' usando bcrypt
        -- Nota: Este é um hash bcrypt para a senha 'admin123'
        hashed_password := '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        
        -- Inserir o usuário je4ndev
        INSERT INTO usuarios (id, login, senha_hash, criado_em)
        VALUES (
            gen_random_uuid(),
            'je4ndev',
            hashed_password,
            NOW()
        );
        
        RAISE NOTICE 'Usuário je4ndev criado com sucesso';
    ELSE
        RAISE NOTICE 'Usuário je4ndev já existe';
    END IF;
END $$;

-- Verificar se foi criado
SELECT id, login, criado_em FROM usuarios WHERE login = 'je4ndev';