import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, logout as authLogout, login, saveAuthData, type AuthUser, type LoginCredentials } from '../lib/auth'
import { UserProfile, UserPermission } from '../types/database'
import { useUserManagement } from '../hooks/useUserManagement'

interface AuthContextType {
  user: AuthUser | null
  userProfile: UserProfile | null
  userPermissions: UserPermission[]
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: AuthUser | null) => void
  refreshUserProfile: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  isAdmin: boolean
  isSocio: boolean
  isSocioLimitado: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { getCurrentUserProfile } = useUserManagement()

  // Carregar perfil do usuário quando autenticado
  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    if (currentUser) {
      loadUserProfile()
    } else {
      setIsLoading(false)
    }
  }, [])

  // Função para carregar perfil e permissões do usuário
  const loadUserProfile = async () => {
    try {
      console.log('🔄 Carregando perfil do usuário...');
      const profile = await getCurrentUserProfile()
      console.log('✅ Perfil carregado:', profile);
      setUserProfile(profile)
      
      // Carregar permissões do usuário (se necessário)
      // As permissões podem vir junto com o perfil ou ser carregadas separadamente
      // Por enquanto, vamos usar um array vazio
      setUserPermissions([])
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error)
      
      // Não criar perfil padrão aqui, deixar o useUserManagement lidar com isso
      // Se ainda assim falhar, definir userProfile como null
      setUserProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (username: string, password: string) => {
    const credentials: LoginCredentials = {
      login: username,
      senha: password
    }
    
    const response = await login(credentials)
    
    if (response.success && response.token && response.user) {
      saveAuthData(response.token, response.user)
      setUser(response.user)
      
      // Carregar perfil após login
      await loadUserProfile()
    } else {
      throw new Error(response.error || 'Erro no login')
    }
  }

  const logout = () => {
    authLogout()
    setUser(null)
    setUserProfile(null)
    setUserPermissions([])
  }

  // Função para atualizar perfil do usuário
  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile()
    }
  }

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false
    
    // Admins têm todas as permissões
    if (userProfile.role === 'admin') return true
    
    // Verificar nas permissões específicas
    return userPermissions.some(p => p.permission_name === permission && p.is_active)
  }

  // Verificar se o usuário tem um papel específico
  const hasRole = (role: string): boolean => {
    return userProfile?.role === role
  }

  // Verificações de papel
  const isAdmin = userProfile?.role === 'admin'
  const isSocio = userProfile?.role === 'socio'
  const isSocioLimitado = userProfile?.role === 'socio_limitado'

  const value = {
    user,
    userProfile,
    userPermissions,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    logout,
    setUser,
    refreshUserProfile,
    hasPermission,
    hasRole,
    isAdmin,
    isSocio,
    isSocioLimitado
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}