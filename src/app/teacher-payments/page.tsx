'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, COLLECTIONS } from '@/lib/firestore-helpers';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TeacherPayment {
  id: string;
  teacherId: string | null;
  teacherName: string | null;
  amount: number;
  paymentDate: string | null;
  dueDate: string | null;
  status: string;
  referenceMonth: string | null;
  description: string | null;
}

interface Teacher {
  id: string;
  name: string | null;
  email: string;
}

// Teacher Payment Form Modal
function TeacherPaymentForm({
  payment,
  teachers,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}: {
  payment: TeacherPayment | null;
  teachers: Teacher[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [form, setForm] = useState({
    teacherId: payment?.teacherId || '',
    teacherName: payment?.teacherName || '',
    amount: payment?.amount || '',
    paymentDate: payment?.paymentDate || '',
    dueDate: payment?.dueDate || '',
    status: payment?.status || 'pending',
    referenceMonth: payment?.referenceMonth || format(new Date(), 'yyyy-MM'),
    description: payment?.description || '',
  });

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    setForm({
      ...form,
      teacherId: teacherId,
      teacherName: teacher?.name || '',
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
            {payment ? 'Editar Pagamento' : 'Novo Pagamento para Professor'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <span className={darkMode ? 'text-white' : ''}>✕</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Professor
            </label>
            <select
              value={form.teacherId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
            >
              <option value="">Selecione um professor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name || teacher.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Valor (R$) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="150.00"
                required
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Mês Referência
              </label>
              <Input
                type="month"
                value={form.referenceMonth}
                onChange={(e) => setForm({ ...form, referenceMonth: e.target.value })}
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Data de Vencimento
              </label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Data de Pagamento
              </label>
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
            </div>
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
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Atrasado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição do pagamento..."
              rows={2}
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

export default function TeacherPaymentsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [payments, setPayments] = useState<TeacherPayment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<TeacherPayment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && userData?.role === 'admin') {
      fetchData();
    } else if (user && userData?.role !== 'admin') {
      router.push('/');
    }
  }, [user, userData, loading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar pagamentos de professores
      const paymentsData = await firestoreService.getAll<TeacherPayment>('teacherPayments');
      setPayments(paymentsData);

      // Buscar professores
      const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const snapshot = await getDocs(teachersQuery);
      const teachersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Teacher[];
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const paymentData = {
        teacherId: data.teacherId || null,
        teacherName: data.teacherName || null,
        amount: parseFloat(data.amount),
        paymentDate: data.paymentDate || null,
        dueDate: data.dueDate || null,
        status: data.status,
        referenceMonth: data.referenceMonth || null,
        description: data.description || null,
      };

      if (editingPayment) {
        await firestoreService.update('teacherPayments', editingPayment.id, paymentData);
        toast({ title: 'Pagamento atualizado!' });
      } else {
        await firestoreService.create('teacherPayments', paymentData);
        toast({ title: 'Pagamento registrado!' });
      }

      setShowForm(false);
      setEditingPayment(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar pagamento', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este pagamento?')) return;
    try {
      await firestoreService.delete('teacherPayments', id);
      toast({ title: 'Pagamento excluído!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao excluir pagamento', variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = async (payment: TeacherPayment) => {
    try {
      await firestoreService.update('teacherPayments', payment.id, {
        status: 'paid',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
      });
      toast({ title: 'Pagamento confirmado!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao confirmar pagamento', variant: 'destructive' });
    }
  };

  const monthlyPaid = payments
    .filter((p) => p.status === 'paid' && p.paymentDate)
    .filter((p) => {
      const payDate = parseISO(p.paymentDate);
      return payDate >= monthStart && payDate <= monthEnd;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.teacherName?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-600',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Atrasado',
    cancelled: 'Cancelado',
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (userData?.role !== 'admin') {
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Pagamentos a Professores
            </h1>
            <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-5 shadow-sm border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pago no Mês</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    R$ {monthlyPaid.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`rounded-2xl p-5 shadow-sm border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>A Pagar</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    R$ {pendingPayments.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por professor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`pl-10 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-full sm:w-40 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setEditingPayment(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Pagamento
            </Button>
          </div>

          {/* Payments Table */}
          <div className={`rounded-2xl shadow-sm border overflow-hidden ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                  <tr>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      Professor
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      Valor
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      Pagamento
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      Status
                    </th>
                    <th className={`text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Receipt className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Nenhum pagamento encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment, index) => (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}
                      >
                        <td className="px-4 py-3">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {payment.teacherName || '-'}
                          </p>
                          {payment.referenceMonth && (
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              Ref: {format(parseISO(payment.referenceMonth + '-01'), 'MMMM yyyy', { locale: ptBR })}
                            </p>
                          )}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          R$ {payment.amount?.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {payment.paymentDate
                            ? format(parseISO(payment.paymentDate), 'dd/MM/yyyy')
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[payment.status]}>
                            {statusLabels[payment.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(payment.status === 'pending' || payment.status === 'overdue') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsPaid(payment)}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingPayment(payment);
                                    setShowForm(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(payment.id)}
                                  className="text-rose-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <TeacherPaymentForm
                payment={editingPayment}
                teachers={teachers}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingPayment(null);
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
