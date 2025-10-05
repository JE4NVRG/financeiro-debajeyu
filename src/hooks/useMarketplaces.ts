import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Marketplace, NovoMarketplaceForm } from '../types/database';
import { toast } from 'sonner';

export function useMarketplaces() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchMarketplaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      setMarketplaces(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar marketplaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMarketplace = async (marketplace: NovoMarketplaceForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      console.log('Tentando criar marketplace:', marketplace);
      console.log('Usuário autenticado:', user);

      const { data, error } = await supabase
        .from('marketplaces')
        .insert({
          nome: marketplace.nome
        })
        .select();

      console.log('Resposta do Supabase:', { data, error });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      toast.success('Marketplace criado com sucesso!');
      await fetchMarketplaces();
    } catch (err) {
      console.error('Erro completo ao criar marketplace:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar marketplace';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMarketplaces();
    }
  }, [user]);

  return {
    marketplaces,
    loading,
    error,
    refetch: fetchMarketplaces,
    createMarketplace
  };
}