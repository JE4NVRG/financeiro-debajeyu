import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  PagamentoComDetalhes, 
  NovoPagamentoForm, 
  UsePagamentosFornecedoresReturn,
  NovaSaidaForm 
} from '../types/database';
import { toast } from 'sonner';
import { 
  pagamentoSchema, 
  validatePagamentoAmount 
} from '../schemas/fornecedores';

export function usePagamentosFornecedores(
  compraId?: string, 
  filtros?: any
): UsePagamentosFornecedoresReturn {
  const [pagamentos, setPagamentos] = useState<PagamentoComDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchPagamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando pagamentos com filtros:', { compraId, filtros });

      let query = supabase
        .from('view_pagamentos_fornecedores_detalhes')
        .select('*')
        .order('data_pagamento', { ascending: false });

      // Filtrar por compra se especificado
      if (compraId) {
        query = query.eq('compra_id', compraId);
      }

      // Aplicar filtros adicionais
      if (filtros) {
        const { fornecedor_id, data_inicio, data_fim } = filtros;

        if (fornecedor_id) {
          query = query.eq('fornecedor_id', fornecedor_id);
        }

        if (data_inicio) {
          query = query.gte('data_pagamento', data_inicio);
        }

        if (data_fim) {
          query = query.lte('data_pagamento', data_fim);
        }
      }

      const { data, error } = await query;

      console.log('📋 Resposta da query de pagamentos:', { data, error });
      console.log('📋 Pagamentos encontrados:', data?.length || 0);

      if (error) throw error;

      setPagamentos(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPagamento = async (pagamento: NovoPagamentoForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Validar dados com Zod
      const validatedData = pagamentoSchema.parse(pagamento);
      
      console.log('🔄 Criando pagamento:', validatedData);
      console.log('👤 Usuário atual:', user);

      // Buscar dados da compra para validação
      const { data: compra, error: compraError } = await supabase
        .from('view_compras_detalhes')
        .select('valor, total_pago')
        .eq('id', validatedData.compra_id)
        .single();

      if (compraError) throw compraError;
      if (!compra) throw new Error('Compra não encontrada');

      // Validar valor do pagamento
      validatePagamentoAmount(validatedData.valor, compra.valor, compra.total_pago || 0);

      const pagamentoData = {
        compra_id: validatedData.compra_id,
        valor: validatedData.valor,
        data_pagamento: validatedData.data_pagamento,
        observacao: validatedData.observacao || null,
        usuario_id: user.id
      };

      console.log('📝 Dados que serão inseridos:', pagamentoData);

      const { data, error } = await supabase
        .from('pagamentos_fornecedores')
        .insert(pagamentoData);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Pagamento criado com sucesso!', data);
      toast.success('Pagamento registrado com sucesso!');
      await fetchPagamentos();
    } catch (err) {
      console.error('❌ Erro ao criar pagamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar pagamento';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updatePagamento = async (id: string, pagamento: Partial<NovoPagamentoForm>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Se está alterando o valor, validar
      if (pagamento.valor_pago) {
        const { data: pagamentoAtual } = await supabase
          .from('view_pagamentos_fornecedores_detalhes')
          .select('compra_id, valor_compra, total_pago_compra')
          .eq('id', id)
          .single();

        if (pagamentoAtual) {
          // Calcular total pago sem este pagamento
          const totalSemEstePagamento = (pagamentoAtual.total_pago_compra || 0) - parseFloat(pagamento.valor_pago);
          validatePagamentoAmount(parseFloat(pagamento.valor_pago), pagamentoAtual.valor_compra, totalSemEstePagamento);
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (pagamento.valor_pago) updateData.valor_pago = parseFloat(pagamento.valor_pago);
      if (pagamento.data_pagamento) updateData.data_pagamento = pagamento.data_pagamento;
      if (pagamento.observacao !== undefined) {
        updateData.observacao = pagamento.observacao?.trim() || null;
      }

      const { error } = await supabase
        .from('pagamentos_fornecedores')
        .update(updateData)
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast.success('Pagamento atualizado com sucesso!');
      await fetchPagamentos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar pagamento';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deletePagamento = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('pagamentos_fornecedores')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast.success('Pagamento excluído com sucesso!');
      await fetchPagamentos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir pagamento';
      toast.error(errorMessage);
      throw err;
    }
  };

  const refetch = () => {
    if (user) {
      fetchPagamentos();
    }
  };

  useEffect(() => {
    if (user) {
      fetchPagamentos();
    }
  }, [user, compraId, filtros]);

  const createSaida = async (saida: NovaSaidaForm) => {
    // Implementação básica - pode ser expandida conforme necessário
    return createPagamento({
      compra_id: saida.compra_id || '',
      conta_id: saida.conta_id,
      data_pagamento: saida.data_pagamento,
      valor_pago: saida.valor_pago,
      observacao: saida.observacao
    });
  };

  return {
    pagamentos,
    loading,
    error,
    refetch,
    createPagamento,
    createSaida,
    deletePagamento
  };
}