'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Receipt,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isPast, isToday } from 'date-fns';
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
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, COLLECTIONS } from '@/lib/firestore-helpers';

interface Payment {
  id: string;
  studentName: string | null;
  studentId: string | null;
  amount: number;
  paymentDate: string | null;
  dueDate: string | null;
  status: string;
  referenceMonth: string | null;
  teacherId?: string | null;
  createdAt?: any;
}

interface Student {
  id: string;
  name: string;
  status: string;
  teacherId?: string | null;
}

// Payment Form Modal
function PaymentForm({
  payment,
  students,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}: {
  payment: Payment | null;
  students: Student[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [form, setForm] = useState({
    studentName: payment?.studentName || '',
    studentId: payment?.studentId || '',
    amount: payment?.amount || '',
    paymentDate: payment?.paymentDate || '',
    status: payment?.status || 'pending',
    referenceMonth: payment?.referenceMonth || format(new Date(), 'yyyy-MM'),
  });

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setForm({
      ...form,
      studentId: studentId,
      studentName: student?.name || '',
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
            {payment ? 'Editar Pagamento' : 'Novo Pagamento'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <span className={darkMode ? 'text-white' : ''}>✕</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-slate-800 hover:bg-slate-700">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Sort Icon Component
function SortIcon({ field, sortField, sortDirection }: { field: string; sortField: string; sortDirection: 'asc' | 'desc' }) {
  if (sortField !== field) {
    return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
  }
  return sortDirection === 'asc' 
    ? <ArrowUp className="w-4 h-4 ml-1 text-blue-500" />
    : <ArrowDown className="w-4 h-4 ml-1 text-blue-500" />;
}

export default function FinancePage() {
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'paymentDate' | 'studentName' | 'amount' | 'status' | 'referenceMonth'>('paymentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { user, loading, userData } = useAuth();
  const router = useRouter();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

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
      const [paymentsData, studentsData] = await Promise.all([
        firestoreService.getAll<Payment>(COLLECTIONS.PAYMENTS),
        firestoreService.getAll<Student>(COLLECTIONS.STUDENTS),
      ]);

      if (userData?.id) {
        setPayments(paymentsData.filter(p => p.teacherId === userData.id));
        setStudents(studentsData.filter(s => s.teacherId === userData.id));
      } else {
        setPayments([]);
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
      const paymentData = {
        studentName: data.studentName ? data.studentName.toUpperCase() : null,
        studentId: data.studentId || null,
        amount: parseFloat(data.amount),
        paymentDate: data.paymentDate || null,
        status: data.status,
        referenceMonth: data.referenceMonth || null,
        teacherId: userData?.id || null,
      };

      if (editingPayment) {
        await firestoreService.update(COLLECTIONS.PAYMENTS, editingPayment.id, paymentData);
        toast({ title: 'Pagamento atualizado!' });
      } else {
        await firestoreService.create(COLLECTIONS.PAYMENTS, paymentData);
        toast({ title: 'Pagamento registrado!' });
      }

      // Invalidar cache para atualizar outras páginas
      queryClient.invalidateQueries({ queryKey: ['payments'] });

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
      await firestoreService.delete(COLLECTIONS.PAYMENTS, id);
      toast({ title: 'Pagamento excluído!' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao excluir pagamento', variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = async (payment: Payment) => {
    try {
      await firestoreService.update(COLLECTIONS.PAYMENTS, payment.id, {
        status: 'paid',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
      });
      toast({ title: 'Pagamento confirmado!' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao confirmar pagamento', variant: 'destructive' });
    }
  };

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'paymentDate' ? 'desc' : 'asc');
    }
  };

  // Filtered and sorted payments
  const filteredPayments = useMemo(() => {
    let result = payments.filter((p) => {
      const matchesSearch = p.studentName?.toLowerCase().includes(search.toLowerCase()) ?? false;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortField) {
        case 'paymentDate':
          // Tratar nulos - colocar no final
          if (!a.paymentDate && !b.paymentDate) return 0;
          if (!a.paymentDate) return 1;
          if (!b.paymentDate) return -1;
          valueA = new Date(a.paymentDate).getTime();
          valueB = new Date(b.paymentDate).getTime();
          break;
        case 'studentName':
          valueA = (a.studentName || '').toLowerCase();
          valueB = (b.studentName || '').toLowerCase();
          break;
        case 'amount':
          valueA = a.amount || 0;
          valueB = b.amount || 0;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'referenceMonth':
          valueA = a.referenceMonth || '';
          valueB = b.referenceMonth || '';
          break;
        default:
          valueA = 0;
          valueB = 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [payments, search, statusFilter, sortField, sortDirection]);

  const monthlyIncome = payments
    .filter((p) => p.status === 'paid' && p.paymentDate)
    .filter((p) => {
      const payDate = parseISO(p.paymentDate!);
      return payDate >= monthStart && payDate <= monthEnd;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

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

  return (
    <AppLayout>
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Financeiro
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
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receita do Mês</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    R$ {monthlyIncome.toFixed(2)}
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
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>A Receber</p>
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
                  placeholder="Buscar por aluno..."
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
              className="bg-slate-800 hover:bg-slate-700"
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
                    <th 
                      onClick={() => handleSort('studentName')}
                      className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${
                        darkMode ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center">
                        Aluno
                        <SortIcon field="studentName" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('amount')}
                      className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${
                        darkMode ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center">
                        Valor
                        <SortIcon field="amount" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('paymentDate')}
                      className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${
                        darkMode ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center">
                        Pagamento
                        <SortIcon field="paymentDate" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('referenceMonth')}
                      className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${
                        darkMode ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center">
                        Referência
                        <SortIcon field="referenceMonth" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none ${
                        darkMode ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <div className="flex items-center">
                        Status
                        <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                      </div>
                    </th>
                    <th className={`text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                      darkMode ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <Receipt className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Nenhum pagamento encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment, index) => {
                      const isOverdue =
                        payment.status === 'pending' &&
                        payment.dueDate &&
                        isPast(parseISO(payment.dueDate)) &&
                        !isToday(parseISO(payment.dueDate));
                      const displayStatus = isOverdue ? 'overdue' : payment.status;

                      return (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className={darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}
                        >
                          <td className="px-4 py-3">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                              {payment.studentName || '-'}
                            </p>
                          </td>
                          <td className={`px-4 py-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            R$ {payment.amount?.toFixed(2)}
                          </td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {payment.paymentDate
                              ? format(parseISO(payment.paymentDate), 'dd/MM/yyyy')
                              : '-'}
                          </td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {payment.referenceMonth
                              ? format(parseISO(payment.referenceMonth + '-01'), 'MMM yyyy', { locale: ptBR })
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusColors[displayStatus]}>
                              {statusLabels[displayStatus]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(payment.status === 'pending' || displayStatus === 'overdue') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(payment)}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingPayment(payment);
                                  setShowForm(true);
                                }}
                                className={darkMode ? 'text-slate-300 hover:bg-slate-600' : ''}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(payment.id)}
                                className="text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          {filteredPayments.length > 0 && (
            <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div className="flex flex-wrap gap-6 justify-center">
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    R$ {filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recebido</p>
                  <p className="text-xl font-bold text-emerald-600">
                    R$ {filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pendente</p>
                  <p className="text-xl font-bold text-amber-600">
                    R$ {filteredPayments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <PaymentForm
            payment={editingPayment}
            students={students}
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
    </AppLayout>
  );
}
