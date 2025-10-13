import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CreateUserForm, UserManagementView } from '../types/database';

export function useUserManagement() {
  const [users, setUsers] = useState<UserManagementView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar usuários por sócio
  const getUsersBySocio = useCallback(async (socioId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_management_view')
        .select('*')
        .eq('socio_id', socioId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar novo usuário
  const createUser = useCallback(async (userData: CreateUserForm) => {
    try {
      setLoading(true);
      setError(null);

      // Criar email temporário baseado no username
      const tempEmail = `${userData.username}@temp.local`;

      // Chamar a função do banco para criar usuário
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        p_socio_id: userData.socio_id,
        p_username: userData.username,
        p_password: userData.password,
        p_full_name: userData.full_name,
        p_role: userData.role
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Desativar usuário
  const deactivateUser = useCallback(async (profileId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', profileId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao desativar usuário:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Ativar usuário
  const activateUser = useCallback(async (profileId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: true })
        .eq('id', profileId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao ativar usuário:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar permissões do usuário
  const updateUserPermissions = useCallback(async (profileId: string, permissions: string[]) => {
    try {
      setLoading(true);
      setError(null);

      // Primeiro, remover todas as permissões existentes
      await supabase
        .from('user_permissions')
        .delete()
        .eq('profile_id', profileId);

      // Depois, inserir as novas permissões
      if (permissions.length > 0) {
        const permissionsData = permissions.map(permission => ({
          profile_id: profileId,
          permission_name: permission,
          granted_by: 'system' // ou o ID do usuário atual
        }));

        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionsData);

        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Erro ao atualizar permissões:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar perfil do usuário atual
  const getCurrentUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obter usuário autenticado do localStorage (sistema customizado)
      const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
      
      if (!authUser) {
        console.log('⚠️ Usuário não autenticado no localStorage');
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 Buscando perfil para usuário:', authUser.id);

      // Buscar perfil usando user_id da tabela usuarios
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          socios:socio_id (
            id,
            nome
          ),
          usuarios:user_id (
            login
          )
        `)
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        
        // Se não encontrou perfil, tentar criar um perfil padrão
        if (error.code === 'PGRST116') {
          console.log('📝 Perfil não encontrado, criando perfil padrão...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authUser.id,
              full_name: authUser.login || 'Usuário',
              role: 'socio',
              is_active: true
            })
            .select(`
              *,
              socios:socio_id (
                id,
                nome
              ),
              usuarios:user_id (
                login
              )
            `)
            .single();

          if (createError) {
            console.error('Erro ao criar perfil padrão:', createError);
            throw new Error('Não foi possível criar perfil do usuário');
          }

          console.log('✅ Perfil padrão criado:', newProfile);
          return newProfile;
        }
        
        throw new Error('Perfil não encontrado');
      }

      if (!data) {
        throw new Error('Perfil não encontrado');
      }

      // Retornar perfil com dados do sócio
      return {
        ...data,
        username: data.usuarios?.login,
        socio_nome: data.socios?.nome
      };

    } catch (err: any) {
      console.error('Erro ao buscar perfil do usuário:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar perfil do usuário
  const updateUserProfile = useCallback(async (profileId: string, updates: Partial<{
    full_name: string;
    phone: string;
    avatar_url: string;
  }>) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alterar senha do usuário
  const changePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se há uma sessão ativa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError);
        throw new Error('Erro ao verificar sessão de autenticação');
      }

      if (!session) {
        console.error('Nenhuma sessão ativa encontrada');
        throw new Error('Sessão de autenticação não encontrada. Faça login novamente.');
      }

      console.log('🔐 Alterando senha para usuário:', session.user.id);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Erro do Supabase ao alterar senha:', error);
        throw error;
      }

      console.log('✅ Senha alterada com sucesso');
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para recarregar dados
  const refetch = useCallback(() => {
    // Esta função pode ser usada para recarregar os dados quando necessário
    // Por exemplo, após uma operação de criação ou atualização
  }, []);

  return {
    users,
    loading,
    error,
    getUsersBySocio,
    createUser,
    deactivateUser,
    activateUser,
    updateUserPermissions,
    getCurrentUserProfile,
    updateUserProfile,
    changePassword,
    refetch
  };
}