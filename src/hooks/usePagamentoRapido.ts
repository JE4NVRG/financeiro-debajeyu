import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface PagamentoRapidoResult {
  success: boolean;
  pagamento_id?: string;
  valor_pago?: number;
  novo_saldo_conta?: number;
  fornecedor_id?: string;
  error?: string;
}

interface ValidacaoSaldo {
  success: boolean;
  conta_id?: string;
  conta_nome?: string;
  saldo_disponivel?: number;
  valor_solicitado?: number;
  pode_processar?: boolean;
  diferenca?: number;
  error?: string;
}

interface Conta {
  id: string;
  nome: string;
  saldo_atual: number;
  is_cora_account: boolean;
}

export const usePagamentoRapido = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validandoSaldo, setValidandoSaldo] = useState(false);
  
  // Refs para controlar requests em andamento
  const abortControllerRef = useRef<AbortController | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cache para evitar requests desnecessários - REDUZIDO TEMPO DE CACHE
  const cacheRef = useRef<{
    contaCora: any;
    validacao: Map<number, ValidacaoSaldo>;
    lastFetch: number;
  }>({
    contaCora: null,
    validacao: new Map(),
    lastFetch: 0
  });

  // Cache específico para conta Cora
  const contaCoraCache = useRef<{
    conta: Conta | null;
    timestamp: number;
  }>({
    conta: null,
    timestamp: 0
  });

  const reverterPagamento = async (compraId: string): Promise<PagamentoRapidoResult> => {
    setLoading(true);
    try {
      console.log('🔄 Revertendo pagamento para compra:', compraId);

      const { data, error } = await supabase.rpc('reverse_payment_fornecedor', {
        p_compra_id: compraId
      });

      if (error) {
        console.error('❌ Erro ao reverter pagamento:', error);
        toast.error(error.message || 'Erro ao reverter pagamento');
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ Falha na reversão:', data.error);
        toast.error(data.error || 'Falha ao reverter pagamento');
        return { success: false, error: data.error };
      }

      console.log('✅ Pagamento revertido com sucesso:', data);
      toast.success(`Pagamento revertido! Total: R$ ${data.total_revertido}`);

      return {
        success: true,
        valor_pago: data.total_revertido
      };

    } catch (error: any) {
      console.error('❌ Erro inesperado ao reverter pagamento:', error);
      toast.error('Erro inesperado ao reverter pagamento');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar requests em andamento
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
  }, []);

  // Debounced validation function
  const validarSaldoCora = useCallback(async (valorSolicitado: number): Promise<ValidacaoSaldo> => {
    // Cancelar validação anterior se existir
    cleanup();
    
    // Verificar cache primeiro (válido por 30 segundos)
    const now = Date.now();
    const cacheKey = valorSolicitado;
    const cachedValidation = cacheRef.current.validacao.get(cacheKey);
    
    if (cachedValidation && (now - cacheRef.current.lastFetch) < 30000) {
      console.log('📋 Usando validação em cache para valor:', valorSolicitado);
      return cachedValidation;
    }

    return new Promise((resolve) => {
      // Debounce de 300ms para evitar múltiplas chamadas
      validationTimeoutRef.current = setTimeout(async () => {
        setValidandoSaldo(true);
        
        try {
          console.log('🔍 Validando saldo Cora para valor:', valorSolicitado);
          
          // Criar novo AbortController para esta request
          abortControllerRef.current = new AbortController();
          const signal = abortControllerRef.current.signal;
          
          // Buscar conta Cora com cache
          let contaCora = cacheRef.current.contaCora;
          
          if (!contaCora || (now - cacheRef.current.lastFetch) > 10000) { // Reduzido para 10 segundos
            console.log('🔄 Buscando conta Cora...');
            
            const { data, error } = await supabase
              .from('contas')
              .select('*')
              .eq('is_cora_account', true)
              .abortSignal(signal)
              .single();
            
            if (signal.aborted) {
              console.log('⚠️ Request cancelada');
              return;
            }
            
            if (error) {
              console.error('❌ Erro ao buscar conta Cora:', error);
              const result = {
                success: false,
                error: `Erro ao buscar conta Cora: ${error.message}`
              };
              resolve(result);
              return;
            }
            
            contaCora = data;
            cacheRef.current.contaCora = contaCora;
            cacheRef.current.lastFetch = now;
          }

          if (!contaCora) {
            const result = {
              success: false,
              error: 'Conta Cora não encontrada no sistema'
            };
            resolve(result);
            return;
          }

          console.log('✅ Conta Cora encontrada:', contaCora);

          // Usar função SQL para validação com timeout
          try {
            const validationPromise = supabase.rpc('validate_account_balance', {
              p_conta_id: contaCora.id,
              p_valor_solicitado: valorSolicitado
            });

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout na validação de saldo')), 5000)
            );

            const { data, error } = await Promise.race([validationPromise, timeoutPromise]) as any;
            
            if (signal.aborted) {
              console.log('⚠️ Validação cancelada');
              return;
            }
            
            if (error) {
              console.error('❌ Erro na validação de saldo:', error);
              const result = {
                success: false,
                error: `Erro na validação: ${error.message}`
              };
              resolve(result);
              return;
            }

            if (!data) {
              const result = {
                success: false,
                error: 'Resposta inválida da validação de saldo'
              };
              resolve(result);
              return;
            }

            console.log('✅ Validação concluída:', data);
            
            const result = {
              success: data.success || false,
              conta_id: contaCora.id,
              conta_nome: contaCora.nome,
              saldo_disponivel: data.saldo_disponivel || contaCora.saldo_atual,
              valor_solicitado: valorSolicitado,
              pode_processar: data.pode_processar || false,
              diferenca: data.diferenca || 0,
              error: data.error || null
            };
            
            // Armazenar no cache
            cacheRef.current.validacao.set(cacheKey, result);
            
            resolve(result);
            
          } catch (validationError: any) {
            console.error('❌ Erro inesperado na validação:', validationError);
            const result = {
              success: false,
              error: validationError.message || 'Erro inesperado na validação'
            };
            resolve(result);
          }
          
        } catch (error: any) {
          console.error('❌ Erro inesperado:', error);
          const result = {
            success: false,
            error: error.message || 'Erro inesperado'
          };
          resolve(result);
        } finally {
          setValidandoSaldo(false);
        }
      }, 300);
    });
  }, [cleanup]);

  const pagarTotal = async (compraId: string, foiPago: boolean = true): Promise<PagamentoRapidoResult> => {
    setLoading(true);
    try {
      console.log('🚀 Iniciando pagamento total:', { 
        compraId, 
        foiPago, 
        compraIdType: typeof compraId,
        compraIdLength: compraId?.length,
        userId: user?.id,
        userIdType: typeof user?.id
      });

      // Validar se compraId é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(compraId)) {
        console.error('❌ ID da compra não é um UUID válido:', compraId);
        toast.error("ID da compra inválido");
        return {
          success: false,
          error: 'ID da compra inválido'
        };
      }

      // Usar função SQL para processar pagamento total
      const { data, error } = await supabase.rpc('process_pagamento_total', {
        p_compra_id: compraId,
        p_user_id: user?.id, // Adicionar user_id do contexto de autenticação
        p_foi_pago: foiPago
      });

      if (error) {
        console.error('❌ Erro no pagamento total:', error);
        toast.error(error.message || "Erro ao processar pagamento total");
        return {
          success: false,
          error: error.message
        };
      }

      const result = data as PagamentoRapidoResult;

      if (!result.success) {
        console.error('❌ Pagamento rejeitado:', result.error);
        toast.error(result.error || "Não foi possível processar o pagamento");
        return result;
      }

      console.log('✅ Pagamento total processado com sucesso:', result);
      toast.success(`Pagamento de R$ ${result.valor_pago?.toFixed(2)} processado com sucesso!`);

      return result;
    } catch (error) {
      console.error('💥 Erro crítico no pagamento:', error);
      toast.error("Erro interno no sistema de pagamentos");
      return {
        success: false,
        error: 'Erro interno no sistema'
      };
    } finally {
      setLoading(false);
    }
  };

  // Função otimizada para buscar conta Cora com cache e saldo correto
  const buscarContaCora = useCallback(async (): Promise<Conta | null> => {
    console.log('🔍 [HOOK-BUSCAR] Iniciando buscarContaCora...');
    
    // Verificar cache primeiro
    if (contaCoraCache.current && contaCoraCache.current.timestamp) {
      const agora = Date.now();
      const tempoDecorrido = agora - contaCoraCache.current.timestamp;
      const cacheValido = tempoDecorrido < 5000; // 5 segundos (muito reduzido para garantir dados atualizados)
      
      console.log('🔍 [HOOK-BUSCAR] Verificando cache:', {
        temCache: !!contaCoraCache.current.conta,
        tempoDecorrido: `${Math.round(tempoDecorrido / 1000)}s`,
        cacheValido,
        contaCache: contaCoraCache.current.conta ? {
          id: contaCoraCache.current.conta.id,
          nome: contaCoraCache.current.conta.nome,
          saldo: contaCoraCache.current.conta.saldo_atual,
          isCora: contaCoraCache.current.conta.is_cora_account
        } : null
      });
      
      if (cacheValido && contaCoraCache.current.conta) {
        console.log('✅ [HOOK-BUSCAR] Retornando conta do cache');
        return contaCoraCache.current.conta;
      } else {
        console.log('⏰ [HOOK-BUSCAR] Cache expirado, buscando nova conta');
      }
    } else {
      console.log('🆕 [HOOK-BUSCAR] Nenhum cache encontrado, primeira busca');
    }

    try {
      console.log('🌐 [HOOK-BUSCAR] Usando get_conta_cora_info() para consistência com Dashboard...');
      
      // Usar a MESMA função que o Dashboard usa para garantir consistência
      const { data: coraInfo, error: coraError } = await supabase
        .rpc('get_conta_cora_info');

      if (coraError) {
        console.error('❌ [HOOK-BUSCAR] Erro ao buscar conta via get_conta_cora_info:', coraError);
        toast.error('Erro ao carregar informações da conta Cora');
        return null;
      }

      if (!coraInfo?.success) {
        console.error('❌ [HOOK-BUSCAR] Conta Cora não encontrada:', coraInfo?.error);
        toast.error('Conta Cora não encontrada');
        return null;
      }

      console.log('🌐 [HOOK-BUSCAR] Resposta da função get_conta_cora_info:', {
        temDados: !!coraInfo,
        success: coraInfo?.success,
        contaId: coraInfo?.conta_id,
        contaNome: coraInfo?.conta_nome,
        saldoAtual: coraInfo?.saldo_atual
      });

      const conta: Conta = {
        id: coraInfo.conta_id,
        nome: coraInfo.conta_nome,
        saldo_atual: coraInfo.saldo_atual, // Usar saldo_atual para consistência com Dashboard
        is_cora_account: true
      };

      // Atualizar cache
      contaCoraCache.current = {
        conta,
        timestamp: Date.now()
      };

      console.log('✅ [HOOK-BUSCAR] Conta Cora encontrada e cache atualizado:', {
        id: conta.id,
        nome: conta.nome,
        saldoAtual: conta.saldo_atual,
        isCora: conta.is_cora_account,
        timestampCache: contaCoraCache.current.timestamp
      });

      return conta;
    } catch (error) {
      console.error('💥 [HOOK-BUSCAR] Erro inesperado ao buscar conta Cora:', error);
      toast.error('Erro inesperado ao carregar conta Cora');
      return null;
    }
  }, []);

  return {
    pagarTotal,
    reverterPagamento,
    validarSaldoCora,
    buscarContaCora,
    loading,
    validandoSaldo,
    cleanup // Expor função de cleanup para o componente
  };
};