const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserSocioLink() {
  console.log('🔍 Verificando vinculação usuário-sócio...\n');

  try {
    // 1. Buscar todos os sócios
    console.log('1. Buscando sócios...');
    const { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('*')
      .order('nome');

    if (sociosError) {
      console.error('❌ Erro ao buscar sócios:', sociosError);
      return;
    }

    console.log(`✅ Encontrados ${socios.length} sócios:`);
    socios.forEach(socio => {
      console.log(`   - ${socio.nome} (ID: ${socio.id})`);
    });

    // 2. Buscar todos os user_profiles
    console.log('\n2. Buscando user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('full_name');

    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }

    console.log(`✅ Encontrados ${profiles.length} profiles:`);
    profiles.forEach(profile => {
      console.log(`   - ${profile.full_name} (Sócio ID: ${profile.socio_id || 'NULL'})`);
    });

    // 3. Buscando usuários da tabela usuarios...
    console.log('\n3. Buscando usuários da tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .order('criado_em', { ascending: false });
    
    if (usuariosError) {
      console.log('❌ Erro ao buscar usuários:', usuariosError.message);
    } else {
      console.log(`✅ Encontrados ${usuarios?.length || 0} usuários:`);
      usuarios?.forEach(user => {
        console.log(`   - ${user.login} (ID: ${user.id}) - Criado em: ${user.criado_em}`);
      });
    }

    // 4. Fazer JOIN para ver vinculações
    console.log('\n4. Verificando vinculações sócio-usuário...');
    
    const { data: vinculacoes, error: vinculacoesError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        socios:socio_id (nome),
        usuarios:user_id (login)
      `);

    if (vinculacoesError) {
      console.log('❌ Erro ao buscar vinculações:', vinculacoesError.message);
    }

    console.log('\n📊 RESULTADO DAS VINCULAÇÕES:');
    console.log('================================\n');

    // Para cada sócio, verificar se tem usuário vinculado
    for (const socio of socios) {
      console.log(`🏢 Sócio: ${socio.nome}`);
      
      const vinculacao = vinculacoes?.find(v => v.socio_id === socio.id);
      
      if (vinculacao) {
        console.log(`   ✅ Usuário vinculado: ${vinculacao.full_name}`);
        console.log(`   👤 Login: ${vinculacao.usuarios?.login || 'N/A'}`);
        console.log(`   🎭 Role: ${vinculacao.role}`);
        console.log(`   🟢 Ativo: ${vinculacao.is_active ? 'Sim' : 'Não'}`);
      } else {
        console.log('   ❌ Nenhum usuário vinculado');
      }
      console.log('');
    }

    // 5. Verificar especificamente o usuário je4ndev
    console.log('\n5. Verificando usuário je4ndev...');
    
    const je4ndevUser = usuarios?.find(user => user.login === 'je4ndev');
    
    if (je4ndevUser) {
      console.log('✅ Usuário je4ndev encontrado na tabela usuarios');
      
      // Verificar se tem profile
      const je4ndevProfile = vinculacoes?.find(v => v.user_id === je4ndevUser.id);
      
      if (je4ndevProfile) {
        console.log(`✅ je4ndev está vinculado ao sócio: ${je4ndevProfile.socios?.nome}`);
        console.log(`   - Nome completo: ${je4ndevProfile.full_name}`);
        console.log(`   - Role: ${je4ndevProfile.role}`);
        console.log(`   - Ativo: ${je4ndevProfile.is_active ? 'Sim' : 'Não'}`);
      } else {
        console.log('❌ je4ndev não está vinculado a nenhum sócio');
      }
    } else {
      console.log('❌ Usuário je4ndev não encontrado na tabela usuarios');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserSocioLink();