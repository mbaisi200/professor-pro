'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Trash2,
  X,
  Calendar,
  BookOpen,
  Check,
  Flag,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, COLLECTIONS } from '@/lib/firestore-helpers';
import { checkAndManageLessonCycle } from '@/lib/firestore';

interface Lesson {
  id: string;
  date: string;
  startTime: string | null;
  studentId: string | null;
  studentName: string | null;
  subject: string | null;
  contentCovered: string | null;
  status: string;
  endOfCycle: boolean;
  teacherId?: string | null;
}

interface Student {
  id: string;
  name: string;
  subject: string | null;
  status: string;
  teacherId?: string | null;
}

// Status colors
const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-rose-500',
  rescheduled: 'bg-amber-500',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  rescheduled: 'Remarcada',
};

// Lesson Form Modal
function LessonForm({
  lesson,
  students,
  selectedDate,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}: {
  lesson: Lesson | null;
  students: Student[];
  selectedDate: Date | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [form, setForm] = useState({
    date: lesson?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    startTime: lesson?.startTime || '',
    studentId: lesson?.studentId || '',
    studentName: lesson?.studentName || '',
    subject: lesson?.subject || '',
    contentCovered: lesson?.contentCovered || '',
    status: lesson?.status || 'scheduled',
  });

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setForm({
      ...form,
      studentId: studentId,
      studentName: student?.name || '',
      subject: student?.subject || form.subject,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`rounded-2xl w-full max-w-md ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        } shadow-2xl`}
      >
        <div
          className={`border-b p-5 flex items-center justify-between ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {lesson ? 'Editar Aula' : 'Nova Aula'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-600'}`} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Data *
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Horário
              </label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Aluno
            </label>
            <select
              value={form.studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
            >
              <option value="">Selecione um aluno</option>
              {students
                .filter((s) => s.status === 'active')
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                .map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Matéria
            </label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Ex: Matemática"
              className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
            >
              <option value="scheduled">Agendada</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
              <option value="rescheduled">Remarcada</option>
            </select>
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Conteúdo Abordado
            </label>
            <textarea
              value={form.contentCovered}
              onChange={(e) => setForm({ ...form, contentCovered: e.target.value })}
              placeholder="O que foi ensinado na aula..."
              rows={3}
              className={`w-full mt-1 px-3 py-2 rounded-lg border resize-none ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Lesson Detail Modal
function LessonDetail({
  lesson,
  onEdit,
  onDelete,
  onStatusChange,
  onClose,
  darkMode,
}: {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onClose: () => void;
  darkMode: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`rounded-2xl w-full max-w-sm ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        } shadow-2xl overflow-hidden`}
      >
        {/* Header with status color */}
        <div className={`${statusColors[lesson.status]} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              {lesson.endOfCycle ? (
                <Flag className="w-6 h-6" />
              ) : (
                <BookOpen className="w-6 h-6" />
              )}
              <div>
                <h3 className="font-bold text-lg">
                  {lesson.endOfCycle ? 'Fim do Ciclo' : lesson.studentName || 'Aula'}
                </h3>
                <p className="text-sm text-white/80">
                  {lesson.endOfCycle ? 'Marcador' : statusLabels[lesson.status]}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
              {format(parseISO(lesson.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          
          {lesson.startTime && (
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                {lesson.startTime}
              </span>
            </div>
          )}

          {lesson.subject && !lesson.endOfCycle && (
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <strong>Matéria:</strong> {lesson.subject}
              </p>
            </div>
          )}

          {lesson.contentCovered && !lesson.endOfCycle && (
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <strong>Conteúdo:</strong> {lesson.contentCovered}
              </p>
            </div>
          )}

          {/* Quick Status Change */}
          {!lesson.endOfCycle && (
            <div className={`pt-2 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <p className={`text-xs mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Alterar status rapidamente:
              </p>
              <div className="flex gap-2">
                {lesson.status !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange('completed')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4 mr-1" /> Concluída
                  </Button>
                )}
                {lesson.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange('cancelled')}
                    className="flex-1 text-rose-600 border-rose-300 hover:bg-rose-50"
                  >
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!lesson.endOfCycle && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" /> Editar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onDelete}
              className={`flex-1 ${lesson.endOfCycle ? 'w-full' : ''} text-rose-600 border-rose-300 hover:bg-rose-50`}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LessonsPage() {
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { user, loading, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && userData?.id) {
      fetchData();
    }
  }, [user, loading, router, userData]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lessonsData, studentsData] = await Promise.all([
        firestoreService.getAll<Lesson>(COLLECTIONS.LESSONS),
        firestoreService.getAll<Student>(COLLECTIONS.STUDENTS),
      ]);

      if (userData?.id) {
        setLessons(lessonsData.filter(l => l.teacherId === userData.id));
        setStudents(studentsData.filter(s => s.teacherId === userData.id));
      } else {
        setLessons([]);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const lessonData = {
        date: data.date,
        startTime: data.startTime || null,
        studentId: data.studentId || null,
        studentName: data.studentName ? data.studentName.toUpperCase() : null,
        subject: data.subject ? data.subject.toUpperCase() : null,
        contentCovered: data.contentCovered ? data.contentCovered.toUpperCase() : null,
        status: data.status,
        endOfCycle: false,
        teacherId: userData?.id || null,
      };

      if (editingLesson) {
        const previousStatus = editingLesson.status;
        await firestoreService.update(COLLECTIONS.LESSONS, editingLesson.id, lessonData);

        if (data.studentId && data.status !== previousStatus) {
          const cycleResult = await checkAndManageLessonCycle(
            data.studentId,
            data.status,
            previousStatus,
            userData?.id || ''
          );

          if (cycleResult.markerCreated) {
            toast({
              title: '🎯 Ciclo Completo!',
              description: `${cycleResult.completedLessons} de ${cycleResult.contractedLessons} aulas concluídas.`
            });
          }
        }

        toast({ title: 'Aula atualizada!' });
      } else {
        await firestoreService.create(COLLECTIONS.LESSONS, lessonData);

        if (data.studentId && data.status === 'completed') {
          const cycleResult = await checkAndManageLessonCycle(
            data.studentId,
            data.status,
            null,
            userData?.id || ''
          );

          if (cycleResult.markerCreated) {
            toast({
              title: '🎯 Ciclo Completo!',
              description: `${cycleResult.completedLessons} de ${cycleResult.contractedLessons} aulas concluídas.`
            });
          }
        }

        toast({ title: 'Aula agendada!' });
      }

      // Invalidar cache para atualizar outras páginas
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      
      setShowForm(false);
      setEditingLesson(null);
      setSelectedDate(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar aula', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm('Deseja realmente excluir esta aula?')) return;
    
    try {
      await firestoreService.delete(COLLECTIONS.LESSONS, lesson.id);
      toast({ title: 'Aula excluída!' });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setShowDetail(false);
      setSelectedLesson(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao excluir aula', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (lesson: Lesson, newStatus: string) => {
    try {
      const previousStatus = lesson.status;
      await firestoreService.update(COLLECTIONS.LESSONS, lesson.id, { status: newStatus });

      if (lesson.studentId && newStatus !== previousStatus) {
        const cycleResult = await checkAndManageLessonCycle(
          lesson.studentId,
          newStatus,
          previousStatus,
          userData?.id || ''
        );

        if (cycleResult.markerCreated) {
          toast({
            title: '🎯 Ciclo Completo!',
            description: `${cycleResult.completedLessons} de ${cycleResult.contractedLessons} aulas concluídas.`
          });
        }
      }

      toast({ title: 'Status atualizado!' });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setShowDetail(false);
      setSelectedLesson(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group lessons by date
  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    lessons.forEach(lesson => {
      if (!grouped[lesson.date]) {
        grouped[lesson.date] = [];
      }
      grouped[lesson.date].push(lesson);
    });
    // Sort lessons by start time within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });
    return grouped;
  }, [lessons]);

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const handleDayClick = (day: Date) => {
    // Abrir formulário para criar nova aula nesta data
    setSelectedDate(day);
    setEditingLesson(null);
    setShowForm(true);
  };

  const handleLessonClick = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLesson(lesson);
    setShowDetail(true);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
          >
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Calendário de Aulas
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {lessons.length} aulas agendadas
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedDate(new Date());
                setEditingLesson(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Aula
            </Button>
          </motion.div>

          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl shadow-lg overflow-hidden ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            {/* Month Navigation */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className={darkMode ? 'text-white hover:bg-slate-700' : ''}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                  className={darkMode ? 'border-slate-600 text-white' : ''}
                >
                  Hoje
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className={darkMode ? 'text-white hover:bg-slate-700' : ''}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Week Days Header */}
            <div className={`grid grid-cols-7 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              {weekDays.map((day) => (
                <div
                  key={day}
                  className={`p-3 text-center text-sm font-semibold ${
                    darkMode ? 'text-slate-400 bg-slate-800/50' : 'text-slate-600 bg-slate-50'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayLessons = lessonsByDate[dateStr] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[100px] sm:min-h-[120px] border-r border-b cursor-pointer transition-colors ${
                      darkMode
                        ? 'border-slate-700 hover:bg-slate-700/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    } ${!isCurrentMonth && (darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50')}`}
                  >
                    {/* Day Number */}
                    <div className="p-2">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                          isCurrentDay
                            ? 'bg-blue-600 text-white'
                            : isCurrentMonth
                            ? darkMode
                              ? 'text-slate-200'
                              : 'text-slate-700'
                            : darkMode
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Lessons */}
                    <div className="px-1 pb-1 space-y-1">
                      {dayLessons.slice(0, 3).map((lesson) => (
                        <div
                          key={lesson.id}
                          onClick={(e) => handleLessonClick(lesson, e)}
                          className={`text-xs p-1.5 rounded truncate cursor-pointer transition-all hover:scale-[1.02] ${
                            lesson.endOfCycle
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : `${statusColors[lesson.status]} text-white`
                          }`}
                        >
                          {lesson.endOfCycle ? (
                            <span className="flex items-center gap-1">
                              <Flag className="w-3 h-3" /> Fim do Ciclo
                            </span>
                          ) : (
                            <>
                              {lesson.startTime && (
                                <span className="font-medium">{lesson.startTime}</span>
                              )}{' '}
                              {lesson.studentName || 'Aula'}
                            </>
                          )}
                        </div>
                      ))}
                      {dayLessons.length > 3 && (
                        <div className={`text-xs p-1 text-center ${
                          darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          +{dayLessons.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Legend */}
          <div className={`mt-4 flex flex-wrap gap-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-sm">Agendada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span className="text-sm">Concluída</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-rose-500"></div>
              <span className="text-sm">Cancelada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span className="text-sm">Remarcada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></div>
              <span className="text-sm">Fim do Ciclo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <LessonForm
            lesson={editingLesson}
            students={students}
            selectedDate={selectedDate}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingLesson(null);
              setSelectedDate(null);
            }}
            isLoading={isSaving}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedLesson && (
          <LessonDetail
            lesson={selectedLesson}
            onEdit={() => {
              setShowDetail(false);
              setEditingLesson(selectedLesson);
              setShowForm(true);
            }}
            onDelete={() => handleDelete(selectedLesson)}
            onStatusChange={(status) => handleStatusChange(selectedLesson, status)}
            onClose={() => {
              setShowDetail(false);
              setSelectedLesson(null);
            }}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
