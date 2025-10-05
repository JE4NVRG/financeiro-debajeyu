import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  FornecedorComTotais, 
  NovoFornecedorForm, 
  UseFornecedoresReturn,
  FiltrosFornecedor 
} from '../types/database';
import { toast } from 'sonner';
import { 
  fornecedorSchema, 
  updateFornecedorSchema, 
  validateFornecedorDeletion 
} from '../schemas/fornecedores';

export function useFornecedores(filtros?: FiltrosFornecedor): UseFornecedoresReturn {
  const [fornecedores, setFornecedores] = useState<FornecedorComTotais[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchFornecedores = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando fornecedores com filtros:', filtros);

      let query = supabase
        .from('view_fornecedores_totais')
        .select('*')
        .order('nome', { ascending: true });

      // Aplicar filtros
      if (filtros) {
        const { tipo, status, busca } = filtros;

        if (tipo) {
          query = query.eq('tipo', tipo);
        }

        if (status) {
          query = query.eq('status', status);
        }

        if (busca) {
          query = query.ilike('nome', `%${busca}%`);
        }
      }

      const { data, error } = await query;

      console.log('📋 Resposta da query de fornecedores:', { data, error });
      console.log('📋 Fornecedores encontrados:', data?.length || 0);

      if (error) throw error;

      setFornecedores(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFornecedor = async (fornecedor: NovoFornecedorForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Validar dados com Zod
      const validatedData = fornecedorSchema.parse(fornecedor);
      
      console.log('🔄 Criando fornecedor:', validatedData);
      console.log('👤 Usuário atual:', user);
      console.log('🔑 User ID:', user.id);
      console.log('📧 User email:', user.email);
      console.log('🔐 User auth status:', !!user);

      // Verificar se o usuário está autenticado no Supabase
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Auth data do Supabase:', authData);
      console.log('❌ Auth error do Supabase:', authError);

      // DEBUG: Verificar se o usuário existe na tabela auth.users
      console.log('🔍 Verificando se usuário existe em auth.users...');
      const { data: debugUsers, error: debugError } = await supabase
        .from('auth_users_debug')
        .select('*');
      
      console.log('👥 Usuários em auth.users:', debugUsers);
      console.log('❌ Erro ao buscar usuários:', debugError);

      // Verificar especificamente se o usuário atual existe
      const { data: currentUserCheck, error: currentUserError } = await supabase
        .from('auth_users_debug')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('🔍 Usuário atual existe em auth.users?', currentUserCheck);
      console.log('❌ Erro ao verificar usuário atual:', currentUserError);

      const fornecedorData = {
        nome: validatedData.nome,
        tipo: validatedData.tipo || 'Fornecedor',
        status: 'Ativo',
        observacao: validatedData.observacao || null,
        usuario_id: user.id
      };

      console.log('📝 Dados que serão inseridos:', fornecedorData);

      const { data, error } = await supabase
        .from('fornecedores')
        .insert(fornecedorData);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Mensagem do erro:', error.message);
        console.error('❌ Detalhes do erro:', error.details);
        console.error('❌ Hint do erro:', error.hint);
        
        if (error.code === '23505') {
          throw new Error('Já existe um fornecedor com este nome');
        }
        throw error;
      }

      console.log('✅ Fornecedor criado com sucesso!', data);
      toast.success('Fornecedor criado com sucesso!');
      await fetchFornecedores();
    } catch (err) {
      console.error('❌ Erro ao criar fornecedor:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar fornecedor';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateFornecedor = async (id: string, fornecedor: Partial<NovoFornecedorForm>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Validar dados com Zod
      const validatedData = updateFornecedorSchema.parse(fornecedor);
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (validatedData.nome) updateData.nome = validatedData.nome;
      if (validatedData.tipo) updateData.tipo = validatedData.tipo;
      if (validatedData.status) updateData.status = validatedData.status;
      if (validatedData.observacao !== undefined) {
        updateData.observacao = validatedData.observacao || null;
      }

      const { error } = await supabase
        .from('fornecedores')
        .update(updateData)
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um fornecedor com este nome');
        }
        throw error;
      }

      toast.success('Fornecedor atualizado com sucesso!');
      await fetchFornecedores();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar fornecedor';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteFornecedor = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Verificar se o fornecedor tem compras
      const { data: compras, error: comprasError } = await supabase
        .from('compras')
        .select('id')
        .eq('fornecedor_id', id)
        .limit(1);

      if (comprasError) throw comprasError;

      // Validar exclusão com regra de negócio
      validateFornecedorDeletion(compras?.length || 0);

      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      toast.success('Fornecedor excluído com sucesso!');
      await fetchFornecedores();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir fornecedor';
      toast.error(errorMessage);
      throw err;
    }
  };

  const refetch = () => {
    if (user) {
      fetchFornecedores();
    }
  };

  useEffect(() => {
    if (user) {
      fetchFornecedores();
    }
  }, [user, filtros]);

  return {
    fornecedores,
    loading,
    error,
    refetch,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor
  };
}