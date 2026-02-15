import { NextRequest, NextResponse } from 'next/server';
import { getTeachers, getTeacher, deleteStudent, deleteLesson, deletePayment, deleteTeacherPayment } from '@/lib/firestore';
import { doc, setDoc, updateDoc, deleteDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

// GET - List all teachers (admin only)
export async function GET() {
  try {
    const teachers = await getTeachers();
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar professores' },
      { status: 500 }
    );
  }
}

// POST - Create a new teacher (admin only)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create user in Firebase Auth (this should be done client-side with invite)
    // Here we just create the Firestore document
    const teacherData = {
      uid: data.uid || data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      role: data.role || 'teacher',
      invited: true,
    };

    await setDoc(doc(db, 'users', teacherData.uid), {
      ...teacherData,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: teacherData.uid, ...teacherData });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Erro ao criar professor' },
      { status: 500 }
    );
  }
}

// PUT - Update a teacher (admin only)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    await updateDoc(doc(db, 'users', id), {
      name: updateData.name,
      email: updateData.email,
      phone: updateData.phone || undefined,
      invited: updateData.invited ?? true,
    });

    const teacher = await getTeacher(id);
    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar professor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a teacher (admin only)
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

    // Delete related records
    const studentsQuery = query(collection(db, 'students'), where('teacherId', '==', id));
    const lessonsQuery = query(collection(db, 'lessons'), where('teacherId', '==', id));
    const paymentsQuery = query(collection(db, 'payments'), where('teacherId', '==', id));
    const teacherPaymentsQuery = query(collection(db, 'teacher_payments'), where('teacherId', '==', id));

    const [studentsSnap, lessonsSnap, paymentsSnap, teacherPaymentsSnap] = await Promise.all([
      getDocs(studentsQuery),
      getDocs(lessonsQuery),
      getDocs(paymentsQuery),
      getDocs(teacherPaymentsQuery),
    ]);

    // Delete all related documents
    const deletePromises: Promise<void>[] = [];
    
    studentsSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
    lessonsSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
    paymentsSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
    teacherPaymentsSnap.docs.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
    
    deletePromises.push(deleteDoc(doc(db, 'users', id)));

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir professor' },
      { status: 500 }
    );
  }
}
