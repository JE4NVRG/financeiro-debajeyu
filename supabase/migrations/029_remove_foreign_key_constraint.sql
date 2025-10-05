-- Migration 029: Remove foreign key constraint from entradas table
-- This fixes the error 23503 where usuario_id doesn't exist in auth.users

-- Remove the foreign key constraint that's causing the error
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_usuario_id_fkey;

-- Ensure usuario_id column remains NOT NULL but without foreign key constraint
ALTER TABLE entradas ALTER COLUMN usuario_id SET NOT NULL;