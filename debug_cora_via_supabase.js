// DIAGNÓSTICO RADICAL VIA SUPABASE CLIENT
// Executar queries diretas para identificar valores EXATOS

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ribxfoazwwolrciwkyuk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnhmb2F6d3dvbHJjaXdreXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYyMDE3MiwiZXhwIjoyMDc1MTk2MTcyfQ.6KX6Y8SoUWEXwW3YGUbIuoC9_XasXgkyJRVsRjfepJE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnosticoRadical() {
  console.log('🔍 DIAGNÓSTICO RADICAL - CONTA CORA')
  console.log('=====================================')

  try {
    // 1. Primeiro vamos ver todas as contas
    console.log('\n1. TODAS AS CONTAS:')
    const { data: todasContas, error: todasContasError } = await supabase
      .from('contas')
      .select('*')
    
    if (todasContasError) {
      console.error('Erro ao buscar todas as contas:', todasContasError)
      return
    }
    console.log('Todas as contas:', todasContas)

    // Procurar conta Cora (pode ter nome ligeiramente diferente)
    const conta = todasContas.find(c => c.nome.toLowerCase().includes('cora'))
    if (!conta) {
      console.error('Conta Cora não encontrada!')
      return
    }
    console.log('\nConta Cora encontrada:', conta)

    // 2. Entradas totais
    console.log('\n2. ENTRADAS TOTAIS:')
    const { data: entradas, error: entradasError } = await supabase
      .from('entradas')
      .select('valor')
      .eq('conta_id', conta.id)
    
    if (entradasError) {
      console.error('Erro ao buscar entradas:', entradasError)
    } else {
      const totalEntradas = entradas.reduce((sum, e) => sum + (e.valor || 0), 0)
      console.log(`Total Entradas: R$ ${totalEntradas.toFixed(2)} (${entradas.length} registros)`)
    }

    // 3. Pagamentos totais
    console.log('\n3. PAGAMENTOS TOTAIS:')
    const { data: pagamentos, error: pagamentosError } = await supabase
      .from('pagamentos')
      .select('valor_pago')
      .eq('conta_id', conta.id)
    
    if (pagamentosError) {
      console.error('Erro ao buscar pagamentos:', pagamentosError)
    } else {
      const totalPagamentos = pagamentos.reduce((sum, p) => sum + (p.valor_pago || 0), 0)
      console.log(`Total Pagamentos: R$ ${totalPagamentos.toFixed(2)} (${pagamentos.length} registros)`)
    }

    // 4. Abatimentos totais
    console.log('\n4. ABATIMENTOS TOTAIS:')
    const { data: abatimentos, error: abatimentosError } = await supabase
      .from('abatimentos')
      .select('valor_abatimento')
      .eq('conta_id', conta.id)
    
    if (abatimentosError) {
      console.error('Erro ao buscar abatimentos:', abatimentosError)
    } else {
      const totalAbatimentos = abatimentos.reduce((sum, a) => sum + (a.valor_abatimento || 0), 0)
      console.log(`Total Abatimentos: R$ ${totalAbatimentos.toFixed(2)} (${abatimentos.length} registros)`)
    }

    // 5. Compras abertas
    console.log('\n5. COMPRAS ABERTAS:')
    const { data: comprasAbertas, error: comprasError } = await supabase
      .from('compras')
      .select('saldo_aberto')
      .in('status', ['Aberta', 'Parcial'])
    
    if (comprasError) {
      console.error('Erro ao buscar compras abertas:', comprasError)
    } else {
      const totalComprasAbertas = comprasAbertas.reduce((sum, c) => sum + (c.saldo_aberto || 0), 0)
      console.log(`Total Compras Abertas: R$ ${totalComprasAbertas.toFixed(2)} (${comprasAbertas.length} registros)`)
    }

    // 6. Função get_conta_cora_info()
    console.log('\n6. FUNÇÃO get_conta_cora_info():')
    const { data: coraInfo, error: coraInfoError } = await supabase.rpc('get_conta_cora_info')
    
    if (coraInfoError) {
      console.error('Erro ao executar get_conta_cora_info:', coraInfoError)
    } else {
      console.log('Resultado get_conta_cora_info:', coraInfo)
    }

    // 7. Função validate_account_balance
    console.log('\n7. FUNÇÃO validate_account_balance:')
    const { data: validacao, error: validacaoError } = await supabase.rpc('validate_account_balance', {
      p_conta_id: conta.id,
      p_valor_pagamento: 100
    })
    
    if (validacaoError) {
      console.error('Erro ao executar validate_account_balance:', validacaoError)
    } else {
      console.log('Resultado validate_account_balance:', validacao)
    }

    // 8. Função calcular_saldo_conta
    console.log('\n8. FUNÇÃO calcular_saldo_conta:')
    const { data: saldoCalculado, error: saldoError } = await supabase.rpc('calcular_saldo_conta', {
      conta_id: conta.id
    })
    
    if (saldoError) {
      console.error('Erro ao executar calcular_saldo_conta:', saldoError)
    } else {
      console.log('Resultado calcular_saldo_conta:', saldoCalculado)
    }

    console.log('\n=====================================')
    console.log('🔍 DIAGNÓSTICO CONCLUÍDO')

  } catch (error) {
    console.error('Erro geral:', error)
  }
}

diagnosticoRadical()