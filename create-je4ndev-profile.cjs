const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createJe4ndevProfile() {
  console.log('🔧 Criando profile para je4ndev...\n');

  try {
    // 1. Buscar o usuário je4ndev
    console.log('1. Buscando usuário je4ndev...');
    const { data: je4ndev, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'je4ndev')
      .single();

    if (userError || !je4ndev) {
      console.error('❌ Usuário je4ndev não encontrado:', userError);
      return;
    }

    console.log('✅ Usuário je4ndev encontrado:', je4ndev.id);

    // 2. Buscar o sócio Jean
    console.log('\n2. Buscando sócio Jean...');
    const { data: jean, error: socioError } = await supabase
      .from('socios')
      .select('*')
      .eq('nome', 'Jean')
      .single();

    if (socioError || !jean) {
      console.error('❌ Sócio Jean não encontrado:', socioError);
      return;
    }

    console.log('✅ Sócio Jean encontrado:', jean.id);

    // 3. Verificar se já existe um profile
    console.log('\n3. Verificando se já existe profile...');
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('socio_id', jean.id)
      .single();

    if (existingProfile) {
      console.log('⚠️ Já existe um profile para o sócio Jean:', existingProfile.id);
      return;
    }

    // 4. Criar o user_profile
    console.log('\n4. Criando user_profile...');
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: je4ndev.id, // Usar o ID da tabela usuarios
        socio_id: jean.id,
        full_name: 'Jean Developer',
        role: 'admin',
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar profile:', createError);
      return;
    }

    console.log('✅ Profile criado com sucesso:', newProfile.id);

    // 5. Criar permissões de admin
    console.log('\n5. Criando permissões de admin...');
    const permissions = [
      { module_name: 'dashboard', permissions: '{"read": true, "write": true, "delete": true}' },
      { module_name: 'socios', permissions: '{"read": true, "write": true, "delete": true}' },
      { module_name: 'compras', permissions: '{"read": true, "write": true, "delete": true}' },
      { module_name: 'entradas', permissions: '{"read": true, "write": true, "delete": true}' },
      { module_name: 'marketplaces', permissions: '{"read": true, "write": true, "delete": true}' },
      { module_name: 'contas', permissions: '{"read": true, "write": true, "delete": true}' },
      { module_name: 'usuarios', permissions: '{"read": true, "write": true, "delete": true}' },
      { module_name: 'perfil', permissions: '{"read": true, "write": true, "delete": false}' }
    ];

    const permissionsData = permissions.map(perm => ({
      user_profile_id: newProfile.id,
      module_name: perm.module_name,
      permissions: perm.permissions
    }));

    const { error: permError } = await supabase
      .from('user_permissions')
      .insert(permissionsData);

    if (permError) {
      console.error('❌ Erro ao criar permissões:', permError);
      return;
    }

    console.log('✅ Permissões criadas com sucesso!');

    // 6. Verificar resultado final
    console.log('\n6. Verificando resultado final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_management_view')
      .select('*')
      .eq('profile_id', newProfile.id)
      .single();

    if (finalError) {
      console.log('⚠️ Não foi possível verificar pela view:', finalError.message);
    } else {
      console.log('✅ Vinculação criada com sucesso:');
      console.log(`   - Profile ID: ${finalCheck.profile_id}`);
      console.log(`   - User ID: ${finalCheck.user_id}`);
      console.log(`   - Sócio: ${finalCheck.socio_nome}`);
      console.log(`   - Nome: ${finalCheck.full_name}`);
      console.log(`   - Role: ${finalCheck.role}`);
      console.log(`   - Ativo: ${finalCheck.is_active}`);
    }

    console.log('\n🎉 je4ndev agora está vinculado ao sócio Jean!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createJe4ndevProfile();
