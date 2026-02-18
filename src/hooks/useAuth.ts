'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  active: boolean
  twilioAccountSid?: string | null
  twilioAuthToken?: string | null
  twilioPhoneNumber?: string | null
  whatsappEnabled: boolean
}

interface UseAuthReturn {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchUser()
  }, [fetchUser])
  
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        return { error: data.error || 'Erro ao fazer login' }
      }
      
      await fetchUser()
      return {}
    } catch {
      return { error: 'Erro ao fazer login' }
    }
  }
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
    } catch {
      console.error('Logout failed')
    }
  }
  
  const refreshUser = async () => {
    await fetchUser()
  }
  
  return { user, loading, login, logout, refreshUser }
}
