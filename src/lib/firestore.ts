import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Student {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  subject?: string;
  turma?: string;
  monthlyFee?: number;
  paymentDay?: number;
  chargeFee?: boolean;
  status?: string;
  contractedLessons?: number;
  completedLessonsInCycle?: number;
  cycleStartDate?: string;
  startDate?: string;
  notes?: string;
  teacherId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Teacher {
  id?: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher';
  invited?: boolean;
  status?: string;
  expiresAt?: string;
  isExempt?: boolean;
  createdAt?: Date;
}

export interface Lesson {
  id?: string;
  date: string;
  startTime?: string;
  studentId?: string;
  studentName?: string;
  subject?: string;
  contentCovered?: string;
  status?: string;
  attendance?: string;
  endOfCycle?: boolean;
  teacherId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Payment {
  id?: string;
  studentName?: string;
  studentId?: string;
  amount: number;
  paymentDate?: string;
  dueDate?: string;
  status?: string;
  referenceMonth?: string;
  teacherId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeacherPayment {
  id?: string;
  teacherId?: string;
  teacherName?: string;
  amount: number;
  paymentDate?: string;
  dueDate?: string;
  status?: string;
  referenceMonth?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============== STUDENTS ==============
export async function getStudents(teacherId?: string) {
  console.log('=== getStudents chamado ===');
  console.log('teacherId parametro:', teacherId);
  
  const studentsRef = collection(db, 'students');
  const q = teacherId 
    ? query(studentsRef, where('teacherId', '==', teacherId))
    : studentsRef;
  
  console.log('Query vai filtrar?', teacherId ? 'SIM' : 'NAO');
  
  const snapshot = await getDocs(q);
  const students = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Student[];
  
  console.log('Alunos retornados:', students.length);
  students.forEach(s => console.log(`- ${s.name}: teacherId=${s.teacherId}`));
  
  return students;
}

export async function getStudent(id: string) {
  const docRef = doc(db, 'students', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
  } as Student;
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'students'), {
    ...data,
    status: data.status || 'active',
    chargeFee: data.chargeFee ?? true,
    completedLessonsInCycle: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

export async function updateStudent(id: string, data: Partial<Student>) {
  const docRef = doc(db, 'students', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getStudent(id);
}

export async function deleteStudent(id: string) {
  await deleteDoc(doc(db, 'students', id));
}

// ============== TEACHERS ==============
export async function getTeachers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Teacher[];
}

export async function getTeacher(id: string) {
  const docRef = doc(db, 'users', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
  } as Teacher;
}

export async function createTeacher(data: Omit<Teacher, 'id' | 'createdAt'>) {
  await setDoc(doc(db, 'users', data.uid), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return { id: data.uid, ...data };
}

export async function deleteTeacher(id: string) {
  await deleteDoc(doc(db, 'users', id));
}

// ============== LESSONS ==============
export async function getLessons(teacherId?: string) {
  const lessonsRef = collection(db, 'lessons');
  const q = teacherId 
    ? query(lessonsRef, where('teacherId', '==', teacherId))
    : lessonsRef;
  
  const snapshot = await getDocs(q);
  const lessons = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Lesson[];
  
  // Sort by date descending on client side
  return lessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getLesson(id: string) {
  const docRef = doc(db, 'lessons', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
  } as Lesson;
}

export async function createLesson(data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'lessons'), {
    ...data,
    status: data.status || 'scheduled',
    endOfCycle: data.endOfCycle ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

export async function updateLesson(id: string, data: Partial<Lesson>) {
  const docRef = doc(db, 'lessons', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getLesson(id);
}

export async function deleteLesson(id: string) {
  await deleteDoc(doc(db, 'lessons', id));
}

// ============== PAYMENTS ==============
export async function getPayments(teacherId?: string) {
  const paymentsRef = collection(db, 'payments');
  const q = teacherId 
    ? query(paymentsRef, where('teacherId', '==', teacherId))
    : paymentsRef;
  
  const snapshot = await getDocs(q);
  const payments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Payment[];
  
  // Sort by createdAt descending on client side
  return payments.sort((a, b) => {
    const aTime = a.createdAt?.getTime() || 0;
    const bTime = b.createdAt?.getTime() || 0;
    return bTime - aTime;
  });
}

export async function getPayment(id: string) {
  const docRef = doc(db, 'payments', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
  } as Payment;
}

export async function createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'payments'), {
    ...data,
    status: data.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

export async function updatePayment(id: string, data: Partial<Payment>) {
  const docRef = doc(db, 'payments', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getPayment(id);
}

export async function deletePayment(id: string) {
  await deleteDoc(doc(db, 'payments', id));
}

// ============== TEACHER PAYMENTS ==============
export async function getTeacherPayments(teacherId?: string) {
  const paymentsRef = collection(db, 'teacher_payments');
  const q = teacherId 
    ? query(paymentsRef, where('teacherId', '==', teacherId))
    : paymentsRef;
  
  const snapshot = await getDocs(q);
  const payments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as TeacherPayment[];
  
  // Sort by createdAt descending on client side
  return payments.sort((a, b) => {
    const aTime = a.createdAt?.getTime() || 0;
    const bTime = b.createdAt?.getTime() || 0;
    return bTime - aTime;
  });
}

export async function getTeacherPayment(id: string) {
  const docRef = doc(db, 'teacher_payments', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
  } as TeacherPayment;
}

export async function createTeacherPayment(data: Omit<TeacherPayment, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'teacher_payments'), {
    ...data,
    status: data.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

export async function updateTeacherPayment(id: string, data: Partial<TeacherPayment>) {
  const docRef = doc(db, 'teacher_payments', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getTeacherPayment(id);
}

export async function deleteTeacherPayment(id: string) {
  await deleteDoc(doc(db, 'teacher_payments', id));
}

// ============== CYCLE MANAGEMENT ==============

/**
 * Verifica e gerencia o ciclo de aulas de um aluno.
 * Deve ser chamado após criar ou atualizar uma aula.
 * 
 * REGRA: O marcador de fim de ciclo é criado APENAS quando o total de aulas
 * concluídas atinge EXATAMENTE o total contratado (igualdade, não >=).
 * 
 * @param studentId - ID do aluno
 * @param lessonStatus - Status da aula ('completed', 'scheduled', 'cancelled', etc.)
 * @param previousStatus - Status anterior da aula (se for edição)
 * @param teacherId - ID do professor
 * @returns Informações sobre o ciclo atualizado
 */
export async function checkAndManageLessonCycle(
  studentId: string,
  lessonStatus: string,
  previousStatus: string | null,
  teacherId: string
): Promise<{
  cycleCompleted: boolean;
  completedLessons: number;
  contractedLessons: number;
  markerCreated: boolean;
}> {
  // Buscar dados do aluno
  const student = await getStudent(studentId);
  if (!student) {
    return { cycleCompleted: false, completedLessons: 0, contractedLessons: 0, markerCreated: false };
  }

  // Se o aluno não tem aulas contratadas definidas, não verificar ciclo
  if (!student.contractedLessons || student.contractedLessons <= 0) {
    return { 
      cycleCompleted: false, 
      completedLessons: student.completedLessonsInCycle || 0, 
      contractedLessons: 0, 
      markerCreated: false 
    };
  }

  // Calcular contador atual baseado no status
  let completedLessonsInCycle = student.completedLessonsInCycle || 0;

  // Calcular variação no contador baseado na mudança de status
  if (lessonStatus === 'completed' && previousStatus !== 'completed') {
    // Aula foi concluída (nova ou alterada de outro status)
    completedLessonsInCycle += 1;
  } else if (lessonStatus !== 'completed' && previousStatus === 'completed') {
    // Aula deixou de ser concluída (foi cancelada, remarcada, etc.)
    completedLessonsInCycle = Math.max(0, completedLessonsInCycle - 1);
  }

  // Atualizar contador do aluno (sem resetar ainda)
  await updateStudent(studentId, { 
    completedLessonsInCycle,
    endOfCycle: false
  });

  // Obter mês atual para verificação
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // formato: "2024-01"

  // Verificar se já existe marcador de ciclo para este aluno NO MÊS ATUAL
  const lessonsRef = collection(db, 'lessons');
  const q = query(
    lessonsRef, 
    where('studentId', '==', studentId),
    where('endOfCycle', '==', true)
  );
  const existingMarkers = await getDocs(q);
  
  // Filtrar marcadores do mês atual
  const currentMonthMarkers = existingMarkers.docs.filter(doc => {
    const markerData = doc.data();
    const markerMonth = markerData.date?.slice(0, 7); // extrai "YYYY-MM" da data
    return markerMonth === currentMonth;
  });

  // Se já existe marcador neste mês, não criar outro
  if (currentMonthMarkers.length > 0) {
    return {
      cycleCompleted: true,
      completedLessons: completedLessonsInCycle,
      contractedLessons: student.contractedLessons,
      markerCreated: false // Já existe marcador neste mês
    };
  }

  // REGRA: Criar marcador APENAS na EXATA igualdade
  // Se já passou do limite, o momento exato já passou e não criamos o marcador
  if (completedLessonsInCycle === student.contractedLessons) {
    // Criar um NOVO registro de marcador de final de ciclo (não altera a aula existente)
    const markerData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> = {
      date: today.toISOString().split('T')[0],
      startTime: null,
      studentId: studentId,
      studentName: student.name,
      subject: student.subject || null,
      contentCovered: `🎯 FIM DO CICLO DE AULAS - ${completedLessonsInCycle} de ${student.contractedLessons} aulas concluídas`,
      status: 'completed',
      endOfCycle: true,
      teacherId: teacherId,
    };
    
    // Criar registro SEPARADO (não sobrescreve a aula existente)
    await addDoc(collection(db, 'lessons'), {
      ...markerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Atualizar aluno para indicar que está no final do ciclo
    // E resetar contador para iniciar novo ciclo
    await updateStudent(studentId, { 
      endOfCycle: true,
      completedLessonsInCycle: 0 // Reset para novo ciclo
    });

    return {
      cycleCompleted: true,
      completedLessons: completedLessonsInCycle,
      contractedLessons: student.contractedLessons,
      markerCreated: true
    };
  }

  // Se passou do limite mas não tinha marcador, não criar (o momento exato já passou)
  // Isso pode acontecer se o sistema falhou em criar o marcador anteriormente
  if (completedLessonsInCycle > student.contractedLessons) {
    return {
      cycleCompleted: false,
      completedLessons: completedLessonsInCycle,
      contractedLessons: student.contractedLessons,
      markerCreated: false
    };
  }

  return {
    cycleCompleted: false,
    completedLessons: completedLessonsInCycle,
    contractedLessons: student.contractedLessons,
    markerCreated: false
  };
}

/**
 * Verifica se uma aula é um marcador de final de ciclo
 */
export function isEndOfCycleMarker(lesson: Lesson): boolean {
  return lesson.endOfCycle === true;
}

/**
 * Filtra aulas removendo marcadores de ciclo (para dashboards e relatórios)
 */
export function filterRegularLessons(lessons: Lesson[]): Lesson[] {
  return lessons.filter(lesson => !lesson.endOfCycle);
}

/**
 * Retorna apenas os marcadores de ciclo
 */
export function getCycleMarkers(lessons: Lesson[]): Lesson[] {
  return lessons.filter(lesson => lesson.endOfCycle === true);
}
