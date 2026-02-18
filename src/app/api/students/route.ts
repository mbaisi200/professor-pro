import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - List students
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    
    const where = {
      teacherId: user.id,
      ...(activeOnly && { active: true })
    }
    
    const students = await db.student.findMany({
      where,
      include: {
        classes: {
          include: {
            class: true
          }
        },
        _count: {
          select: { payments: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ students })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Erro ao buscar alunos' }, { status: 500 })
  }
}

// POST - Create student
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, email, phone, responsibleName, responsiblePhone, notes } = body
    
    if (!name || !phone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
    }
    
    // NO uppercase requirement - accept any case
    const student = await db.student.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone.replace(/\D/g, ''),
        responsibleName: responsibleName?.trim() || null,
        responsiblePhone: responsiblePhone?.replace(/\D/g, '') || null,
        notes: notes?.trim() || null,
        teacherId: user.id
      }
    })
    
    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'Erro ao criar aluno' }, { status: 500 })
  }
}
