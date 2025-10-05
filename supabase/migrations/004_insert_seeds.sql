-- Inserir dados iniciais dos sócios
INSERT INTO socios (nome) VALUES 
    ('Jean'),
    ('Yuri'),
    ('Bárbara');

-- Inserir usuário admin (senha: admin123 - hash bcrypt)
-- Hash gerado com bcrypt para a senha "admin123"
INSERT INTO usuarios (login, senha_hash) VALUES 
    ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');