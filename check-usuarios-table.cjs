const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsuariosTable() {
  console.log('🔍 Verificando tabela usuarios...\n');

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
      console.log(`   - ${user.login} (ID: ${user.id}) - Criado em: ${user.criado_em}`);
    });

    // 2. Verificar especificamente o je4ndev
    console.log('\n2. Verificando usuário je4ndev...');
    const { data: je4ndev, error: je4ndevError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'je4ndev')
      .single();

    if (je4ndevError) {
      console.log('❌ Usuário je4ndev não encontrado:', je4ndevError.message);
    } else {
      console.log('✅ Usuário je4ndev encontrado:');
      console.log(`   - ID: ${je4ndev.id}`);
      console.log(`   - Login: ${je4ndev.login}`);
      console.log(`   - Criado em: ${je4ndev.criado_em}`);
      console.log(`   - Tem senha: ${je4ndev.senha_hash ? 'Sim' : 'Não'}`);
    }

    // 3. Verificar se existe user_profiles para je4ndev
    console.log('\n3. Verificando se je4ndev tem profile...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('❌ Erro ao buscar profiles:', profilesError.message);
    } else {
      console.log(`✅ Encontrados ${profiles?.length || 0} profiles:`);
      profiles?.forEach(profile => {
        console.log(`   - ${profile.full_name} (User ID: ${profile.user_id}, Sócio ID: ${profile.socio_id})`);
      });
    }

    // 4. Verificar estrutura da tabela usuarios
    console.log('\n4. Verificando estrutura da tabela usuarios...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'usuarios' });

    if (tableError) {
      console.log('❌ Não foi possível obter estrutura da tabela');
    } else {
      console.log('✅ Estrutura da tabela usuarios:');
      console.log(tableInfo);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUsuariosTable();
