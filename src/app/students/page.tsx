'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Plus, Search, Users, Filter, Edit, Trash2, Phone, Mail, BookOpen, CalendarCheck, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, COLLECTIONS } from '@/lib/firestore-helpers';

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  subject: string | null;
  turma: string | null;
  monthlyFee: number | null;
  paymentDay: number | null;
  chargeFee: boolean;
  status: string;
  contractedLessons: number | null;
  completedLessonsInCycle: number;
  endOfCycle: boolean;
  startDate: string | null;
  notes: string | null;
}

// Student Form Modal
function StudentForm({
  student,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}: {
  student: Student | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    guardianName: student?.guardianName || '',
    guardianPhone: student?.guardianPhone || '',
    subject: student?.subject || '',
    turma: student?.turma || '',
    monthlyFee: student?.monthlyFee || '',
    paymentDay: student?.paymentDay || '',
    status: student?.status || 'active',
    chargeFee: student?.chargeFee !== false,
    contractedLessons: student?.contractedLessons || '',
    endOfCycle: student?.endOfCycle || false,
    startDate: student?.startDate || '',
    notes: student?.notes || '',
  });

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
        className={`rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div
          className={`sticky top-0 border-b p-5 flex items-center justify-between ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {student ? 'Editar Aluno' : 'Novo Aluno'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <span className={darkMode ? 'text-white' : ''}>✕</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Nome completo *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do aluno"
              required
              className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Telefone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Responsável
              </label>
              <Input
                value={form.guardianName}
                onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                placeholder="Nome do responsável"
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Tel. Responsável
              </label>
              <Input
                value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                placeholder="(00) 00000-0000"
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Matéria/Disciplina
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
                Turma
              </label>
              <Input
                value={form.turma}
                onChange={(e) => setForm({ ...form, turma: e.target.value })}
                placeholder="Ex: 3º A"
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600">
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Cobrar Mensalidade?
            </label>
            <input
              type="checkbox"
              checked={form.chargeFee}
              onChange={(e) => setForm({ ...form, chargeFee: e.target.checked })}
              className="w-5 h-5 rounded"
            />
          </div>

          {form.chargeFee && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mensalidade (R$) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.monthlyFee}
                  onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                  placeholder="150.00"
                  required
                  className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Dia Vencimento *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={form.paymentDay}
                  onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                  placeholder="10"
                  required
                  className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                />
              </div>
            </div>
          )}

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Status
            </label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="trial">Teste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aulas Contratadas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Aulas Contratadas/Mês
              </label>
              <Input
                type="number"
                min="0"
                value={form.contractedLessons}
                onChange={(e) => setForm({ ...form, contractedLessons: e.target.value })}
                placeholder="Ex: 8"
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Quantidade de aulas por mês
              </p>
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Final do Ciclo?
              </label>
              <Select 
                value={form.endOfCycle ? 'sim' : 'nao'} 
                onValueChange={(v) => setForm({ ...form, endOfCycle: v === 'sim' })}
              >
                <SelectTrigger className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Aluno está no final do ciclo?
              </p>
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Data de Início
            </label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Observações
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anotações sobre o aluno..."
              rows={3}
              className={`w-full mt-1 px-3 py-2 rounded-lg border resize-none ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-slate-800 hover:bg-slate-700"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function StudentsPage() {
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { user, loading, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchStudents();
    }
  }, [user, loading, router, userData]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await firestoreService.getAll<Student>(COLLECTIONS.STUDENTS);
      // Cada usuário (admin ou professor) vê apenas seus próprios alunos
      // Usar userData.id (document ID) em vez de user?.uid (Firebase Auth UID)
      if (userData?.id) {
        setStudents(data.filter(s => s.teacherId === userData.id));
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const studentData = {
        name: data.name ? data.name.toUpperCase() : null,
        email: data.email ? data.email.toLowerCase() : null,
        phone: data.phone || null,
        guardianName: data.guardianName ? data.guardianName.toUpperCase() : null,
        guardianPhone: data.guardianPhone || null,
        subject: data.subject ? data.subject.toUpperCase() : null,
        turma: data.turma ? data.turma.toUpperCase() : null,
        monthlyFee: data.monthlyFee ? parseFloat(data.monthlyFee) : null,
        paymentDay: data.paymentDay ? parseInt(data.paymentDay) : null,
        chargeFee: data.chargeFee,
        status: data.status,
        contractedLessons: data.contractedLessons ? parseInt(data.contractedLessons) : null,
        completedLessonsInCycle: editingStudent?.completedLessonsInCycle || 0,
        endOfCycle: data.endOfCycle || false,
        startDate: data.startDate || null,
        notes: data.notes || null,
        // teacherId é sempre o userData.id (cada usuário vê apenas seus dados)
        teacherId: userData?.id || null,
      };

      if (editingStudent) {
        await firestoreService.update(COLLECTIONS.STUDENTS, editingStudent.id, studentData);
        toast({ title: 'Aluno atualizado!' });
      } else {
        await firestoreService.create(COLLECTIONS.STUDENTS, studentData);
        toast({ title: 'Aluno cadastrado!' });
      }

      setShowForm(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar aluno',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este aluno?')) return;

    try {
      await firestoreService.delete(COLLECTIONS.STUDENTS, id);
      toast({ title: 'Aluno excluído!' });
      fetchStudents();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir aluno',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        (student.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (student.subject?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    trial: 'bg-blue-100 text-blue-700',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    trial: 'Teste',
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
          >
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Alunos
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {students.length} alunos cadastrados
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingStudent(null);
                setShowForm(true);
              }}
              className="bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Aluno
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou matéria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-10 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`w-full sm:w-40 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="trial">Teste</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Student Grid */}
          {filteredStudents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {search || statusFilter !== 'all' ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </h3>
              <p className={`mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {search || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece cadastrando seu primeiro aluno'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-slate-800 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Cadastrar Aluno
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredStudents.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`rounded-xl p-3 shadow-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {student.name}
                        </h3>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[student.status]}`}
                        >
                          {statusLabels[student.status]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-2">
                    {student.subject && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                          {student.subject}
                        </span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                          {student.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {student.monthlyFee && (
                    <div className="flex items-center justify-between mb-2 py-1.5 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Mensalidade
                      </span>
                      <span className={`font-bold text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        R$ {student.monthlyFee.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingStudent(student);
                        setShowForm(true);
                      }}
                      className="flex-1 h-7 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(student.id)}
                      className="h-7 px-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <StudentForm
                student={editingStudent}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingStudent(null);
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
