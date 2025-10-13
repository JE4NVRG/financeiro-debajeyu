import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PagamentoParcialResult {
  success: boolean;
  pagamento_id?: string;
  valor_pago?: number;
  saldo_restante?: number;
  status_compra?: string;
  fornecedor_id?: string;
  error?: string;
}

interface HistoricoPagamento {
  id: string;
  compra_id: string;
  fornecedor_nome: string;
  compra_valor_total: number;
  valor_pago: number;
  tipo_pagamento: 'total' | 'parcial';
  foi_pago_automatico: boolean;
  saldo_anterior: number;
  saldo_posterior: number;
  data_pagamento: string;
  observacao: string;
  conta_nome: string;
  is_cora_account: boolean;
}

export const usePagamentoParcial = () => {
  const [loading, setLoading] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const { user } = useAuth();

  const pagarParcial = async (
    compraId: string, 
    contaId: string, 
    valorPago: number, 
    observacao?: string
  ): Promise<PagamentoParcialResult> => {
    setLoading(true);
    try {
      console.log('🚀 Iniciando pagamento parcial:', { 
        compraId, 
        contaId, 
        valorPago, 
        observacao 
      });

      // Usar função SQL para processar pagamento parcial
      const { data, error } = await supabase.rpc('process_pagamento_parcial', {
        p_compra_id: compraId,
        p_valor_pagamento: valorPago,
        p_user_id: user?.id,
        p_foi_pago: true
      });

      if (error) {
        console.error('❌ Erro no pagamento parcial:', error);
        toast({
          title: "Erro no Pagamento",
          description: error.message || "Erro ao processar pagamento parcial",
          variant: "destructive",
        });
        return {
          success: false,
          error: error.message
        };
      }

      const result = data as PagamentoParcialResult;

      if (!result.success) {
        console.error('❌ Pagamento parcial rejeitado:', result.error);
        toast({
          title: "Pagamento Rejeitado",
          description: result.error || "Não foi possível processar o pagamento",
          variant: "destructive",
        });
        return result;
      }

      console.log('✅ Pagamento parcial processado com sucesso:', result);
      
      const statusMessage = result.status_compra === 'pago' 
        ? 'Compra quitada completamente!' 
        : `Restam R$ ${result.saldo_restante?.toFixed(2)} para quitar`;

      toast({
        title: "Pagamento Parcial Realizado",
        description: `R$ ${result.valor_pago?.toFixed(2)} pago. ${statusMessage}`,
        variant: "default",
      });

      return result;
    } catch (error) {
      console.error('💥 Erro crítico no pagamento parcial:', error);
      toast({
        title: "Erro Crítico",
        description: "Erro interno no sistema de pagamentos",
        variant: "destructive",
      });
      return {
        success: false,
        error: 'Erro interno no sistema'
      };
    } finally {
      setLoading(false);
    }
  };

  const buscarHistoricoPagamentos = async (compraId: string): Promise<HistoricoPagamento[]> => {
    setLoadingHistorico(true);
    try {
      console.log('📋 Buscando histórico de pagamentos para compra:', compraId);

      const { data, error } = await supabase
        .from('vw_historico_pagamentos')
        .select('*')
        .eq('compra_id', compraId)
        .order('data_pagamento', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        return [];
      }

      console.log('✅ Histórico carregado:', data?.length || 0, 'pagamentos');
      return data || [];
    } catch (error) {
      console.error('💥 Erro crítico ao buscar histórico:', error);
      return [];
    } finally {
      setLoadingHistorico(false);
    }
  };

  const buscarCompraDetalhes = async (compraId: string) => {
    try {
      const { data, error } = await supabase
        .from('compras')
        .select(`
          *,
          fornecedores (
            id,
            nome
          )
        `)
        .eq('id', compraId)
        .single();

      if (error) {
        console.error('Erro ao buscar detalhes da compra:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro crítico ao buscar compra:', error);
      return null;
    }
  };

  const buscarDetalhesCompra = buscarCompraDetalhes;

  const validarSaldoConta = async (contaId: string, valorSolicitado: number) => {
    try {
      const { data, error } = await supabase.rpc('validate_account_balance', {
        p_conta_id: contaId,
        p_valor_solicitado: valorSolicitado
      });

      if (error) {
        console.error('Erro ao validar saldo:', error);
        return {
          success: false,
          error: 'Erro ao validar saldo da conta'
        };
      }

      return data;
    } catch (error) {
      console.error('Erro na validação de saldo:', error);
      return {
        success: false,
        error: 'Erro interno na validação'
      };
    }
  };

  return {
    pagarParcial,
    buscarHistoricoPagamentos,
    buscarCompraDetalhes,
    buscarDetalhesCompra,
    validarSaldoConta,
    loading,
    loadingHistorico
  };
};