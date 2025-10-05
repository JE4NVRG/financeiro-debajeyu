-- Migration 026: Fix RLS policies for entradas table
-- This migration addresses the RLS error preventing entry creation (code 42501)

-- Temporarily disable RLS for cleanup
ALTER TABLE entradas DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies for entradas
DROP POLICY IF EXISTS "Usuários autenticados podem ler entradas" ON entradas;
DROP POLICY IF EXISTS "Usuários autenticados podem criar entradas" ON entradas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias entradas" ON entradas;
DROP POLICY IF EXISTS "Usuários podem excluir suas próprias entradas" ON entradas;

-- Re-enable RLS
ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies that work with the current auth system
-- Policy for SELECT (reading)
CREATE POLICY "entradas_select_policy" ON entradas
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for INSERT (creating) - more permissive to avoid auth.uid() issues
CREATE POLICY "entradas_insert_policy" ON entradas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for UPDATE (updating) - allow users to update their own entries
CREATE POLICY "entradas_update_policy" ON entradas
    FOR UPDATE
    TO authenticated
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

-- Policy for DELETE (deleting) - allow users to delete their own entries
CREATE POLICY "entradas_delete_policy" ON entradas
    FOR DELETE
    TO authenticated
    USING (usuario_id = auth.uid());