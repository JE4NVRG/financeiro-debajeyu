-- Criar função para alterar senha no sistema customizado
-- Migration: 069_create_change_password_function

-- Função para alterar senha do usuário
CREATE OR REPLACE FUNCTION change_user_password(
    p_user_id UUID,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stored_password TEXT;
    v_salt TEXT;
BEGIN
    -- Buscar a senha atual e salt do usuário
    SELECT senha, salt INTO v_stored_password, v_salt
    FROM usuarios
    WHERE id = p_user_id;
    
    -- Verificar se o usuário existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Verificar se a senha atual está correta
    -- Assumindo que a senha é armazenada como hash(senha + salt)
    IF v_stored_password != crypt(p_current_password, v_salt) THEN
        RAISE EXCEPTION 'Senha atual incorreta';
    END IF;
    
    -- Gerar novo salt e hash para a nova senha
    v_salt := gen_salt('bf');
    
    -- Atualizar a senha do usuário
    UPDATE usuarios 
    SET 
        senha = crypt(p_new_password, v_salt),
        salt = v_salt,
        atualizado_em = NOW()
    WHERE id = p_user_id;
    
    -- Senha alterada com sucesso (sem log por enquanto)
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-lançar o erro sem tentar fazer log
        RAISE;
END;
$$;

-- Garantir que apenas usuários autenticados podem executar a função
GRANT EXECUTE ON FUNCTION change_user_password(UUID, TEXT, TEXT) TO authenticated;