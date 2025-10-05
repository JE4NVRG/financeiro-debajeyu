import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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