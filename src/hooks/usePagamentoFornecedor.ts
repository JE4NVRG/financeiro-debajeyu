import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CompraComSaldo } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

interface PagamentoFornecedorResult {
  success: boolean;
  error?: string;
  pagamentos?: any[];
}

export function usePagamentoFornecedor() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Buscar compras em aberto de um fornecedor específico
  const buscarComprasEmAberto = async (fornecedorId: string): Promise<CompraComSaldo[]> => {
    try {
      console.log('🔍 Buscando compras em aberto para fornecedor:', fornecedorId);

      const { data, error } = await supabase
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
        .eq('fornecedor_id', fornecedorId)
        .in('status', ['Aberta', 'Parcial'])
        .gt('valor_pendente', 0)
        .order('data', { ascending: true }); // Mais antigas primeiro

      if (error) throw error;

      const comprasEmAberto = (data || []).map(item => ({
        ...item,
        total_pago: item.valor_pago || 0,
        saldo_aberto: item.valor_pendente || 0
      }));

      console.log('📋 Compras em aberto encontradas:', comprasEmAberto.length);
      return comprasEmAberto;
    } catch (error) {
      console.error('Erro ao buscar compras em aberto:', error);
      throw error;
    }
  };

  // Pagar todas as compras em aberto de um fornecedor
  const pagarTodasCompras = async (fornecedorId: string): Promise<PagamentoFornecedorResult> => {
    try {
      console.log('🚀 [HOOK] Iniciando pagarTodasCompras para fornecedor:', fornecedorId);
      setLoading(true);
      console.log('💰 [HOOK] Loading state definido como true');

      // 1. Buscar compras em aberto
      console.log('🔍 [HOOK] Buscando compras em aberto...');
      const comprasEmAberto = await buscarComprasEmAberto(fornecedorId);
      console.log('📋 [HOOK] Compras encontradas:', comprasEmAberto.length);

      if (comprasEmAberto.length === 0) {
        console.log('❌ [HOOK] Nenhuma compra em aberto encontrada');
        return {
          success: false,
          error: 'Nenhuma compra em aberto encontrada para este fornecedor'
        };
      }

      // 2. Calcular valor total
      const valorTotal = comprasEmAberto.reduce((sum, compra) => sum + compra.saldo_aberto, 0);
      console.log('💰 [HOOK] Valor total a pagar:', valorTotal);

      // 3. Verificar se há saldo suficiente na conta Cora
      console.log('🏦 [HOOK] Verificando conta Cora...');
      const { data: contaCora, error: contaError } = await supabase
        .from('contas')
        .select('id, saldo_atual')
        .eq('nome', 'Cora')
        .single();

      if (contaError || !contaCora) {
        console.error('❌ [HOOK] Erro ao buscar conta Cora:', contaError);
        return {
          success: false,
          error: 'Conta Cora não encontrada'
        };
      }

      console.log('💳 [HOOK] Conta Cora encontrada. Saldo:', contaCora.saldo_atual);

      if (contaCora.saldo_atual < valorTotal) {
        console.log('❌ [HOOK] Saldo insuficiente na conta Cora');
        return {
          success: false,
          error: `Saldo insuficiente na conta Cora. Necessário: R$ ${valorTotal.toFixed(2)}, Disponível: R$ ${contaCora.saldo_atual.toFixed(2)}`
        };
      }

      // 4. Obter o usuário atual
      console.log('👤 [HOOK] Obtendo usuário atual...');
      
      // Usar o AuthContext customizado em vez do supabase.auth.getUser()
      if (!user) {
        console.error('❌ [HOOK] Usuário não autenticado no AuthContext');
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      console.log('✅ [HOOK] Usuário autenticado:', {
        id: user.id,
        login: user.login
      });

      // 5. Processar pagamentos individuais para cada compra
      const pagamentosRealizados = [];
      console.log('🔄 [HOOK] Iniciando processamento de', comprasEmAberto.length, 'compras...');
      
      for (const compra of comprasEmAberto) {
        console.log('💳 [HOOK] Processando pagamento para compra:', compra.id, 'Valor:', compra.saldo_aberto);

        // Usar a função SQL existente para processar pagamento total
        console.log('🔧 [HOOK] Chamando process_pagamento_total para compra:', compra.id);
        const { data: resultado, error: pagamentoError } = await supabase
          .rpc('process_pagamento_total', {
            p_compra_id: compra.id,
            p_user_id: user.id,
            p_foi_pago: true
          });

        console.log('📊 [HOOK] Resultado da função SQL:', { resultado, pagamentoError });

        if (pagamentoError) {
          console.error('❌ [HOOK] Erro ao processar pagamento da compra:', compra.id, pagamentoError);
          throw new Error(`Erro ao processar pagamento da compra ${compra.descricao}: ${pagamentoError.message}`);
        }

        if (!resultado?.success) {
          console.error('❌ [HOOK] Falha no pagamento da compra:', compra.id, resultado?.error);
          throw new Error(`Falha no pagamento da compra ${compra.descricao}: ${resultado?.error}`);
        }

        console.log('✅ [HOOK] Pagamento processado com sucesso para compra:', compra.id);

        pagamentosRealizados.push({
          compra_id: compra.id,
          descricao: compra.descricao,
          valor_pago: compra.saldo_aberto,
          pagamento_id: resultado.pagamento_id
        });
      }

      console.log('🎉 [HOOK] Todos os pagamentos processados com sucesso:', pagamentosRealizados.length);

      return {
        success: true,
        pagamentos: pagamentosRealizados
      };

    } catch (error: any) {
      console.error('❌ [HOOK] Erro no pagamento total do fornecedor:', error);
      return {
        success: false,
        error: error.message || 'Erro interno no processamento do pagamento'
      };
    } finally {
      console.log('🔄 [HOOK] Definindo loading como false');
      setLoading(false);
    }
  };

  return {
    loading,
    buscarComprasEmAberto,
    pagarTodasCompras
  };
}