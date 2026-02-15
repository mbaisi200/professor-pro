import { NextRequest, NextResponse } from 'next/server';
import { getLessons, createLesson, updateLesson, deleteLesson } from '@/lib/firestore';

// GET - List all lessons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || undefined;
    
    const lessons = await getLessons(teacherId);
    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar aulas' },
      { status: 500 }
    );
  }
}

// POST - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const lesson = await createLesson({
      date: data.date,
      startTime: data.start_time || undefined,
      studentId: data.student_id || undefined,
      studentName: data.student_name || undefined,
      subject: data.subject || undefined,
      contentCovered: data.content_covered || undefined,
      status: data.status || 'scheduled',
      attendance: data.attendance || undefined,
      endOfCycle: data.end_of_cycle || false,
      teacherId: data.teacherId || undefined,
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Erro ao criar aula' },
      { status: 500 }
    );
  }
}

// PUT - Update a lesson
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const lesson = await updateLesson(id, {
      date: updateData.date,
      startTime: updateData.start_time || undefined,
      studentId: updateData.student_id || undefined,
      studentName: updateData.student_name || undefined,
      subject: updateData.subject || undefined,
      contentCovered: updateData.content_covered || undefined,
      status: updateData.status || 'scheduled',
      attendance: updateData.attendance || undefined,
      endOfCycle: updateData.end_of_cycle || false,
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar aula' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lesson
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

    await deleteLesson(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir aula' },
      { status: 500 }
    );
  }
}
