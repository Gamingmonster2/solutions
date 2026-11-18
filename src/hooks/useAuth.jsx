import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, clearAuthToken, getAuthToken, setAuthToken } from '@/services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      const data = await authApi.me()
      if (!data.authenticated) clearAuthToken()
      setUser(data.authenticated ? data.user : null)
      return data.user ?? null
    } catch {
      // Worker may be absent in local preview — degrade to guest, never break the app.
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password })
    setAuthToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, password) => {
    const data = await authApi.register({ email, password })
    setAuthToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Clear locally even if the Worker is unreachable.
    } finally {
      clearAuthToken()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
