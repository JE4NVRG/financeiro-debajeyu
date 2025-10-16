import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Marketplace, 
  NovoMarketplaceForm, 
  TotalBlockedAmounts, 
  EditBlockedAmountForm,
  MarketplaceBalanceHistory 
} from '../types/database';
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

      const dinheiroALiberar = marketplace.dinheiro_a_liberar 
        ? parseFloat(marketplace.dinheiro_a_liberar.replace(/[^\d,]/g, '').replace(',', '.'))
        : 0;

      const { data, error } = await supabase
        .from('marketplaces')
        .insert({
          nome: marketplace.nome,
          dinheiro_a_liberar: dinheiroALiberar
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

  const updateBlockedAmount = async (form: EditBlockedAmountForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const valor = parseFloat(form.valor.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;

      const { error } = await supabase
        .from('marketplaces')
        .update({ dinheiro_a_liberar: valor })
        .eq('id', form.marketplace_id);

      if (error) throw error;

      toast.success('Saldo a liberar atualizado com sucesso!');
      await fetchMarketplaces();
    } catch (err) {
      console.error('Erro ao atualizar saldo a liberar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar saldo a liberar';
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
    createMarketplace,
    updateBlockedAmount
  };
}