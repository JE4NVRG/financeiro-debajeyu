import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  TotaisConta, 
  TotaisMarketplace, 
  TotaisDashboard, 
  UseTotaisReturn 
} from '../types/database';

export function useTotais(): UseTotaisReturn {
  const [totaisConta, setTotaisConta] = useState<TotaisConta[]>([]);
  const [totaisMarketplace, setTotaisMarketplace] = useState<TotaisMarketplace[]>([]);
  const [totaisDashboard, setTotaisDashboard] = useState<TotaisDashboard>({
    total_cora: 0,
    total_comissao: 0,
    total_aberto_fornecedores: 0,
    pagamentos_mes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchTotais = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todas as entradas com relacionamentos
      const { data: entradas, error } = await supabase
        .from('entradas')
        .select(`
          *,
          conta:contas(id, nome),
          marketplace:marketplaces(id, nome)
        `);

      if (error) throw error;

      if (!entradas) {
        setTotaisConta([]);
        setTotaisMarketplace([]);
        setTotaisDashboard({ total_cora: 0, total_comissao: 0, total_aberto_fornecedores: 0, pagamentos_mes: 0 });
        return;
      }

      // Calcular totais por conta
      const totaisContaMap = new Map<string, TotaisConta>();
      
      entradas.forEach(entrada => {
        const contaId = entrada.conta_id;
        const existing = totaisContaMap.get(contaId) || {
          conta_id: contaId,
          total_recebido: 0,
          total_entradas: 0
        };

        existing.total_recebido += entrada.valor;
        existing.total_entradas += 1;
        
        totaisContaMap.set(contaId, existing);
      });

      setTotaisConta(Array.from(totaisContaMap.values()));

      // Calcular totais por marketplace
      const totaisMarketplaceMap = new Map<string, TotaisMarketplace>();
      
      entradas.forEach(entrada => {
        const marketplaceId = entrada.marketplace_id;
        const existing = totaisMarketplaceMap.get(marketplaceId) || {
          marketplace_id: marketplaceId,
          total_enviado: 0,
          total_comissao: 0,
          total_marketplace: 0,
          total_entradas: 0
        };

        existing.total_enviado += entrada.valor;
        existing.total_entradas += 1;
        
        if (entrada.comissao_paga) {
          existing.total_comissao += entrada.valor * 0.04;
        }
        
        existing.total_marketplace = existing.total_enviado + existing.total_comissao;
        
        totaisMarketplaceMap.set(marketplaceId, existing);
      });

      setTotaisMarketplace(Array.from(totaisMarketplaceMap.values()));

      // Calcular totais do dashboard
      const totalCora = entradas.reduce((sum, entrada) => sum + entrada.valor, 0);
      const totalComissao = entradas.reduce((sum, entrada) => {
        return entrada.comissao_paga ? sum + (entrada.valor * 0.04) : sum;
      }, 0);

      setTotaisDashboard({
        total_cora: totalCora,
        total_comissao: totalComissao,
        total_aberto_fornecedores: 0,
        pagamentos_mes: 0
      });

    } catch (err) {
      setError(err as Error);
      console.error('Erro ao calcular totais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTotais();
    }
  }, [user]);

  return {
    totaisConta,
    totaisMarketplace,
    totaisDashboard,
    loading,
    error,
    refetch: fetchTotais
  };
}