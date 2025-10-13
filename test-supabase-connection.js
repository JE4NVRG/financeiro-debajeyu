// Teste de conexão com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjAxNzIsImV4cCI6MjA3NTE5NjE3Mn0.wM_XGxhV0Rcpq8yEnV-xuGhLhnvhOqO9RCEJ7CsprTA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔧 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar se consegue conectar
    console.log('1. Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('socios')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro na conexão básica:', healthError);
    } else {
      console.log('✅ Conexão básica funcionando');
    }

    // Teste 2: Verificar tabela abatimentos_pre_saldo
    console.log('2. Testando tabela abatimentos_pre_saldo...');
    const { data: abatimentos, error: abatimentosError } = await supabase
      .from('abatimentos_pre_saldo')
      .select('*')
      .limit(1);
    
    if (abatimentosError) {
      console.error('❌ Erro na tabela abatimentos:', abatimentosError);
    } else {
      console.log('✅ Tabela abatimentos_pre_saldo acessível');
      console.log('📊 Dados encontrados:', abatimentos?.length || 0);
    }

    // Teste 3: Verificar query com joins
    console.log('3. Testando query com relacionamentos...');
    const { data: abatimentosComJoin, error: joinError } = await supabase
      .from('abatimentos_pre_saldo')
      .select(`
        *,
        socio:socios(nome),
        conta:contas(nome)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Erro na query com joins:', joinError);
    } else {
      console.log('✅ Query com relacionamentos funcionando');
      console.log('📊 Dados com joins:', abatimentosComJoin?.length || 0);
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testConnection();