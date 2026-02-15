import { NextRequest, NextResponse } from 'next/server';
import { getTeacherPayments, createTeacherPayment, updateTeacherPayment, deleteTeacherPayment } from '@/lib/firestore';

// GET - List all teacher payments (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || undefined;
    
    const teacherPayments = await getTeacherPayments(teacherId);
    return NextResponse.json(teacherPayments);
  } catch (error) {
    console.error('Error fetching teacher payments:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos de professores' },
      { status: 500 }
    );
  }
}

// POST - Create a new teacher payment (admin only)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const teacherPayment = await createTeacherPayment({
      teacherId: data.teacher_id || undefined,
      teacherName: data.teacher_name || undefined,
      amount: parseFloat(data.amount),
      paymentDate: data.payment_date || undefined,
      dueDate: data.due_date || undefined,
      status: data.status || 'pending',
      referenceMonth: data.reference_month || undefined,
      description: data.description || undefined,
    });

    return NextResponse.json(teacherPayment);
  } catch (error) {
    console.error('Error creating teacher payment:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento de professor' },
      { status: 500 }
    );
  }
}

// PUT - Update a teacher payment (admin only)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const teacherPayment = await updateTeacherPayment(id, {
      teacherId: updateData.teacher_id || undefined,
      teacherName: updateData.teacher_name || undefined,
      amount: parseFloat(updateData.amount),
      paymentDate: updateData.payment_date || undefined,
      dueDate: updateData.due_date || undefined,
      status: updateData.status || 'pending',
      referenceMonth: updateData.reference_month || undefined,
      description: updateData.description || undefined,
    });

    return NextResponse.json(teacherPayment);
  } catch (error) {
    console.error('Error updating teacher payment:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento de professor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a teacher payment (admin only)
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

    await deleteTeacherPayment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting teacher payment:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir pagamento de professor' },
      { status: 500 }
    );
  }
}
