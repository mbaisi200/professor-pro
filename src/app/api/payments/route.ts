import { NextRequest, NextResponse } from 'next/server';
import { getPayments, createPayment, updatePayment, deletePayment } from '@/lib/firestore';

// GET - List all payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || undefined;
    
    const payments = await getPayments(teacherId);
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos' },
      { status: 500 }
    );
  }
}

// POST - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const payment = await createPayment({
      studentName: data.student_name || undefined,
      studentId: data.student_id || undefined,
      amount: parseFloat(data.amount),
      paymentDate: data.payment_date || undefined,
      dueDate: data.due_date || undefined,
      status: data.status || 'pending',
      referenceMonth: data.reference_month || undefined,
      teacherId: data.teacherId || undefined,
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}

// PUT - Update a payment
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const payment = await updatePayment(id, {
      studentName: updateData.student_name || undefined,
      studentId: updateData.student_id || undefined,
      amount: parseFloat(updateData.amount),
      paymentDate: updateData.payment_date || undefined,
      dueDate: updateData.due_date || undefined,
      status: updateData.status || 'pending',
      referenceMonth: updateData.reference_month || undefined,
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a payment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await deletePayment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir pagamento' },
      { status: 500 }
    );
  }
}
