import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - List payments
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')
    const pending = searchParams.get('pending') === 'true'
    
    const where = {
      teacherId: user.id,
      ...(status && { status }),
      ...(studentId && { studentId }),
      ...(pending && {
        status: 'pending',
        dueDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      })
    }
    
    const payments = await db.payment.findMany({
      where,
      include: {
        student: true,
        class: true
      },
      orderBy: { dueDate: 'desc' }
    })
    
    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 })
  }
}

// POST - Create payment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { studentId, classId, amount, dueDate, paymentMethod, notes } = body
    
    if (!studentId || !amount || !dueDate) {
      return NextResponse.json({ error: 'Aluno, valor e data de vencimento são obrigatórios' }, { status: 400 })
    }
    
    // Verify student belongs to teacher
    const student = await db.student.findFirst({
      where: { id: studentId, teacherId: user.id }
    })
    
    if (!student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }
    
    const payment = await db.payment.create({
      data: {
        studentId,
        classId: classId || null,
        teacherId: user.id,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        paymentMethod: paymentMethod || null,
        notes: notes?.trim() || null,
        status: 'pending'
      },
      include: {
        student: true,
        class: true
      }
    })
    
    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 })
  }
}
