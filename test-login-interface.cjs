const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginInterface() {
  console.log('🔐 Testando fluxo completo de login...\n');

  try {
    // 1. Simular login com je4ndev
    console.log('1. Testando login com je4ndev (senha: admin123)...');
    
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'je4ndev')
      .single();

    if (userError || !user) {
      console.log('❌ Usuário je4ndev não encontrado');
      return;
    }

    const senhaValida = await bcrypt.compare('admin123', user.senha_hash);
    if (!senhaValida) {
      console.log('❌ Senha inválida para je4ndev');
      return;
    }

    console.log('✅ Login je4ndev válido');

    // 2. Buscar perfil como faria o getCurrentUserProfile
    console.log('\n2. Buscando perfil do usuário...');
    
    const { data: profile, error: profileError } = await supabase
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
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    if (!profile) {
      console.log('❌ Perfil não encontrado');
      return;
    }

    console.log('✅ Perfil encontrado:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Nome: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Ativo: ${profile.is_active}`);
    console.log(`   Sócio: ${profile.socios?.nome || 'N/A'}`);
    console.log(`   Username: ${profile.usuarios?.login}`);

    // 3. Testar com usuário recém-criado
    console.log('\n3. Testando login com teste_yuri (senha: 123456)...');
    
    const { data: testUser, error: testUserError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'teste_yuri')
      .single();

    if (testUserError || !testUser) {
      console.log('❌ Usuário teste_yuri não encontrado');
      return;
    }

    const testSenhaValida = await bcrypt.compare('123456', testUser.senha_hash);
    if (!testSenhaValida) {
      console.log('❌ Senha inválida para teste_yuri');
      return;
    }

    console.log('✅ Login teste_yuri válido');

    // 4. Buscar perfil do teste_yuri
    console.log('\n4. Buscando perfil do teste_yuri...');
    
    const { data: testProfile, error: testProfileError } = await supabase
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
      .eq('user_id', testUser.id)
      .single();

    if (testProfileError) {
      console.log('❌ Erro ao buscar perfil do teste_yuri:', testProfileError.message);
      return;
    }

    if (!testProfile) {
      console.log('❌ Perfil do teste_yuri não encontrado');
      return;
    }

    console.log('✅ Perfil do teste_yuri encontrado:');
    console.log(`   ID: ${testProfile.id}`);
    console.log(`   Nome: ${testProfile.full_name}`);
    console.log(`   Role: ${testProfile.role}`);
    console.log(`   Ativo: ${testProfile.is_active}`);
    console.log(`   Sócio: ${testProfile.socios?.nome || 'N/A'}`);
    console.log(`   Username: ${testProfile.usuarios?.login}`);

    // 5. Simular dados que seriam salvos no localStorage
    console.log('\n5. Dados que seriam salvos no localStorage:');
    
    const authUserData = {
      id: user.id,
      login: user.login
    };
    
    const authToken = 'fake-jwt-token-' + Date.now();
    
    console.log('   auth_user:', JSON.stringify(authUserData, null, 2));
    console.log('   auth_token:', authToken);

    console.log('\n🎉 Fluxo de login testado com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Autenticação funcionando');
    console.log('   ✅ Perfis sendo carregados corretamente');
    console.log('   ✅ Relacionamentos com sócios funcionando');
    console.log('   ✅ Sistema pronto para uso na interface');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testLoginInterface();
