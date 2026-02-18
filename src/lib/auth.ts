import { db } from './db'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { User } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) return null
  
  const payload = await verifyToken(token)
  if (!payload) return null
  
  const user = await db.user.findUnique({
    where: { id: payload.userId }
  })
  
  return user
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() }
  })
  
  if (!user) {
    return { success: false, error: 'Email ou senha inválidos' }
  }
  
  if (!user.active) {
    return { success: false, error: 'Usuário inativo' }
  }
  
  const isValid = await verifyPassword(password, user.password)
  
  if (!isValid) {
    return { success: false, error: 'Email ou senha inválidos' }
  }
  
  return { success: true, user }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('token')
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  })
}
