import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TotalBlockedAmounts, MarketplaceBalanceHistory } from '../types/database';

export function useBlockedAmounts() {
  const [totalBlocked, setTotalBlocked] = useState<TotalBlockedAmounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchTotalBlocked = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar detalhes dos marketplaces diretamente
      const { data: marketplacesData, error: marketplacesError } = await supabase
        .from('marketplaces')
        .select('id, nome, dinheiro_a_liberar')
        .eq('ativo', true)
        .order('nome');

      if (marketplacesError) throw marketplacesError;

      // Calcular o total manualmente
      const total = (marketplacesData || []).reduce((sum, mp) => {
        return sum + (mp.dinheiro_a_liberar || 0);
      }, 0);

      const result: TotalBlockedAmounts = {
        total_blocked: total,
        marketplaces: (marketplacesData || []).map(mp => ({
          marketplace_id: mp.id,
          marketplace_nome: mp.nome,
          dinheiro_a_liberar: mp.dinheiro_a_liberar || 0
        }))
      };

      setTotalBlocked(result);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar valores bloqueados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTotalBlocked();
    }
  }, [user]);

  return {
    totalBlocked,
    loading,
    error,
    refetch: fetchTotalBlocked
  };
}

export function useMarketplaceHistory(marketplaceId?: string) {
  const [history, setHistory] = useState<MarketplaceBalanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('marketplace_balance_history')
        .select(`
          *,
          marketplace:marketplaces(nome),
          usuario:usuarios(email)
        `)
        .order('created_at', { ascending: false });

      if (marketplaceId) {
        query = query.eq('marketplace_id', marketplaceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setHistory(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, marketplaceId]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
}