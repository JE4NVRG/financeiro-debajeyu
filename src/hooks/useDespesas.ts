import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  DespesaComDetalhes, 
  CategoriasDespesas,
  NovaDespesaForm, 
  UseDespesasReturn,
  FiltrosDespesa 
} from '../types/database';
import { toast } from 'sonner';
import { parseBRLToNumber } from '../lib/utils';

export function useDespesas(filtros?: FiltrosDespesa): UseDespesasReturn {
  const { user } = useAuth();
  const [despesas, setDespesas] = useState<DespesaComDetalhes[]>([]);
  const [categorias, setCategorias] = useState<CategoriasDespesas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);



  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_despesas')
        .select('*')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  };

  const fetchDespesas = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando despesas com filtros:', filtros);

      let query = supabase
        .from('saidas')
        .select(`
          id,
          tipo,
          subtipo,
          descricao,
          valor,
          categoria_id,
          conta_id,
          status,
          data_vencimento,
          data_pagamento,
          observacoes,
          recorrencia_config,
          despesa_origem_id,
          usuario_id,
          created_at,
          updated_at,
          categorias_despesas (
            nome,
            cor,
            icone
          ),
          contas (
            nome
          ),
          usuarios (
            login
          ),
          despesa_origem:saidas!despesa_origem_id (
            descricao
          )
        `)
        .eq('tipo', 'despesa')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros) {
        const { 
          status, 
          subtipo, 
          categoria_id, 
          conta_id, 
          data_inicio, 
          data_fim, 
          valor_min, 
          valor_max, 
          busca 
        } = filtros;

        if (status) {
          query = query.eq('status', status);
        }

        if (subtipo) {
          query = query.eq('subtipo', subtipo);
        }

        if (categoria_id) {
          query = query.eq('categoria_id', categoria_id);
        }

        if (conta_id) {
          query = query.eq('conta_id', conta_id);
        }

        if (data_inicio) {
          query = query.gte('data_vencimento', data_inicio);
        }

        if (data_fim) {
          query = query.lte('data_vencimento', data_fim);
        }

        if (valor_min) {
          query = query.gte('valor', parseBRLToNumber(valor_min));
        }

        if (valor_max) {
          query = query.lte('valor', parseBRLToNumber(valor_max));
        }

        if (busca) {
          query = query.or(`descricao.ilike.%${busca}%,observacoes.ilike.%${busca}%`);
        }
      }

      const { data, error } = await query;

      console.log('📋 Resposta da query de despesas:', { data, error });
      console.log('📋 Despesas encontradas:', data?.length || 0);

      if (error) throw error;

      // Transformar dados para o formato esperado
      const despesasFormatadas = (data || []).map(item => ({
        id: item.id,
        tipo: item.tipo,
        subtipo: item.subtipo,
        descricao: item.descricao,
        valor: item.valor,
        categoria_id: item.categoria_id,
        conta_id: item.conta_id,
        status: item.status,
        data_vencimento: item.data_vencimento,
        data_pagamento: item.data_pagamento,
        observacoes: item.observacoes,
        recorrencia_config: item.recorrencia_config,
        despesa_origem_id: item.despesa_origem_id,
        usuario_id: item.usuario_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        categoria: {
          nome: (item.categorias_despesas as any)?.nome || 'N/A',
          cor: (item.categorias_despesas as any)?.cor || '#6B7280',
          icone: (item.categorias_despesas as any)?.icone || 'receipt'
        },
        conta: {
          nome: (item.contas as any)?.nome || 'N/A'
        },
        usuario: {
          login: (item.usuarios as any)?.login || 'N/A'
        },
        despesa_origem: item.despesa_origem?.[0] ? {
          descricao: item.despesa_origem[0].descricao
        } : undefined
      }));

      setDespesas(despesasFormatadas);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar despesas:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDespesa = async (despesa: NovaDespesaForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      console.log('🔄 Criando despesa:', despesa);

      const despesaData = {
        tipo: 'despesa',
        subtipo: despesa.subtipo,
        descricao: despesa.descricao.trim(),
        valor: parseBRLToNumber(despesa.valor),
        categoria_id: despesa.categoria_id,
        conta_id: despesa.conta_id,
        status: despesa.status || 'pendente',
        data_vencimento: despesa.data_vencimento,
        data_pagamento: despesa.data_pagamento || null,
        observacoes: despesa.observacoes?.trim() || null,
        recorrencia_config: despesa.recorrencia_config || null,
        usuario_id: user.id
      };

      console.log('📝 Dados que serão inseridos:', despesaData);

      const { data, error } = await supabase
        .from('saidas')
        .insert(despesaData);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Despesa criada com sucesso!', data);
      toast.success('Despesa registrada com sucesso!');
      await fetchDespesas();
    } catch (err) {
      console.error('❌ Erro ao criar despesa:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar despesa';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateDespesa = async (id: string, despesa: Partial<NovaDespesaForm>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (despesa.descricao) updateData.descricao = despesa.descricao.trim();
      if (despesa.valor) updateData.valor = parseBRLToNumber(despesa.valor);
      if (despesa.categoria_id) updateData.categoria_id = despesa.categoria_id;
      if (despesa.conta_id) updateData.conta_id = despesa.conta_id;
      if (despesa.subtipo) updateData.subtipo = despesa.subtipo;
      if (despesa.data_vencimento) updateData.data_vencimento = despesa.data_vencimento;
      if (despesa.observacoes !== undefined) {
        updateData.observacoes = despesa.observacoes?.trim() || null;
      }
      if (despesa.recorrencia_config !== undefined) {
        updateData.recorrencia_config = despesa.recorrencia_config;
      }

      const { error } = await supabase
        .from('saidas')
        .update(updateData)
        .eq('id', id)
        .eq('usuario_id', user.id)
        .eq('tipo', 'despesa');

      if (error) throw error;

      toast.success('Despesa atualizada com sucesso!');
      await fetchDespesas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar despesa';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteDespesa = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('saidas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id)
        .eq('tipo', 'despesa');

      if (error) throw error;

      toast.success('Despesa excluída com sucesso!');
      await fetchDespesas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir despesa';
      toast.error(errorMessage);
      throw err;
    }
  };

  const marcarComoPago = async (id: string, data_pagamento: string, conta_id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('saidas')
        .update({
          status: 'pago',
          data_pagamento,
          conta_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('usuario_id', user.id)
        .eq('tipo', 'despesa');

      if (error) throw error;

      toast.success('Despesa marcada como paga!');
      await fetchDespesas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao marcar despesa como paga';
      toast.error(errorMessage);
      throw err;
    }
  };

  const gerarProximaRecorrencia = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Buscar a despesa original
      const { data: despesaOriginal, error: fetchError } = await supabase
        .from('saidas')
        .select('*')
        .eq('id', id)
        .eq('tipo', 'despesa')
        .single();

      if (fetchError) throw fetchError;

      if (!despesaOriginal.recorrencia_config) {
        throw new Error('Despesa não é recorrente');
      }

      // Calcular próxima data usando a função do banco
      const { data: proximaData, error: calcError } = await supabase
        .rpc('calcular_proxima_data_recorrencia', {
          data_base: despesaOriginal.data_vencimento,
          tipo_recorrencia: despesaOriginal.recorrencia_config.tipo
        });

      if (calcError) throw calcError;

      // Criar nova despesa
      const novaDespesa = {
        tipo: 'despesa',
        subtipo: despesaOriginal.subtipo,
        descricao: despesaOriginal.descricao,
        valor: despesaOriginal.valor,
        categoria_id: despesaOriginal.categoria_id,
        conta_id: despesaOriginal.conta_id,
        status: 'pendente',
        data_vencimento: proximaData,
        observacoes: despesaOriginal.observacoes,
        recorrencia_config: despesaOriginal.recorrencia_config,
        despesa_origem_id: id,
        usuario_id: user.id
      };

      const { error: insertError } = await supabase
        .from('saidas')
        .insert(novaDespesa);

      if (insertError) throw insertError;

      toast.success('Próxima recorrência gerada com sucesso!');
      await fetchDespesas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar próxima recorrência';
      toast.error(errorMessage);
      throw err;
    }
  };

  const refetch = () => {
    if (user) {
      fetchDespesas();
      fetchCategorias();
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategorias();
      fetchDespesas();
    }
  }, [user, filtros]);

  return {
    despesas,
    categorias,
    loading,
    error,
    refetch,
    createDespesa,
    updateDespesa,
    deleteDespesa,
    marcarComoPago,
    gerarProximaRecorrencia
  };
}