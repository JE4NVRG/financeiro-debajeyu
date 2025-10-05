import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Conta } from '../types/database';

export function useContas() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchContas = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando contas...');
      console.log('👤 Usuário atual:', user);
      console.log('🔑 Supabase client:', supabase);
      
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('ativa', true)
        .order('nome');

      console.log('📊 Resposta da query:', { data, error });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      console.log('📊 Contas encontradas:', data);
      setContas(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('❌ Erro ao buscar contas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('👤 Usuário logado, buscando contas...');
      fetchContas();
    }
  }, [user]);

  return {
    contas,
    loading,
    error,
    refetch: fetchContas
  };
}