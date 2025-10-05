-- Migration 039: Fix foreign key constraint for fornecedores table
-- The issue is that the foreign key is correctly pointing to auth.users,
-- but we need to ensure the user exists and the constraint is properly configured

-- First, let's check if there are any users in auth.users
-- and ensure the constraint is working properly

-- Drop the existing foreign key constraint temporarily
ALTER TABLE public.fornecedores 
DROP CONSTRAINT IF EXISTS fornecedores_usuario_id_fkey;

-- Recreate the foreign key constraint with proper configuration
-- This ensures it references auth.users correctly
ALTER TABLE public.fornecedores 
ADD CONSTRAINT fornecedores_usuario_id_fkey 
FOREIGN KEY (usuario_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Grant necessary permissions to authenticated users on auth.users
-- This is needed for the foreign key to work properly
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Create a function to ensure user exists in auth.users when creating fornecedor
-- This is a safety measure
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.usuario_id) THEN
    RAISE EXCEPTION 'User with ID % does not exist in auth.users', NEW.usuario_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure user exists before inserting fornecedor
DROP TRIGGER IF EXISTS ensure_user_exists_trigger ON public.fornecedores;
CREATE TRIGGER ensure_user_exists_trigger
  BEFORE INSERT OR UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_exists();

-- Add some debug information
-- Let's see what users exist in auth.users
-- This will help us understand if the current user is there
COMMENT ON TABLE public.fornecedores IS 'Fornecedores table with fixed foreign key constraint to auth.users';