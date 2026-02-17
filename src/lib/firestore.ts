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
import { getFirebaseDb } from './firebase';

// Helper para obter db
const getDb = () => getFirebaseDb();

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
  
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
  const docRef = doc(db, 'students', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getStudent(id);
}

export async function deleteStudent(id: string) {
  const db = getDb();
  await deleteDoc(doc(db, 'students', id));
}

// ============== TEACHERS ==============
export async function getTeachers() {
  const db = getDb();
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Teacher[];
}

export async function getTeacher(id: string) {
  const db = getDb();
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
  const db = getDb();
  await setDoc(doc(db, 'users', data.uid), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return { id: data.uid, ...data };
}

export async function deleteTeacher(id: string) {
  const db = getDb();
  await deleteDoc(doc(db, 'users', id));
}

// ============== LESSONS ==============
export async function getLessons(teacherId?: string) {
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
  const docRef = doc(db, 'lessons', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getLesson(id);
}

export async function deleteLesson(id: string) {
  const db = getDb();
  await deleteDoc(doc(db, 'lessons', id));
}

// ============== PAYMENTS ==============
export async function getPayments(teacherId?: string) {
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
  const docRef = await addDoc(collection(db, 'payments'), {
    ...data,
    status: data.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

export async function updatePayment(id: string, data: Partial<Payment>) {
  const db = getDb();
  const docRef = doc(db, 'payments', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getPayment(id);
}

export async function deletePayment(id: string) {
  const db = getDb();
  await deleteDoc(doc(db, 'payments', id));
}

// ============== TEACHER PAYMENTS ==============
export async function getTeacherPayments(teacherId?: string) {
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
  const docRef = await addDoc(collection(db, 'teacher_payments'), {
    ...data,
    status: data.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

export async function updateTeacherPayment(id: string, data: Partial<TeacherPayment>) {
  const db = getDb();
  const docRef = doc(db, 'teacher_payments', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return getTeacherPayment(id);
}

export async function deleteTeacherPayment(id: string) {
  const db = getDb();
  await deleteDoc(doc(db, 'teacher_payments', id));
}

// ============== CYCLE MANAGEMENT ==============

/**
 * Verifica e gerencia o ciclo de aulas de um aluno.
 * 
 * REGRA DE NEGÓCIO:
 * 1. Buscar todas as aulas do aluno ordenadas por data
 * 2. Identificar o último marcador de fim de ciclo
 * 3. Contar aulas concluídas APÓS o último marcador (ou desde o início se não houver)
 * 4. Se atingiu o total contratado, criar novo marcador automaticamente
 * 5. Repetir até que todas as aulas estejam em ciclos corretos
 * 
 * @param studentId - ID do aluno
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
      completedLessons: 0, 
      contractedLessons: 0, 
      markerCreated: false 
    };
  }

  // Buscar TODAS as aulas do aluno ordenadas por data
  const db = getDb();
  const lessonsRef = collection(db, 'lessons');
  const q = query(
    lessonsRef,
    where('studentId', '==', studentId),
    where('teacherId', '==', teacherId)
  );
  const snapshot = await getDocs(q);
  
  // Separar e ordenar aulas por data
  const allLessons = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = new Date(a.date + ' ' + (a.startTime || '00:00'));
      const dateB = new Date(b.date + ' ' + (b.startTime || '00:00'));
      return dateA.getTime() - dateB.getTime();
    });

  // Encontrar o último marcador de fim de ciclo
  const cycleMarkers = allLessons.filter((l: any) => l.endOfCycle === true);
  const lastMarker = cycleMarkers.length > 0 ? cycleMarkers[cycleMarkers.length - 1] : null;
  const lastMarkerDate = lastMarker ? lastMarker.date : null;

  // Contar aulas concluídas APÓS o último marcador (novo ciclo atual)
  let completedInCurrentCycle = 0;
  const lessonsAfterLastMarker: any[] = [];
  
  for (const lesson of allLessons) {
    // Pular o próprio marcador
    if (lesson.endOfCycle === true) continue;
    
    // Se há marcador anterior, só contar aulas após ele
    if (lastMarkerDate && lesson.date <= lastMarkerDate) continue;
    
    lessonsAfterLastMarker.push(lesson);
    
    // Contar apenas aulas concluídas
    if (lesson.status === 'completed') {
      completedInCurrentCycle++;
    }
  }

  // Verificar se já existe marcador para o ciclo atual
  // (se já bateu o total, o marcador já foi criado)
  const contractedLessons = student.contractedLessons;
  const needsNewMarker = completedInCurrentCycle >= contractedLessons;
  const hasCurrentCycleMarker = lastMarker && cycleMarkers.length > 0 && 
    completedInCurrentCycle < contractedLessons;

  // Se atingiu o total e não tem marcador ainda para este ciclo
  if (needsNewMarker && !hasCurrentCycleMarker) {
    // Verificar se já não existe marcador criado recentemente
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Criar marcador de fim de ciclo
    const markerData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> = {
      date: todayStr,
      startTime: null,
      studentId: studentId,
      studentName: student.name,
      subject: student.subject || null,
      contentCovered: `🎯 FIM DO CICLO DE AULAS - ${contractedLessons} de ${contractedLessons} aulas concluídas`,
      status: 'cycle_end',
      endOfCycle: true,
      teacherId: teacherId,
    };
    
    await addDoc(collection(db, 'lessons'), {
      ...markerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Atualizar aluno
    await updateStudent(studentId, { 
      endOfCycle: true,
      completedLessonsInCycle: 0 // Reset para novo ciclo
    });

    return {
      cycleCompleted: true,
      completedLessons: contractedLessons,
      contractedLessons: contractedLessons,
      markerCreated: true
    };
  }

  // Atualizar contador do aluno com o valor atual
  await updateStudent(studentId, { 
    completedLessonsInCycle: completedInCurrentCycle,
    endOfCycle: false
  });

  return {
    cycleCompleted: false,
    completedLessons: completedInCurrentCycle,
    contractedLessons: contractedLessons,
    markerCreated: false
  };
}

/**
 * Função auxiliar para recalcular todos os ciclos de um aluno
 * Útil para correção de dados ou migração
 */
export async function recalculateAllCycles(
  studentId: string,
  teacherId: string
): Promise<void> {
  const student = await getStudent(studentId);
  if (!student || !student.contractedLessons) return;

  const db = getDb();
  const lessonsRef = collection(db, 'lessons');
  const q = query(
    lessonsRef,
    where('studentId', '==', studentId),
    where('teacherId', '==', teacherId)
  );
  const snapshot = await getDocs(q);
  
  // Ordenar por data
  const allLessons = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = new Date(a.date + ' ' + (a.startTime || '00:00'));
      const dateB = new Date(b.date + ' ' + (b.startTime || '00:00'));
      return dateA.getTime() - dateB.getTime();
    });

  // Remover marcadores antigos
  for (const lesson of allLessons) {
    if (lesson.endOfCycle === true) {
      await deleteDoc(doc(db, 'lessons', lesson.id));
    }
  }

  // Recontar e criar marcadores necessários
  let completedCount = 0;
  const contractedLessons = student.contractedLessons;
  
  for (const lesson of allLessons) {
    if (lesson.endOfCycle === true) continue;
    
    if (lesson.status === 'completed') {
      completedCount++;
      
      // Se atingiu o total, criar marcador
      if (completedCount === contractedLessons) {
        const markerData = {
          date: lesson.date,
          startTime: null,
          studentId: studentId,
          studentName: student.name,
          subject: student.subject || null,
          contentCovered: `🎯 FIM DO CICLO DE AULAS - ${completedCount} de ${contractedLessons} aulas concluídas`,
          status: 'cycle_end',
          endOfCycle: true,
          teacherId: teacherId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await addDoc(collection(db, 'lessons'), markerData);
        completedCount = 0; // Reset para próximo ciclo
      }
    }
  }
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

/**
 * Refresh global: Recalcula ciclos de TODOS os alunos de um professor
 * Deve ser chamado ao fazer login no sistema
 */
export async function refreshAllCyclesForTeacher(teacherId: string): Promise<void> {
  console.log('=== Refreshing cycles for teacher:', teacherId);
  
  // Buscar todos os alunos do professor
  const students = await getStudents(teacherId);
  console.log('Students found:', students.length);
  
  for (const student of students) {
    // Só processar alunos com aulas contratadas definidas
    if (student.contractedLessons && student.contractedLessons > 0) {
      console.log(`Processing student: ${student.name} (${student.contractedLessons} contracted lessons)`);
      await recalculateAllCycles(student.id!, teacherId);
    }
  }
  
  console.log('=== Cycle refresh complete ===');
}

// ============== TWILIO CONFIG ==============
export interface TwilioConfig {
  id?: string;
  teacherId: string;
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Número do Twilio (formato: whatsapp:+14155238886)
  reminderDays: number; // Dias antes do vencimento para enviar lembrete
  reminderMessage: string; // Mensagem personalizada
  enabled: boolean;
  // Novos campos para envio automático
  autoSendEnabled: boolean; // Habilita envio automático
  autoSendTime: string; // Horário do envio (formato: HH:mm, ex: "09:00")
  autoSendBeforeDue: number; // Dias antes do vencimento para enviar (0 = no dia)
  timezone: string; // Fuso horário (ex: "America/Sao_Paulo")
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getTwilioConfig(teacherId: string): Promise<TwilioConfig | null> {
  const db = getDb();
  const docRef = doc(db, 'twilio_config', teacherId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
  } as TwilioConfig;
}

export async function saveTwilioConfig(data: Omit<TwilioConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<TwilioConfig> {
  const db = getDb();
  const docRef = doc(db, 'twilio_config', data.teacherId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  
  return {
    id: data.teacherId,
    ...data,
  } as TwilioConfig;
}

export async function deleteTwilioConfig(teacherId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'twilio_config', teacherId));
}

// ============== WHATSAPP REMINDER LOGS ==============
export interface WhatsAppReminderLog {
  id?: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  phone: string;
  amount: number;
  dueDate: number;
  sentAt: Date;
  status: 'sent' | 'failed';
  errorMessage?: string;
  messageId?: string;
  referenceMonth: string; // yyyy-MM do mês de referência
}

// Registrar envio de lembrete
export async function logWhatsAppReminder(data: Omit<WhatsAppReminderLog, 'id' | 'sentAt'>): Promise<void> {
  const db = getDb();
  await addDoc(collection(db, 'whatsapp_reminder_logs'), {
    ...data,
    sentAt: serverTimestamp(),
  });
}

// Verificar se já enviou lembrete para o aluno no mês
export async function hasReminderBeenSent(
  teacherId: string, 
  studentId: string, 
  referenceMonth: string
): Promise<boolean> {
  const db = getDb();
  const logsRef = collection(db, 'whatsapp_reminder_logs');
  const q = query(
    logsRef,
    where('teacherId', '==', teacherId),
    where('studentId', '==', studentId),
    where('referenceMonth', '==', referenceMonth)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Buscar logs de lembretes do professor
export async function getWhatsAppReminderLogs(
  teacherId: string, 
  limit: number = 50
): Promise<WhatsAppReminderLog[]> {
  const db = getDb();
  const logsRef = collection(db, 'whatsapp_reminder_logs');
  const q = query(
    logsRef,
    where('teacherId', '==', teacherId),
    // Ordenação e limite precisam de índice no Firestore
  );
  const snapshot = await getDocs(q);
  
  const logs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    sentAt: doc.data().sentAt?.toDate(),
  })) as WhatsAppReminderLog[];
  
  // Ordenar por data no cliente
  return logs
    .sort((a, b) => {
      const aTime = a.sentAt?.getTime() || 0;
      const bTime = b.sentAt?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}
