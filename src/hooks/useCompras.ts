import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  CompraComSaldo, 
  NovaCompraForm, 
  UseComprasReturn,
  FiltrosCompra 
} from '../types/database';
import { toast } from 'sonner';
import { 
  compraSchema, 
  validateCompraDeletion,
  validateCompraDate 
} from '../schemas/fornecedores';
import { novaCompraSchema } from '../schemas/compras';

export function useCompras(fornecedorId?: string, filtros?: FiltrosCompra): UseComprasReturn {
  const [compras, setCompras] = useState<CompraComSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchCompras = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando compras com filtros:', { fornecedorId, filtros });

      let query = supabase
        .from('view_compras_detalhes')
        .select(`
          id,
          fornecedor_id,
          data,
          descricao,
          categoria,
          valor_total,
          forma,
          vencimento,
          status,
          created_at,
          updated_at,
          usuario_id,
          fornecedor_nome,
          fornecedor_tipo,
          valor_pago,
          valor_pendente
        `)
        .order('data', { ascending: false });

      // Filtrar por fornecedor se especificado
      if (fornecedorId) {
        query = query.eq('fornecedor_id', fornecedorId);
      }

      // Aplicar filtros adicionais
      if (filtros) {
        const { status, dataInicio, dataFim } = filtros;

        if (status) {
          query = query.eq('status', status);
        }

        if (dataInicio) {
          query = query.gte('data', dataInicio);
        }

        if (dataFim) {
          query = query.lte('data', dataFim);
        }
      }

      const { data, error } = await query;

      console.log('📋 Resposta da query de compras:', { data, error });
      console.log('📋 Compras encontradas:', data?.length || 0);

      if (error) throw error;

      setCompras((data || []).map(item => ({
        ...item,
        total_pago: item.valor_pago || 0,
        saldo_aberto: item.valor_pendente || 0
      })));
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar compras:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCompra = async (compra: NovaCompraForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Validar dados com Zod
      const validatedData = novaCompraSchema.parse(compra);
      
      console.log('🔄 Criando compra:', validatedData);
      console.log('👤 Usuário atual:', user);

      const compraData = {
        fornecedor_id: validatedData.fornecedor_id,
        data: validatedData.data,
        descricao: validatedData.descricao,
        categoria: validatedData.categoria,
        valor_total: validatedData.valor_total,
        forma: validatedData.forma,
        vencimento: validatedData.vencimento,
        status: validatedData.status,
        usuario_id: user.id
      };

      console.log('📝 Dados que serão inseridos:', compraData);

      const { data, error } = await supabase
        .from('compras')
        .insert(compraData);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Compra criada com sucesso!', data);
      toast.success('Compra registrada com sucesso!');
      await fetchCompras();
    } catch (err) {
      console.error('❌ Erro ao criar compra:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar compra';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateCompra = async (id: string, compra: Partial<NovaCompraForm>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Validar dados parciais
      if (compra.data) {
        // Buscar pagamentos existentes para validar datas
        const { data: pagamentos } = await supabase
          .from('pagamentos_fornecedores')
          .select('data_pagamento')
          .eq('compra_id', id);

        const datasPagamentos = pagamentos?.map(p => p.data_pagamento) || [];
        validateCompraDate(compra.data, datasPagamentos);
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (compra.descricao) updateData.descricao = compra.descricao.trim();
      if (compra.valor_total) updateData.valor_total = parseFloat(compra.valor_total);
      if (compra.forma) updateData.forma = compra.forma;
      if (compra.data) updateData.data = compra.data;
      if (compra.observacao !== undefined) {
        updateData.observacao = compra.observacao?.trim() || null;
      }

      const { error } = await supabase
        .from('compras')
        .update(updateData)
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast.success('Compra atualizada com sucesso!');
      await fetchCompras();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar compra';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteCompra = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Verificar se a compra tem pagamentos
      const { data: pagamentos, error: pagamentosError } = await supabase
        .from('pagamentos_fornecedores')
        .select('id')
        .eq('compra_id', id)
        .limit(1);

      if (pagamentosError) throw pagamentosError;

      // Validar exclusão com regra de negócio
      validateCompraDeletion(pagamentos?.length || 0);

      const { error } = await supabase
        .from('compras')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast.success('Compra excluída com sucesso!');
      await fetchCompras();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir compra';
      toast.error(errorMessage);
      throw err;
    }
  };

  const refetch = () => {
    if (user) {
      fetchCompras();
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompras();
    }
  }, [user, fornecedorId, filtros]);

  return {
    compras,
    loading,
    error,
    refetch,
    createCompra,
    updateCompra,
    deleteCompra
  };
}