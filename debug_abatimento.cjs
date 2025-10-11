const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAbatimento() {
  try {
    console.log('🔍 Verificando sócios...');
    
    // Buscar sócios
    const { data: socios, error: sociosError } = await supabase
      .from('socios')
      .select('*')
      .order('nome');
    
    if (sociosError) {
      console.error('❌ Erro ao buscar sócios:', sociosError);
      return;
    }
    
    console.log('👥 Sócios encontrados:');
    socios.forEach(socio => {
      console.log(`  - ${socio.nome}: R$ ${socio.pre_saldo}`);
    });
    
    // Buscar Bárbara especificamente
    const barbara = socios.find(s => s.nome.toLowerCase().includes('bárbara'));
    if (!barbara) {
      console.log('❌ Sócio Bárbara não encontrado');
      return;
    }
    
    console.log(`\n💰 Saldo da Bárbara: R$ ${barbara.pre_saldo}`);
    console.log(`💰 Tipo do saldo: ${typeof barbara.pre_saldo}`);
    
    // Testar conversão de valor
    const valorTeste = '677.55'; // Como vem do formulário
    const valorNumerico = parseFloat(valorTeste);
    
    console.log(`\n🧮 Teste de conversão:`);
    console.log(`  - Valor original: "${valorTeste}"`);
    console.log(`  - Valor convertido: ${valorNumerico}`);
    console.log(`  - Tipo: ${typeof valorNumerico}`);
    
    // Verificar se há saldo suficiente
    console.log(`\n✅ Verificação de saldo:`);
    console.log(`  - Saldo atual: ${barbara.pre_saldo}`);
    console.log(`  - Valor a debitar: ${valorNumerico}`);
    console.log(`  - Saldo suficiente? ${barbara.pre_saldo >= valorNumerico ? 'SIM' : 'NÃO'}`);
    
    if (barbara.pre_saldo >= valorNumerico) {
      console.log(`  - Saldo restante seria: ${barbara.pre_saldo - valorNumerico}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAbatimento();