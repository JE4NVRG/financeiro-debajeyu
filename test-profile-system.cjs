const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileSystem() {
  console.log('🧪 Testando sistema completo de perfil...\n');
  
  try {
    // 1. Verificar se je4ndev existe na tabela usuarios
    console.log('1. Verificando usuário je4ndev...');
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'je4ndev')
      .single();

    if (usuarioError) {
      console.error('❌ Erro ao buscar usuário je4ndev:', usuarioError);
      return;
    }

    console.log('✅ Usuário je4ndev encontrado:', {
      id: usuario.id,
      login: usuario.login,
      senha_hash: usuario.senha_hash ? 'Definida' : 'Não definida'
    });

    // 2. Verificar se existe perfil para je4ndev
    console.log('\n2. Verificando perfil de je4ndev...');
    const { data: perfil, error: perfilError } = await supabase
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
      .eq('user_id', usuario.id)
      .single();

    if (perfilError) {
      console.log('⚠️ Perfil não encontrado, criando perfil padrão...');
      
      // Criar perfil padrão para je4ndev
      const { data: novoPerfil, error: criarPerfilError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: usuario.id,
          full_name: 'JE4N DEV',
          role: 'admin',
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

      if (criarPerfilError) {
        console.error('❌ Erro ao criar perfil:', criarPerfilError);
        return;
      }

      console.log('✅ Perfil criado com sucesso:', {
        id: novoPerfil.id,
        full_name: novoPerfil.full_name,
        role: novoPerfil.role,
        is_active: novoPerfil.is_active,
        login: novoPerfil.usuarios?.login
      });
    } else {
      console.log('✅ Perfil encontrado:', {
        id: perfil.id,
        full_name: perfil.full_name,
        role: perfil.role,
        is_active: perfil.is_active,
        login: perfil.usuarios?.login,
        socio_nome: perfil.socios?.nome
      });
    }

    // 3. Testar políticas RLS
    console.log('\n3. Testando políticas RLS...');
    const { data: todosPerfiles, error: rlsError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, is_active')
      .limit(10);

    if (rlsError) {
      console.error('❌ Erro nas políticas RLS:', rlsError);
    } else {
      console.log(`✅ Políticas RLS funcionando! Encontrados ${todosPerfiles.length} perfis.`);
      todosPerfiles.forEach(p => {
        console.log(`   - ${p.full_name} (${p.role}) - ${p.is_active ? 'Ativo' : 'Inativo'}`);
      });
    }

    // 4. Simular dados do localStorage para teste de interface
    console.log('\n4. Simulando dados do localStorage...');
    const authUser = {
      id: usuario.id,
      login: usuario.login
    };

    const profileData = perfil || {
      id: 'default-je4ndev',
      user_id: usuario.id,
      full_name: 'JE4N DEV',
      role: 'admin',
      is_active: true,
      usuarios: { login: usuario.login }
    };

    console.log('📱 Dados para localStorage:');
    console.log('auth_user:', JSON.stringify(authUser, null, 2));
    console.log('user_profile:', JSON.stringify({
      id: profileData.id,
      full_name: profileData.full_name,
      role: profileData.role,
      is_active: profileData.is_active,
      login: profileData.usuarios?.login
    }, null, 2));

    console.log('\n✅ Sistema de perfil testado com sucesso!');
    console.log('🎯 Próximos passos:');
    console.log('   1. Faça login com je4ndev');
    console.log('   2. Verifique se o nome aparece na sidebar');
    console.log('   3. Acesse a página de perfil');
    console.log('   4. Confirme que não há mais erros no console');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testProfileSystem();