import { NextRequest, NextResponse } from 'next/server';
import { getStudents, createStudent, updateStudent, deleteStudent } from '@/lib/firestore';

// GET - List all students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || undefined;
    
    const students = await getStudents(teacherId);
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alunos' },
      { status: 500 }
    );
  }
}

// POST - Create a new student
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const student = await createStudent({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      guardianName: data.guardian_name || undefined,
      guardianPhone: data.guardian_phone || undefined,
      subject: data.subject || undefined,
      turma: data.turma || undefined,
      monthlyFee: data.monthly_fee ? parseFloat(data.monthly_fee) : undefined,
      paymentDay: data.payment_day ? parseInt(data.payment_day) : undefined,
      chargeFee: data.charge_fee !== false,
      status: data.status || 'active',
      contractedLessons: data.contracted_lessons ? parseInt(data.contracted_lessons) : undefined,
      cycleStartDate: data.cycle_start_date || undefined,
      startDate: data.start_date || undefined,
      notes: data.notes || undefined,
      teacherId: data.teacherId || undefined,
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Erro ao criar aluno' },
      { status: 500 }
    );
  }
}

// PUT - Update a student
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const student = await updateStudent(id, {
      name: updateData.name,
      email: updateData.email || undefined,
      phone: updateData.phone || undefined,
      guardianName: updateData.guardian_name || undefined,
      guardianPhone: updateData.guardian_phone || undefined,
      subject: updateData.subject || undefined,
      turma: updateData.turma || undefined,
      monthlyFee: updateData.monthly_fee ? parseFloat(updateData.monthly_fee) : undefined,
      paymentDay: updateData.payment_day ? parseInt(updateData.payment_day) : undefined,
      chargeFee: updateData.charge_fee !== false,
      status: updateData.status || 'active',
      contractedLessons: updateData.contracted_lessons ? parseInt(updateData.contracted_lessons) : undefined,
      completedLessonsInCycle: updateData.completed_lessons_in_cycle || 0,
      cycleStartDate: updateData.cycle_start_date || undefined,
      startDate: updateData.start_date || undefined,
      notes: updateData.notes || undefined,
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar aluno' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a student
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

    await deleteStudent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir aluno' },
      { status: 500 }
    );
  }
}
