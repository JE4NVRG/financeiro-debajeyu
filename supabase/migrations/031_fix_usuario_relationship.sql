-- Migration 031: Fix usuario relationship in entradas table
-- Ensure the foreign key constraint exists and is properly configured

-- First, check if there are any orphaned records
-- Delete any entradas that don't have a corresponding usuario
DELETE FROM entradas 
WHERE usuario_id NOT IN (SELECT id FROM usuarios);

-- Now add the foreign key constraint if it doesn't exist
ALTER TABLE entradas 
ADD CONSTRAINT entradas_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;

-- Add comment for documentation
COMMENT ON CONSTRAINT entradas_usuario_id_fkey ON entradas IS 'Foreign key para relacionar entradas com usuarios da tabela usuarios (sistema de auth customizado)';