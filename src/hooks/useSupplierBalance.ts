import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FornecedorSaldoHistory, EditSupplierBalanceForm } from '@/types/database';
import { toast } from 'sonner';

export interface UseSupplierBalanceReturn {
  updateSupplierBalance: (form: EditSupplierBalanceForm) => Promise<void>;
  getBalanceHistory: (fornecedorId: string) => Promise<FornecedorSaldoHistory[]>;
  loading: boolean;
  error: Error | null;
}

export function useSupplierBalance(): UseSupplierBalanceReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateSupplierBalance = useCallback(async (form: EditSupplierBalanceForm) => {
    setLoading(true);
    setError(null);

    try {
      // Convert BRL string to number
      const valor = parseFloat(form.valor.replace(/[^\d,]/g, '').replace(',', '.'));
      
      if (isNaN(valor) || valor < 0) {
        throw new Error('Valor inválido');
      }

      // Call the database function to update balance with history
      const { data, error: functionError } = await supabase.rpc(
        'update_fornecedor_saldo_manual',
        {
          p_fornecedor_id: form.fornecedor_id,
          p_novo_saldo: valor,
          p_observacao: form.observacao
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data) {
        throw new Error('Erro ao atualizar saldo do fornecedor');
      }

      toast.success('Saldo devedor atualizado com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(new Error(errorMessage));
      toast.error(`Erro ao atualizar saldo: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBalanceHistory = useCallback(async (fornecedorId: string): Promise<FornecedorSaldoHistory[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('fornecedor_saldo_history')
        .select(`
          *,
          fornecedor:fornecedores(nome),
          usuario:usuarios(login)
        `)
        .eq('fornecedor_id', fornecedorId)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(new Error(errorMessage));
      toast.error(`Erro ao buscar histórico: ${errorMessage}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateSupplierBalance,
    getBalanceHistory,
    loading,
    error
  };
}