import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Get single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { id } = await params
    
    const classItem = await db.class.findFirst({
      where: {
        id,
        teacherId: user.id
      },
      include: {
        students: {
          include: {
            student: true
          }
        },
        payments: {
          orderBy: { dueDate: 'desc' },
          take: 10
        }
      }
    })
    
    if (!classItem) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json({ class: classItem })
  } catch (error) {
    console.error('Get class error:', error)
    return NextResponse.json({ error: 'Erro ao buscar aula' }, { status: 500 })
  }
}

// PUT - Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()
    const { title, description, dayOfWeek, startTime, endTime, price, active, studentIds } = body
    
    // Verify ownership
    const existingClass = await db.class.findFirst({
      where: { id, teacherId: user.id }
    })
    
    if (!existingClass) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (dayOfWeek !== undefined) updateData.dayOfWeek = parseInt(dayOfWeek)
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (price !== undefined) updateData.price = parseFloat(price) || 0
    if (active !== undefined) updateData.active = active
    
    // Update students if provided
    if (studentIds !== undefined) {
      // Remove existing students
      await db.classStudent.deleteMany({
        where: { classId: id }
      })
      
      // Add new students
      if (studentIds.length > 0) {
        await db.classStudent.createMany({
          data: studentIds.map((studentId: string) => ({
            classId: id,
            studentId
          }))
        })
      }
    }
    
    const updatedClass = await db.class.update({
      where: { id },
      data: updateData,
      include: {
        students: {
          include: {
            student: true
          }
        }
      }
    })
    
    return NextResponse.json({ success: true, class: updatedClass })
  } catch (error) {
    console.error('Update class error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar aula' }, { status: 500 })
  }
}

// DELETE - Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { id } = await params
    
    // Verify ownership
    const existingClass = await db.class.findFirst({
      where: { id, teacherId: user.id }
    })
    
    if (!existingClass) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
    }
    
    await db.class.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete class error:', error)
    return NextResponse.json({ error: 'Erro ao excluir aula' }, { status: 500 })
  }
}
