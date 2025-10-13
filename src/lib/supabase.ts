import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Configuração Supabase:', { 
  supabaseUrl, 
  supabaseAnonKey: supabaseAnonKey?.substring(0, 20) + '...',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  throw new Error('Configuração do Supabase incompleta');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
})

// Tipos para as tabelas do banco
export interface Usuario {
  id: string
  login: string
  senha_hash: string
  criado_em: string
}

export interface Socio {
  id: string
  nome: string
  pre_saldo: number
  criado_em: string
}

export interface Investimento {
  id: string
  data: string
  descricao: string
  socio_id: string
  valor: number
  criado_em: string
  socios?: Socio
}