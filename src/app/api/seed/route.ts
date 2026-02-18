import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@proclass.com' }
    })
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin já existe',
        admin: { email: 'admin@proclass.com', password: 'admin123' }
      })
    }
    
    // Create admin user
    const hashedPassword = await hashPassword('admin123')
    
    const admin = await db.user.create({
      data: {
        email: 'admin@proclass.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
        active: true,
      }
    })
    
    // Create a sample teacher
    const teacherPassword = await hashPassword('professor123')
    
    const teacher = await db.user.create({
      data: {
        email: 'professor@proclass.com',
        password: teacherPassword,
        name: 'Professor João',
        role: 'teacher',
        phone: '+5511999999999',
        active: true,
      }
    })
    
    return NextResponse.json({ 
      message: 'Dados de seed criados com sucesso!',
      credentials: {
        admin: { email: 'admin@proclass.com', password: 'admin123' },
        teacher: { email: 'professor@proclass.com', password: 'professor123' }
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar dados de seed' },
      { status: 500 }
    )
  }
}
