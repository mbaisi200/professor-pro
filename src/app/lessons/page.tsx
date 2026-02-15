'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Trash2,
  Check,
  X,
  BookOpen,
  FileText,
  Download,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, isToday, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, COLLECTIONS } from '@/lib/firestore-helpers';

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

// Lesson Form Modal
function LessonForm({
  lesson,
  students,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}: {
  lesson: Lesson | null;
  students: Student[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [form, setForm] = useState({
    date: lesson?.date || format(new Date(), 'yyyy-MM-dd'),
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
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`rounded-2xl w-full max-w-lg ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div
          className={`sticky top-0 border-b p-5 flex items-center justify-between ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {lesson ? 'Editar Aula' : 'Nova Aula'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <span className={darkMode ? 'text-white' : ''}>✕</span>
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

export default function LessonsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportStudent, setReportStudent] = useState<string>('all');
  const [reportPeriod, setReportPeriod] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { user, loading, userData } = useAuth();
  const router = useRouter();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
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
      
      // Se não for admin, filtrar apenas os dados do professor logado
      if (userData?.role !== 'admin') {
        setLessons(lessonsData.filter(l => l.teacherId === user?.uid));
        setStudents(studentsData.filter(s => s.teacherId === user?.uid));
      } else {
        setLessons(lessonsData);
        setStudents(studentsData);
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
        studentName: data.studentName || null,
        subject: data.subject || null,
        contentCovered: data.contentCovered || null,
        status: data.status,
        endOfCycle: false,
        teacherId: user?.uid || null,
      };

      if (editingLesson) {
        await firestoreService.update(COLLECTIONS.LESSONS, editingLesson.id, lessonData);
        toast({ title: 'Aula atualizada!' });
      } else {
        await firestoreService.create(COLLECTIONS.LESSONS, lessonData);
        toast({ title: 'Aula agendada!' });
      }

      setShowForm(false);
      setEditingLesson(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar aula', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta aula?')) return;
    try {
      await firestoreService.delete(COLLECTIONS.LESSONS, id);
      toast({ title: 'Aula excluída!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao excluir aula', variant: 'destructive' });
    }
  };

  const handleQuickStatus = async (lesson: Lesson, newStatus: string) => {
    try {
      await firestoreService.update(COLLECTIONS.LESSONS, lesson.id, { status: newStatus });
      toast({ title: 'Status atualizado!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  // Funções de Ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-blue-500" />
      : <ArrowDown className="w-4 h-4 ml-1 text-blue-500" />;
  };

  // Funções de Relatório
  const getFilteredLessonsForReport = () => {
    let filtered = [...lessons];
    
    // Filtrar por aluno
    if (reportStudent !== 'all') {
      filtered = filtered.filter(l => l.studentId === reportStudent);
    }
    
    // Filtrar por período
    if (reportPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      switch (reportPeriod) {
        case 'current_month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'last_month':
          startDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
          endDate = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
          break;
        case 'last_3_months':
          startDate = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1));
          endDate = endOfMonth(now);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }
      
      filtered = filtered.filter(l => {
        const lessonDate = parseISO(l.date);
        return lessonDate >= startDate && lessonDate <= endDate;
      });
    }
    
    // Ordenar pelo campo selecionado
    return filtered.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortField) {
        case 'date':
          valueA = new Date(a.date).getTime();
          valueB = new Date(b.date).getTime();
          break;
        case 'startTime':
          valueA = a.startTime || '';
          valueB = b.startTime || '';
          break;
        case 'studentName':
          valueA = (a.studentName || '').toLowerCase();
          valueB = (b.studentName || '').toLowerCase();
          break;
        case 'subject':
          valueA = (a.subject || '').toLowerCase();
          valueB = (b.subject || '').toLowerCase();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = new Date(a.date).getTime();
          valueB = new Date(b.date).getTime();
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleExportPDF = () => {
    const reportData = getFilteredLessonsForReport();
    const studentName = reportStudent === 'all' 
      ? 'Todos os Alunos' 
      : students.find(s => s.id === reportStudent)?.name || 'Aluno';
    
    const periodLabel = {
      'all': 'Todo Período',
      'current_month': format(new Date(), "MMMM 'de' yyyy", { locale: ptBR }),
      'last_month': format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), "MMMM 'de' yyyy", { locale: ptBR }),
      'last_3_months': 'Últimos 3 meses',
      'current_year': `Ano de ${new Date().getFullYear()}`,
    }[reportPeriod] || 'Período';

    // Criar HTML para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Erro', description: 'Popup bloqueado. Permita popups para exportar.', variant: 'destructive' });
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Aulas - ProClass</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .header h1 { font-size: 24px; color: #1e293b; margin-bottom: 5px; }
          .header p { color: #64748b; font-size: 14px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f1f5f9; padding: 15px; border-radius: 8px; }
          .info-item { text-align: center; }
          .info-item label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
          .info-item span { font-weight: bold; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #3b82f6; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
          td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          tr:nth-child(even) { background: #f8fafc; }
          .status-completed { color: #059669; font-weight: bold; }
          .status-scheduled { color: #2563eb; font-weight: bold; }
          .status-cancelled { color: #dc2626; font-weight: bold; }
          .status-rescheduled { color: #d97706; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Relatório de Aulas</h1>
          <p>ProClass - Sistema de Gestão de Aulas</p>
        </div>
        
        <div class="info">
          <div class="info-item">
            <label>Aluno</label>
            <span>${studentName}</span>
          </div>
          <div class="info-item">
            <label>Período</label>
            <span>${periodLabel}</span>
          </div>
          <div class="info-item">
            <label>Total de Aulas</label>
            <span>${reportData.length}</span>
          </div>
          <div class="info-item">
            <label>Concluídas</label>
            <span>${reportData.filter(l => l.status === 'completed').length}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Horário</th>
              <th>Aluno</th>
              <th>Matéria</th>
              <th>Status</th>
              <th>Conteúdo</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(lesson => `
              <tr>
                <td>${format(parseISO(lesson.date), 'dd/MM/yyyy', { locale: ptBR })}</td>
                <td>${lesson.startTime || '--:--'}</td>
                <td>${lesson.studentName || '-'}</td>
                <td>${lesson.subject || '-'}</td>
                <td class="status-${lesson.status}">${statusLabels[lesson.status]}</td>
                <td>${lesson.contentCovered || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getLessonsForDay = (day: Date) => {
    return lessons
      .filter((l) => isSameDay(parseISO(l.date), day))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
    rescheduled: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendada',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    rescheduled: 'Remarcada',
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
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Aulas
                </h1>
                <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Gerencie sua agenda de aulas
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-wrap gap-3 mb-6"
          >
            <Button
              onClick={() => {
                setEditingLesson(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Aula
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReport(false)}
              className={!showReport ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
            >
              <Calendar className="w-4 h-4 mr-2" /> Calendário
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReport(true)}
              className={showReport ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
            >
              <FileText className="w-4 h-4 mr-2" /> Relatório
            </Button>
          </motion.div>

          {/* Report Panel */}
          <AnimatePresence>
            {showReport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-6 rounded-xl p-5 shadow-sm border ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                }`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Filtros do Relatório
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Filtro Aluno */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Aluno
                    </label>
                    <select
                      value={reportStudent}
                      onChange={(e) => setReportStudent(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value="all">Todos os Alunos</option>
                      {students
                        .filter(s => s.status === 'active')
                        .map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Filtro Período */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Período
                    </label>
                    <select
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value="all">Todo Período</option>
                      <option value="current_month">Mês Atual</option>
                      <option value="last_month">Mês Anterior</option>
                      <option value="last_3_months">Últimos 3 Meses</option>
                      <option value="current_year">Ano Atual</option>
                    </select>
                  </div>

                  {/* Botão Exportar */}
                  <div className="flex items-end">
                    <Button
                      onClick={handleExportPDF}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Download className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                  </div>
                </div>

                {/* Lista de Aulas do Relatório */}
                <div className="mt-6">
                  {/* Resumo */}
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4`}>
                    <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-700'}`}>
                        {getFilteredLessonsForReport().length}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-blue-600'}`}>Total</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-700' : 'bg-green-50'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-green-700'}`}>
                        {getFilteredLessonsForReport().filter(l => l.status === 'completed').length}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-green-600'}`}>Concluídas</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-700'}`}>
                        {getFilteredLessonsForReport().filter(l => l.status === 'scheduled').length}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-blue-600'}`}>Agendadas</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-700' : 'bg-red-50'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-red-700'}`}>
                        {getFilteredLessonsForReport().filter(l => l.status === 'cancelled').length}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-red-600'}`}>Canceladas</p>
                    </div>
                  </div>

                  {/* Tabela de Aulas */}
                  {getFilteredLessonsForReport().length > 0 ? (
                    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className={darkMode ? 'bg-slate-700' : 'bg-slate-100'}>
                            <tr>
                              <th 
                                onClick={() => handleSort('date')}
                                className={`text-left py-3 px-4 text-xs font-semibold uppercase cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                              >
                                <div className="flex items-center">Data{getSortIcon('date')}</div>
                              </th>
                              <th 
                                onClick={() => handleSort('startTime')}
                                className={`text-left py-3 px-4 text-xs font-semibold uppercase cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                              >
                                <div className="flex items-center">Horário{getSortIcon('startTime')}</div>
                              </th>
                              <th 
                                onClick={() => handleSort('studentName')}
                                className={`text-left py-3 px-4 text-xs font-semibold uppercase cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                              >
                                <div className="flex items-center">Aluno{getSortIcon('studentName')}</div>
                              </th>
                              <th 
                                onClick={() => handleSort('subject')}
                                className={`text-left py-3 px-4 text-xs font-semibold uppercase cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                              >
                                <div className="flex items-center">Matéria{getSortIcon('subject')}</div>
                              </th>
                              <th 
                                onClick={() => handleSort('status')}
                                className={`text-left py-3 px-4 text-xs font-semibold uppercase cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                              >
                                <div className="flex items-center">Status{getSortIcon('status')}</div>
                              </th>
                              <th className={`text-center py-3 px-4 text-xs font-semibold uppercase ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Ações</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                            {getFilteredLessonsForReport().map((lesson, index) => (
                              <motion.tr
                                key={lesson.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} transition-colors`}
                              >
                                <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {format(parseISO(lesson.date), 'dd/MM/yyyy', { locale: ptBR })}
                                </td>
                                <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {lesson.startTime || '--:--'}
                                </td>
                                <td className={`py-3 px-4 font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                  {lesson.studentName || '-'}
                                </td>
                                <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {lesson.subject || '-'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    lesson.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    lesson.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                    lesson.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {statusLabels[lesson.status]}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingLesson(lesson);
                                        setShowForm(true);
                                      }}
                                      className="h-8 px-2"
                                    >
                                      <Edit className="w-4 h-4 text-blue-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(lesson.id)}
                                      className="h-8 px-2"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-center py-12 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                      <BookOpen className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                      <p className={`text-lg font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Nenhuma aula encontrada
                      </p>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Tente ajustar os filtros
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Week Navigation and View */}
          {!showReport && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`flex items-center justify-between mb-6 rounded-xl p-4 shadow-sm border ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                }`}
              >
                <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="text-center">
                  <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {format(weekStart, 'dd MMM', { locale: ptBR })} -{' '}
                    {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
                  </p>
                  <button
                    onClick={() => setCurrentWeek(new Date())}
                    className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} hover:underline`}
                  >
                    Ir para hoje
                  </button>
                </div>

                <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Week View */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const dayLessons = getLessonsForDay(day);
              const isCurrentDay = isToday(day);

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl p-4 shadow-sm border ${
                    isCurrentDay
                      ? 'border-slate-800 ring-1 ring-slate-800'
                      : darkMode
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="text-center mb-3">
                    <p className={`text-xs uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={`text-2xl font-bold ${isCurrentDay ? 'text-slate-800' : darkMode ? 'text-white' : 'text-slate-600'}`}>
                      {format(day, 'dd')}
                    </p>
                  </div>

                  <div className="space-y-2 min-h-[100px]">
                    {dayLessons.length === 0 ? (
                      <p className={`text-xs text-center py-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Sem aulas
                      </p>
                    ) : (
                      dayLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`p-2 rounded-lg border text-xs ${statusColors[lesson.status]} relative group`}
                        >
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingLesson(lesson);
                                setShowForm(true);
                              }}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(lesson.id)}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{lesson.startTime || 'Horário'}</span>
                          </div>
                          <p className="font-medium truncate pr-12">{lesson.studentName || 'Aluno'}</p>
                          {lesson.subject && (
                            <p className="text-[10px] opacity-70 truncate">{lesson.subject}</p>
                          )}

                          {lesson.status === 'scheduled' && (
                            <div className="flex gap-1 mt-2">
                              <button
                                onClick={() => handleQuickStatus(lesson, 'completed')}
                                className="flex-1 p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                              >
                                <Check className="w-3 h-3 mx-auto" />
                              </button>
                              <button
                                onClick={() => handleQuickStatus(lesson, 'cancelled')}
                                className="flex-1 p-1 bg-rose-500 text-white rounded hover:bg-rose-600"
                              >
                                <X className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
              </div>
            </>
          )}

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <LessonForm
                lesson={editingLesson}
                students={students}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingLesson(null);
                }}
                isLoading={isSaving}
                darkMode={darkMode}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
