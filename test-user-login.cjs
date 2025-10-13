const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserLogin() {
  console.log('🔍 Testando login de usuários criados...\n');

  try {
    // 1. Buscar todos os usuários
    console.log('1. Buscando usuários na tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .order('criado_em', { ascending: false });

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError);
      return;
    }

    console.log(`✅ Encontrados ${usuarios?.length || 0} usuários:`);
    usuarios?.forEach(user => {
      console.log(`   - ${user.login} (ID: ${user.id})`);
    });

    // 2. Buscar todos os perfis
    console.log('\n2. Buscando perfis na tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        socios:socio_id (nome),
        usuarios:user_id (login)
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError);
      return;
    }

    console.log(`✅ Encontrados ${profiles?.length || 0} perfis:`);
    profiles?.forEach(profile => {
      console.log(`   - ${profile.full_name} (Login: ${profile.usuarios?.login}, Sócio: ${profile.socios?.nome})`);
    });

    // 3. Testar login com je4ndev
    console.log('\n3. Testando login com je4ndev...');
    const je4ndev = usuarios?.find(u => u.login === 'je4ndev');
    
    if (!je4ndev) {
      console.log('❌ Usuário je4ndev não encontrado');
      return;
    }

    console.log(`✅ Usuário je4ndev encontrado: ${je4ndev.id}`);
    console.log(`   - Tem senha hash: ${je4ndev.senha_hash ? 'Sim' : 'Não'}`);
    console.log(`   - Hash: ${je4ndev.senha_hash?.substring(0, 20)}...`);

    // Testar senha padrão
    const senhasTeste = ['123456', 'je4ndev', 'admin', 'password'];
    
    for (const senha of senhasTeste) {
      console.log(`\n   Testando senha: "${senha}"`);
      try {
        const senhaValida = await bcrypt.compare(senha, je4ndev.senha_hash);
        if (senhaValida) {
          console.log(`   ✅ Senha "${senha}" é válida!`);
          
          // Buscar perfil do usuário
          const profile = profiles?.find(p => p.user_id === je4ndev.id);
          if (profile) {
            console.log(`   ✅ Perfil encontrado: ${profile.full_name}`);
            console.log(`   📋 Dados do perfil:`);
            console.log(`      - ID: ${profile.id}`);
            console.log(`      - Nome: ${profile.full_name}`);
            console.log(`      - Role: ${profile.role}`);
            console.log(`      - Sócio: ${profile.socios?.nome || 'N/A'}`);
            console.log(`      - Ativo: ${profile.is_active}`);
          } else {
            console.log(`   ❌ Perfil não encontrado para o usuário`);
          }
          break;
        } else {
          console.log(`   ❌ Senha "${senha}" inválida`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao testar senha "${senha}":`, error.message);
      }
    }

    // 4. Criar usuário de teste se necessário
    console.log('\n4. Verificando se precisamos criar usuário de teste...');
    const testUser = usuarios?.find(u => u.login === 'teste123');
    
    if (!testUser) {
      console.log('   Criando usuário de teste...');
      
      // Buscar sócio Bárbara para vincular
      const { data: barbara, error: barbaraError } = await supabase
        .from('socios')
        .select('*')
        .eq('nome', 'Bárbara')
        .single();

      if (barbaraError || !barbara) {
        console.log('   ❌ Sócio Bárbara não encontrado');
        return;
      }

      // Criar usuário de teste
      const { data: result, error: createError } = await supabase
        .rpc('create_user_with_profile', {
          p_socio_id: barbara.id,
          p_username: 'teste123',
          p_password: '123456',
          p_full_name: 'Usuário Teste',
          p_role: 'socio'
        });

      if (createError) {
        console.log('   ❌ Erro ao criar usuário de teste:', createError);
      } else {
        console.log('   ✅ Usuário de teste criado:', result);
        
        // Testar login imediatamente
        console.log('\n   Testando login do usuário recém-criado...');
        const { data: newUser, error: newUserError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('login', 'teste123')
          .single();

        if (newUser) {
          const senhaValida = await bcrypt.compare('123456', newUser.senha_hash);
          console.log(`   Login teste123 com senha 123456: ${senhaValida ? '✅ Sucesso' : '❌ Falhou'}`);
        }
      }
    } else {
      console.log('   ✅ Usuário de teste já existe');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUserLogin();
