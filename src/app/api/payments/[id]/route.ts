import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT - Update payment
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
    const { amount, dueDate, paidDate, status, paymentMethod, notes, reminderSent } = body
    
    // Verify ownership
    const existingPayment = await db.payment.findFirst({
      where: { id, teacherId: user.id }
    })
    
    if (!existingPayment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null
    if (status !== undefined) updateData.status = status
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (reminderSent !== undefined) updateData.reminderSent = reminderSent
    
    const payment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        student: true,
        class: true
      }
    })
    
    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}

// DELETE - Delete payment
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
    const existingPayment = await db.payment.findFirst({
      where: { id, teacherId: user.id }
    })
    
    if (!existingPayment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }
    
    await db.payment.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete payment error:', error)
    return NextResponse.json({ error: 'Erro ao excluir pagamento' }, { status: 500 })
  }
}
