import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import type { Usuario } from './supabase'

export interface AuthUser {
  id: string
  login: string
}

export interface LoginCredentials {
  login: string
  senha: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: AuthUser
  error?: string
}

// Função para gerar um token simples (apenas para demonstração)
function generateSimpleToken(user: AuthUser): string {
  const tokenData = {
    id: user.id,
    login: user.login,
    timestamp: Date.now()
  }
  return btoa(JSON.stringify(tokenData))
}

// Função para verificar token simples
function verifySimpleToken(token: string): AuthUser | null {
  try {
    const decoded = JSON.parse(atob(token))
    // Verificar se o token não expirou (24 horas)
    const now = Date.now()
    const tokenAge = now - decoded.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas em ms
    
    if (tokenAge > maxAge) {
      return null
    }
    
    return {
      id: decoded.id,
      login: decoded.login
    }
  } catch {
    return null
  }
}

// Criar cliente Supabase com service role para login
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey)

// Função para fazer login
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { data: usuarios, error } = await supabaseAuth
      .from('usuarios')
      .select('*')
      .eq('login', credentials.login)
      .single()

    if (error || !usuarios) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      }
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(credentials.senha, usuarios.senha_hash)
    
    if (!senhaValida) {
      return {
        success: false,
        error: 'Senha incorreta'
      }
    }

    const user: AuthUser = {
      id: usuarios.id,
      login: usuarios.login
    }

    // Gerar token simples
    const token = generateSimpleToken(user)

    // Criar sessão Supabase para permitir alteração de senha
    try {
      // Usar o email como login para o Supabase Auth (necessário para auth)
      const email = `${usuarios.login}@sistema.local`
      
      // Tentar fazer login no Supabase Auth
      const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
        email: email,
        password: credentials.senha
      })

      if (authError) {
        console.log('⚠️ Usuário não existe no Supabase Auth, criando...')
        
        // Se não existe, criar usuário no Supabase Auth
        const { data: signUpData, error: signUpError } = await supabaseAuth.auth.signUp({
          email: email,
          password: credentials.senha,
          options: {
            data: {
              user_id: usuarios.id,
              login: usuarios.login
            }
          }
        })

        if (signUpError) {
          console.error('Erro ao criar usuário no Supabase Auth:', signUpError)
        } else {
          console.log('✅ Usuário criado no Supabase Auth:', signUpData.user?.id)
        }
      } else {
        console.log('✅ Login no Supabase Auth realizado:', authData.user?.id)
      }
    } catch (authError) {
      console.error('Erro na autenticação Supabase:', authError)
      // Não falhar o login principal por causa disso
    }

    return {
      success: true,
      token,
      user
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}

// Função para verificar token
export function verifyToken(token: string): AuthUser | null {
  return verifySimpleToken(token)
}

// Função para obter usuário do localStorage
export function getCurrentUser(): AuthUser | null {
  const token = localStorage.getItem('auth_token')
  if (!token) return null
  
  return verifyToken(token)
}

// Função para fazer logout
export function logout(): void {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

// Função para salvar token no localStorage
export function saveAuthData(token: string, user: AuthUser): void {
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}