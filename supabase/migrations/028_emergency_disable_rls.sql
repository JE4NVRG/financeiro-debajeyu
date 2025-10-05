-- Migration 028: Emergency - Completely disable RLS for entradas
-- This will allow entries to be saved immediately

-- Disable RLS for entradas table
ALTER TABLE entradas DISABLE ROW LEVEL SECURITY;