import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, logout as authLogout, login, saveAuthData, type AuthUser, type LoginCredentials } from '../lib/auth'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const signIn = async (username: string, password: string) => {
    const credentials: LoginCredentials = {
      login: username,
      senha: password
    }
    
    const response = await login(credentials)
    
    if (response.success && response.token && response.user) {
      saveAuthData(response.token, response.user)
      setUser(response.user)
    } else {
      throw new Error(response.error || 'Erro no login')
    }
  }

  const logout = () => {
    authLogout()
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    logout,
    setUser
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