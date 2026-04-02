import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { fetchMe } from '../services/api'

export type User = { name: string; email: string; avatar: string | null; id?: string }

const AuthContext = createContext<{
  user: User | null
  token: string | null
  login: (t: string) => Promise<void>
  logout: () => void
  updateUser: (u: User) => void
  isLoading: boolean
} | null>(null)

const TOKEN_KEY = 'filegenie_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      const userData = await fetchMe()
      setUser({ ...userData, name: userData.email.split('@')[0] })
    } catch {
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      void loadUser(token)
    } else {
      setIsLoading(false)
    }
  }, [token, loadUser])

  const login = useCallback(async (t: string) => {
    await loadUser(t)
  }, [loadUser])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser: setUser, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  )
}



export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}
