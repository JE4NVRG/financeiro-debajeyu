import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Entrada, 
  NovaEntradaForm, 
  UseEntradasOptions, 
  UseEntradasReturn,
  FiltrosEntrada 
} from '../types/database';
import { toast } from 'sonner';

export function useEntradas(options: UseEntradasOptions = {}): UseEntradasReturn {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchEntradas = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando entradas com opções:', options);

      let query = supabase
        .from('entradas')
        .select(`
          *,
          conta:contas(nome),
          marketplace:marketplaces(nome),
          usuario:usuarios(login)
        `)
        .order('data', { ascending: false });

      // Aplicar filtros
      if (options.conta_id) {
        console.log('📊 Filtrando por conta_id:', options.conta_id);
        query = query.eq('conta_id', options.conta_id);
      }

      if (options.marketplace_id) {
        query = query.eq('marketplace_id', options.marketplace_id);
      }

      if (options.filtros) {
        const { dataInicio, dataFim, marketplace_id, busca } = options.filtros;

        if (dataInicio) {
          query = query.gte('data', dataInicio);
        }

        if (dataFim) {
          query = query.lte('data', dataFim);
        }

        if (marketplace_id) {
          query = query.eq('marketplace_id', marketplace_id);
        }

        if (busca) {
          query = query.ilike('observacao', `%${busca}%`);
        }
      }

      const { data, error } = await query;

      console.log('📋 Resposta da query de entradas:', { data, error });
      console.log('📋 Entradas encontradas:', data?.length || 0);

      if (error) throw error;

      setEntradas(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar entradas:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEntrada = async (entrada: NovaEntradaForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      console.log('🔄 Criando entrada:', entrada);
      console.log('👤 Usuário atual:', user);
      console.log('🔑 user.id que será usado:', user.id);
      
      // Converter valor para número - o valor já vem como número do CurrencyInput
      const valorNumerico = typeof entrada.valor === 'number' 
        ? entrada.valor 
        : parseFloat(entrada.valor.toString());
      
      console.log('💰 Conversão de valor:', {
        original: entrada.valor,
        tipo: typeof entrada.valor,
        numerico: valorNumerico
      });

      if (valorNumerico <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      const entradaData = {
        data: entrada.data,
        conta_id: entrada.conta_id,
        marketplace_id: entrada.marketplace_id,
        valor: valorNumerico,
        comissao_paga: entrada.comissao_paga,
        observacao: entrada.observacao || null,
        usuario_id: user.id
      };

      console.log('📝 Dados que serão inseridos:', entradaData);

      const { data, error } = await supabase
        .from('entradas')
        .insert(entradaData);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Detalhes do erro:', error.details);
        console.error('❌ Hint do erro:', error.hint);
        throw error;
      }

      console.log('✅ Entrada criada com sucesso!', data);
      toast.success('Entrada criada com sucesso!');
      await fetchEntradas();
    } catch (err) {
      console.error('❌ Erro ao criar entrada:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar entrada';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateEntrada = async (id: string, entrada: Partial<NovaEntradaForm>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (entrada.data) updateData.data = entrada.data;
      if (entrada.marketplace_id) updateData.marketplace_id = entrada.marketplace_id;
      if (entrada.valor) {
        // Converter valor para número - o valor já vem como número do CurrencyInput
        updateData.valor = typeof entrada.valor === 'number' 
          ? entrada.valor 
          : parseFloat(entrada.valor.toString());
      }
      if (entrada.comissao_paga !== undefined) updateData.comissao_paga = entrada.comissao_paga;
      if (entrada.observacao !== undefined) updateData.observacao = entrada.observacao || null;

      const { error } = await supabase
        .from('entradas')
        .update(updateData)
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast.success('Entrada atualizada com sucesso!');
      await fetchEntradas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar entrada';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteEntrada = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('entradas')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast.success('Entrada excluída com sucesso!');
      await fetchEntradas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir entrada';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntradas();
    }
  }, [user, options.conta_id, options.marketplace_id, JSON.stringify(options.filtros)]);

  return {
    entradas,
    loading,
    error,
    refetch: fetchEntradas,
    createEntrada,
    updateEntrada,
    deleteEntrada
  };
}