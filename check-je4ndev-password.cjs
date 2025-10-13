const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJe4ndevPassword() {
  console.log('🔍 Verificando senha do usuário je4ndev...\n');

  try {
    // Buscar usuário je4ndev
    const { data: je4ndev, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('login', 'je4ndev')
      .single();

    if (error || !je4ndev) {
      console.log('❌ Usuário je4ndev não encontrado');
      return;
    }

    console.log('✅ Usuário je4ndev encontrado:');
    console.log(`   ID: ${je4ndev.id}`);
    console.log(`   Login: ${je4ndev.login}`);
    console.log(`   Hash atual: ${je4ndev.senha_hash}`);

    // Testar senha 'admin123' (que deveria ser a correta baseada na migration)
    console.log('\n🔐 Testando senha "admin123"...');
    const senhaCorreta = await bcrypt.compare('admin123', je4ndev.senha_hash);
    console.log(`   Resultado: ${senhaCorreta ? '✅ Senha correta!' : '❌ Senha incorreta'}`);

    if (!senhaCorreta) {
      console.log('\n🔧 Atualizando senha para "admin123"...');
      
      // Gerar novo hash para 'admin123'
      const novoHash = await bcrypt.hash('admin123', 10);
      
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ senha_hash: novoHash })
        .eq('id', je4ndev.id);

      if (updateError) {
        console.log('❌ Erro ao atualizar senha:', updateError);
      } else {
        console.log('✅ Senha atualizada com sucesso!');
        
        // Testar novamente
        const { data: updatedUser } = await supabase
          .from('usuarios')
          .select('senha_hash')
          .eq('id', je4ndev.id)
          .single();

        if (updatedUser) {
          const testeNovo = await bcrypt.compare('admin123', updatedUser.senha_hash);
          console.log(`   Teste após atualização: ${testeNovo ? '✅ Sucesso!' : '❌ Ainda falhou'}`);
        }
      }
    }

    // Verificar perfil
    console.log('\n👤 Verificando perfil do usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        socios:socio_id (nome)
      `)
      .eq('user_id', je4ndev.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Perfil não encontrado:', profileError?.message);
    } else {
      console.log('✅ Perfil encontrado:');
      console.log(`   Nome: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Ativo: ${profile.is_active}`);
      console.log(`   Sócio: ${profile.socios?.nome || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkJe4ndevPassword();
