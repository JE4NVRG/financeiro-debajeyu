const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewUserCreation() {
  console.log('🧪 Testando criação de novo usuário...\n');

  try {
    // 1. Buscar sócio Yuri para vincular
    console.log('1. Buscando sócio Yuri...');
    const { data: yuri, error: yuriError } = await supabase
      .from('socios')
      .select('*')
      .eq('nome', 'Yuri')
      .single();

    if (yuriError || !yuri) {
      console.log('❌ Sócio Yuri não encontrado:', yuriError?.message);
      return;
    }

    console.log(`✅ Sócio Yuri encontrado: ${yuri.id}`);

    // 2. Verificar se usuário teste_yuri já existe
    console.log('\n2. Verificando se usuário teste_yuri já existe...');
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'teste_yuri')
      .single();

    if (existingUser) {
      console.log('⚠️ Usuário teste_yuri já existe, removendo...');
      
      // Remover perfil primeiro
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', existingUser.id);

      // Remover usuário
      await supabase
        .from('usuarios')
        .delete()
        .eq('id', existingUser.id);

      console.log('✅ Usuário removido');
    }

    // 3. Criar novo usuário usando a função
    console.log('\n3. Criando usuário teste_yuri...');
    const { data: result, error: createError } = await supabase
      .rpc('create_user_with_profile', {
        p_socio_id: yuri.id,
        p_username: 'teste_yuri',
        p_password: '123456',
        p_full_name: 'Yuri Teste',
        p_role: 'socio'
      });

    if (createError) {
      console.log('❌ Erro ao criar usuário:', createError);
      return;
    }

    console.log('✅ Resultado da criação:', result);

    if (!result.success) {
      console.log('❌ Falha na criação:', result.message);
      return;
    }

    // 4. Verificar se usuário foi criado
    console.log('\n4. Verificando usuário criado...');
    const { data: newUser, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'teste_yuri')
      .single();

    if (userError || !newUser) {
      console.log('❌ Usuário não foi criado:', userError?.message);
      return;
    }

    console.log('✅ Usuário criado:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Login: ${newUser.login}`);
    console.log(`   Tem hash: ${newUser.senha_hash ? 'Sim' : 'Não'}`);

    // 5. Testar login
    console.log('\n5. Testando login com senha 123456...');
    const senhaValida = await bcrypt.compare('123456', newUser.senha_hash);
    console.log(`   Login válido: ${senhaValida ? '✅ Sim' : '❌ Não'}`);

    // 6. Verificar perfil
    console.log('\n6. Verificando perfil criado...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        socios:socio_id (nome),
        usuarios:user_id (login)
      `)
      .eq('user_id', newUser.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Perfil não encontrado:', profileError?.message);
      return;
    }

    console.log('✅ Perfil criado:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Nome: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Ativo: ${profile.is_active}`);
    console.log(`   Sócio: ${profile.socios?.nome}`);
    console.log(`   Login: ${profile.usuarios?.login}`);

    // 7. Verificar permissões
    console.log('\n7. Verificando permissões criadas...');
    const { data: permissions, error: permError } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_profile_id', profile.id);

    if (permError) {
      console.log('❌ Erro ao buscar permissões:', permError.message);
    } else {
      console.log(`✅ Permissões criadas: ${permissions?.length || 0}`);
      permissions?.forEach(perm => {
        console.log(`   - ${perm.module_name}: ${JSON.stringify(perm.permissions)}`);
      });
    }

    console.log('\n🎉 Teste de criação de usuário concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testNewUserCreation();
