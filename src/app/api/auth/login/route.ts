import { NextRequest, NextResponse } from 'next/server'
import { login, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    const result = await login(email, password)
    
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }
    
    const token = await createToken(result.user.id)
    await setAuthCookie(token)
    
    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        phone: result.user.phone
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
