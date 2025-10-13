const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS da tabela user_profiles...\n');
  
  try {
    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual, 
            with_check 
          FROM pg_policies 
          WHERE tablename = 'user_profiles';
        `
      });

    if (policiesError) {
      console.error('❌ Erro ao buscar políticas RLS:', policiesError);
      return;
    }

    console.log('📋 Políticas RLS encontradas:');
    if (policies && policies.length > 0) {
      policies.forEach((policy, index) => {
        console.log(`\n${index + 1}. Política: ${policy.policyname}`);
        console.log(`   - Comando: ${policy.cmd}`);
        console.log(`   - Roles: ${policy.roles}`);
        console.log(`   - Qualificação: ${policy.qual}`);
        console.log(`   - With Check: ${policy.with_check}`);
      });
    } else {
      console.log('   Nenhuma política RLS encontrada.');
    }

    // Verificar se RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE tablename = 'user_profiles';
        `
      });

    if (rlsError) {
      console.error('❌ Erro ao verificar status RLS:', rlsError);
      return;
    }

    console.log('\n🔒 Status RLS:');
    if (rlsStatus && rlsStatus.length > 0) {
      rlsStatus.forEach(table => {
        console.log(`   - Tabela: ${table.tablename}`);
        console.log(`   - RLS Habilitado: ${table.rls_enabled}`);
      });
    }

    // Testar acesso direto à tabela
    console.log('\n🧪 Testando acesso direto à tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao acessar user_profiles:', profilesError);
    } else {
      console.log(`✅ Sucesso! Encontrados ${profiles.length} perfis.`);
      profiles.forEach(profile => {
        console.log(`   - ID: ${profile.id}, Nome: ${profile.full_name}, Role: ${profile.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRLSPolicies();