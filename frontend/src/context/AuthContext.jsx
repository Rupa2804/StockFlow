import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentUser,
  login as requestLogin,
} from '../services/authService'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  UNAUTHORIZED_EVENT,
} from '../utils/sessionToken'

const AuthContext = createContext(null)
const currentUserQueryKey = ['auth', 'me']

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [hasSession, setHasSession] = useState(() => Boolean(getAccessToken()))
  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: hasSession,
    retry: (failureCount, error) => error?.response?.status !== 401 && failureCount < 1,
  })

  useEffect(() => {
    function handleUnauthorized() {
      clearAccessToken()
      setHasSession(false)
      queryClient.clear()
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [queryClient])

  async function login(credentials) {
    const tokenResponse = await requestLogin(credentials)
    setAccessToken(tokenResponse.access_token)
    setHasSession(true)
  }

  function logout() {
    clearAccessToken()
    setHasSession(false)
    queryClient.clear()
  }

  function retryCurrentUser() {
    return currentUserQuery.refetch()
  }

  const status = !hasSession
    ? 'unauthenticated'
    : currentUserQuery.isPending
      ? 'loading'
      : currentUserQuery.isError
        ? 'error'
        : 'authenticated'

  return (
    <AuthContext.Provider
      value={{
        user: currentUserQuery.data ?? null,
        status,
        authError: currentUserQuery.error,
        login,
        logout,
        retryCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
