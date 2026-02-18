import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - List classes
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const dayOfWeek = searchParams.get('dayOfWeek')
    
    const where = {
      teacherId: user.id,
      ...(activeOnly && { active: true }),
      ...(dayOfWeek !== null && { dayOfWeek: parseInt(dayOfWeek) })
    }
    
    const classes = await db.class.findMany({
      where,
      include: {
        students: {
          include: {
            student: true
          }
        },
        _count: {
          select: { students: true, payments: true }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })
    
    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Get classes error:', error)
    return NextResponse.json({ error: 'Erro ao buscar aulas' }, { status: 500 })
  }
}

// POST - Create class
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { title, description, dayOfWeek, startTime, endTime, price, studentIds } = body
    
    if (!title || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Título, dia da semana, horário de início e fim são obrigatórios' }, { status: 400 })
    }
    
    // NO uppercase requirement - accept any case
    const newClass = await db.class.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        price: parseFloat(price) || 0,
        teacherId: user.id,
        ...(studentIds?.length > 0 && {
          students: {
            create: studentIds.map((studentId: string) => ({
              studentId
            }))
          }
        })
      },
      include: {
        students: {
          include: {
            student: true
          }
        }
      }
    })
    
    return NextResponse.json({ success: true, class: newClass })
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json({ error: 'Erro ao criar aula' }, { status: 500 })
  }
}
