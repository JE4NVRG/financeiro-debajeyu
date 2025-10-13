const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS da tabela user_profiles...\n');
  
  try {
    // Verificar políticas RLS usando query SQL direta
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
          WHERE tablename = 'user_profiles' 
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.error('❌ Erro ao buscar políticas RLS:', policiesError);
      
      // Tentar método alternativo usando query direta
      console.log('\n🔄 Tentando método alternativo...');
      const { data: altPolicies, error: altError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'user_profiles');
        
      if (altError) {
        console.error('❌ Erro no método alternativo:', altError);
        return;
      }
      
      console.log('✅ Políticas encontradas (método alternativo):', altPolicies);
      return;
    }

    console.log('✅ Políticas RLS encontradas:', policies.length);
    
    if (policies.length === 0) {
      console.log('⚠️ Nenhuma política RLS encontrada para user_profiles');
      return;
    }

    policies.forEach((policy, index) => {
      console.log(`\n📋 Política ${index + 1}:`);
      console.log(`   Nome: ${policy.policyname}`);
      console.log(`   Comando: ${policy.cmd}`);
      console.log(`   Roles: ${policy.roles}`);
      console.log(`   Qualificação: ${policy.qual || 'N/A'}`);
      console.log(`   With Check: ${policy.with_check || 'N/A'}`);
    });

    // Testar acesso direto à tabela
    console.log('\n🧪 Testando acesso direto à tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, is_active')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao acessar user_profiles:', profilesError);
      
      // Se ainda há erro de recursão, as políticas precisam ser corrigidas
      if (profilesError.code === '42P17') {
        console.log('\n🚨 RECURSÃO INFINITA DETECTADA!');
        console.log('As políticas RLS ainda estão causando recursão infinita.');
        console.log('Será necessário desabilitar RLS temporariamente e recriar as políticas.');
      }
    } else {
      console.log('✅ Acesso à tabela funcionando!');
      console.log(`Perfis encontrados: ${profiles.length}`);
      profiles.forEach(p => {
        console.log(`   - ${p.full_name} (${p.role}) - ${p.is_active ? 'Ativo' : 'Inativo'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRLSPolicies();