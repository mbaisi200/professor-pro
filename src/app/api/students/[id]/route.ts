import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Get single student
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
    
    const student = await db.student.findFirst({
      where: {
        id,
        teacherId: user.id
      },
      include: {
        classes: {
          include: {
            class: true
          }
        },
        payments: {
          orderBy: { dueDate: 'desc' },
          take: 10
        }
      }
    })
    
    if (!student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }
    
    return NextResponse.json({ student })
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json({ error: 'Erro ao buscar aluno' }, { status: 500 })
  }
}

// PUT - Update student
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
    const { name, email, phone, responsibleName, responsiblePhone, notes, active } = body
    
    // Verify ownership
    const existingStudent = await db.student.findFirst({
      where: { id, teacherId: user.id }
    })
    
    if (!existingStudent) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (email !== undefined) updateData.email = email?.trim() || null
    if (phone !== undefined) updateData.phone = phone.replace(/\D/g, '')
    if (responsibleName !== undefined) updateData.responsibleName = responsibleName?.trim() || null
    if (responsiblePhone !== undefined) updateData.responsiblePhone = responsiblePhone?.replace(/\D/g, '') || null
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (active !== undefined) updateData.active = active
    
    const student = await db.student.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar aluno' }, { status: 500 })
  }
}

// DELETE - Delete student
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
    const existingStudent = await db.student.findFirst({
      where: { id, teacherId: user.id }
    })
    
    if (!existingStudent) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }
    
    await db.student.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Erro ao excluir aluno' }, { status: 500 })
  }
}
