-- Criar relacionamento entre entradas e usuarios
-- Resolve erro PGRST200: Could not find a relationship between 'entradas' and 'usuarios'

-- Adicionar foreign key constraint entre entradas.usuario_id e usuarios.id
ALTER TABLE entradas 
ADD CONSTRAINT entradas_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;

-- Comentário para documentar o relacionamento
COMMENT ON CONSTRAINT entradas_usuario_id_fkey ON entradas IS 'Foreign key para relacionar entradas com usuarios da tabela usuarios (sistema de auth customizado)';