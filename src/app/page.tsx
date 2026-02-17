'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Wallet,
  AlertCircle,
  Plus,
  Calendar,
  Loader2,
  MessageSquare,
  Send,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, addDays, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useFirestore';

// Helper para SSR-safe localStorage
function getLocalStorage(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) || defaultValue;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

// Expiration Modal
function ExpirationModal({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl w-full max-w-md p-6 text-center ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Contrato Expirado
        </h2>
        <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Seu plano expirou. Entre em contato conosco para renovar seu acesso ao ProClass.
        </p>
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>WhatsApp</p>
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                (11) 98861-1088
              </p>
            </div>
          </div>
        </div>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Entre em contato para regularizar seu plano e continuar usando o sistema.
        </p>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  darkMode,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  darkMode: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const darkColorClasses: Record<string, string> = {
    blue: 'bg-blue-900/30 text-blue-400',
    purple: 'bg-purple-900/30 text-purple-400',
    indigo: 'bg-indigo-900/30 text-indigo-400',
    green: 'bg-emerald-900/30 text-emerald-400',
    amber: 'bg-amber-900/30 text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 shadow-sm border ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {value}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {subtitle}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${darkMode ? darkColorClasses[color] : colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

// Loading Skeleton
function LoadingSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className={`h-8 w-48 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          <div className={`h-4 w-64 mt-2 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`rounded-2xl p-5 ${darkMode ? 'bg-slate-800' : 'bg-white'} animate-pulse`}>
              <div className={`h-4 w-24 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
              <div className={`h-8 w-16 mt-2 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className={`rounded-2xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} animate-pulse`}>
              <div className={`h-6 w-32 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
              <div className="mt-4 space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className={`h-16 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Student {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  monthlyFee?: number | null;
  paymentDay?: number | null;
  chargeFee?: boolean;
  status: string;
}

interface Lesson {
  id: string;
  date: string;
  startTime?: string | null;
  studentName?: string | null;
  subject?: string | null;
  status: string;
  endOfCycle?: boolean;
}

interface Payment {
  id: string;
  studentName?: string | null;
  studentId?: string | null;
  amount: number;
  paymentDate?: string | null;
  status: string;
  referenceMonth?: string | null;
}

export default function Dashboard() {
  // SSR-safe initial values usando useSyncExternalStore
  const darkModeStorage = useSyncExternalStore(
    subscribe,
    () => getLocalStorage('darkMode', 'false'),
    () => 'false'
  );
  const darkMode = JSON.parse(darkModeStorage);
  
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);

  const { user, userData, loading: authLoading, isExpired } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Calcular teacherId corretamente
  // Cada usuário (admin ou professor) vê apenas seus próprios dados
  const teacherId = useMemo(() => {
    if (!userData) return null;
    return userData.id;
  }, [userData]);
  
  // Verificar se WhatsApp está configurado
  useEffect(() => {
    if (teacherId) {
      fetch(`/api/twilio-config?teacherId=${teacherId}`)
        .then(res => res.json())
        .then(data => setWhatsappConfigured(!!data && data.enabled))
        .catch(() => setWhatsappConfigured(false));
    }
  }, [teacherId]);
  
  // Limpar cache quando o usuário mudar para evitar dados de outras sessões
  useEffect(() => {
    if (userData?.id) {
      queryClient.removeQueries({ queryKey: ['students'] });
      queryClient.removeQueries({ queryKey: ['lessons'] });
      queryClient.removeQueries({ queryKey: ['payments'] });
    }
  }, [userData?.id, queryClient]);
  
  const { students, lessons, payments, isLoading, isError, refetch } = useDashboardData(teacherId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Data atual fixa para evitar re-criação
  const today = useMemo(() => new Date(), []);
  const currentDay = today.getDate();
  const currentMonth = format(today, 'yyyy-MM');
  const formattedToday = format(today, "EEEE, dd 'de' MMMM", { locale: ptBR });

  // Se expirado, mostrar modal
  if (isExpired) {
    return (
      <ExpirationModal darkMode={darkMode} />
    );
  }

  // Aguardar carregamento do auth
  if (authLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário, não renderizar
  if (!user) {
    return null;
  }

  const monthStart = startOfMonth(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()));
  const monthEnd = endOfMonth(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()));

  // Calculations
  const activeStudents = students.filter((s) => s.status === 'active').length;

  const expectedMonthlyRevenue = students
    .filter((s) => s.status === 'active' && s.monthlyFee)
    .reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

  const upcomingLessons = lessons.filter((l) => {
    const lessonDate = new Date(l.date);
    return (
      l.status === 'scheduled' &&
      isAfter(lessonDate, addDays(today, -1)) &&
      isBefore(lessonDate, addDays(today, 7))
    );
  });

  // Receita Recebida - baseada no referenceMonth do pagamento (mês a que se refere)
  const monthlyIncome = payments
    .filter((p) => p.status === 'paid')
    .filter((p) => p.referenceMonth === selectedMonth)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Receita recebida no período (por data de pagamento)
  const incomeReceivedInPeriod = payments
    .filter((p) => p.status === 'paid' && p.paymentDate)
    .filter((p) => {
      const payDate = parseISO(p.paymentDate!);
      return payDate >= monthStart && payDate <= monthEnd;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Pagamentos pendentes do mês de referência
  const pendingPaymentsAmount = payments
    .filter((p) => (p.status === 'pending' || p.status === 'overdue'))
    .filter((p) => p.referenceMonth === selectedMonth)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Alertas de Pagamento baseados no dia de vencimento do aluno
  // REGRA: Comparar dia atual com paymentDay do cadastro do aluno
  const paymentAlerts = students
    .filter(s => s.status === 'active' && s.chargeFee !== false && s.monthlyFee && s.paymentDay)
    .filter(student => {
      // Verificar se já existe pagamento para este aluno no mês atual
      const hasPaymentThisMonth = payments.some(
        p => p.studentId === student.id && 
             p.referenceMonth === currentMonth && 
             (p.status === 'paid' || p.status === 'pending')
      );
      return !hasPaymentThisMonth;
    })
    .map(student => ({
      studentId: student.id,
      studentName: student.name,
      phone: student.phone,
      amount: student.monthlyFee!,
      dueDate: student.paymentDay!,
      // Atrasado se o dia atual já passou do dia de vencimento
      isOverdue: currentDay > student.paymentDay!,
    }))
    .sort((a, b) => {
      // Ordenar: atrasados primeiro, depois por dia de vencimento
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.dueDate - b.dueDate;
    });

  // Função para enviar lembretes para todos os pendentes
  const handleSendAllReminders = async () => {
    if (!teacherId || !whatsappConfigured) {
      router.push('/whatsapp');
      return;
    }

    const alertsComTelefone = paymentAlerts.filter(a => a.phone);
    if (alertsComTelefone.length === 0) {
      alert('Nenhum aluno com telefone cadastrado');
      return;
    }

    if (!confirm(`Enviar lembretes para ${alertsComTelefone.length} alunos?`)) {
      return;
    }

    try {
      setSendingWhatsApp(true);
      const response = await fetch('/api/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.totalSent} lembretes enviados com sucesso!\n❌ ${data.totalFailed} falhas.`);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error: any) {
      alert('Erro ao enviar lembretes: ' + error.message);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Função para enviar lembrete individual
  const handleSendSingleReminder = async (alert: typeof paymentAlerts[0]) => {
    if (!teacherId || !whatsappConfigured) {
      router.push('/whatsapp');
      return;
    }

    if (!alert.phone) {
      alert('Aluno não possui telefone cadastrado');
      return;
    }

    try {
      setSendingWhatsApp(true);
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          phone: alert.phone,
          studentName: alert.studentName,
          amount: alert.amount,
          dueDate: alert.dueDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Lembrete enviado para ${alert.studentName}!`);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error: any) {
      alert('Erro ao enviar lembrete: ' + error.message);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // A receber = total de mensalidades pendentes (baseado nos alertas)
  const pendingAmount = paymentAlerts.reduce((sum, a) => sum + a.amount, 0);

  // Aulas concluídas - IGNORA marcadores de final de ciclo
  const completedLessons = lessons
    .filter((l) => l.status === 'completed' && l.date && !l.endOfCycle)
    .filter((l) => {
      const lessonDate = parseISO(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd;
    }).length;

  // Generate month options
  const monthOptions = [];
  for (let i = -12; i <= 3; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
    });
  }

  // Show skeleton while loading data
  if (isLoading) {
    return (
      <AppLayout>
        <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
          <LoadingSkeleton darkMode={darkMode} />
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (isError) {
    return (
      <AppLayout>
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className={`text-xl font-semibold mt-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Erro ao carregar dados</h2>
            <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verifique sua conexão e tente novamente</p>
            <Button onClick={() => refetch()} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1
                  className={`text-3xl font-bold tracking-tight ${
                    darkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  Olá, Professor 👋
                </h1>
                <p className={`mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                  {formattedToday}
                </p>
              </div>
              <div className="w-64">
                <label className={`text-xs mb-1 block ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Período
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger
                    className={darkMode ? 'bg-slate-800 text-white border-slate-700' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard
              title="Alunos Ativos"
              value={activeStudents}
              subtitle={`${students.length} total`}
              icon={Users}
              color="blue"
              darkMode={darkMode}
            />
            <StatsCard
              title="Aulas Realizadas"
              value={completedLessons}
              subtitle="No período"
              icon={BookOpen}
              color="purple"
              darkMode={darkMode}
            />
            <StatsCard
              title="Receita Esperada"
              value={`R$ ${expectedMonthlyRevenue.toFixed(2)}`}
              subtitle="Mensalidades"
              icon={Wallet}
              color="indigo"
              darkMode={darkMode}
            />
            <StatsCard
              title="Receita Recebida"
              value={`R$ ${monthlyIncome.toFixed(2)}`}
              subtitle="No período"
              icon={TrendingUp}
              color="green"
              darkMode={darkMode}
            />
            <StatsCard
              title="A Receber"
              value={`R$ ${pendingAmount.toFixed(2)}`}
              subtitle="Pendente"
              icon={AlertCircle}
              color="amber"
              darkMode={darkMode}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              onClick={() => router.push('/students')}
              className={darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'}
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Aluno
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/lessons')}
              className={darkMode ? 'border-slate-700 text-white hover:bg-slate-800' : ''}
            >
              <BookOpen className="w-4 h-4 mr-2" /> Agendar Aula
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/finance')}
              className={darkMode ? 'border-slate-700 text-white hover:bg-slate-800' : ''}
            >
              <DollarSign className="w-4 h-4 mr-2" /> Registrar Pagamento
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upcoming Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 shadow-sm border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}
              >
                <Calendar className="w-5 h-5 text-blue-500" />
                Próximas Aulas
              </h2>
              {upcomingLessons.length === 0 ? (
                <p className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nenhuma aula agendada para os próximos 7 dias
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingLessons.slice(0, 5).map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode ? 'bg-slate-700/50' : 'bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {lesson.studentName || 'Aluno'}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {format(parseISO(lesson.date), "EEEE, dd/MM", { locale: ptBR })} às{' '}
                          {lesson.startTime || '--:--'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          lesson.subject
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lesson.subject || 'Geral'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Payment Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 shadow-sm border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`text-lg font-semibold flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Alertas de Pagamento
                  {paymentAlerts.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-sm">
                      {paymentAlerts.length}
                    </span>
                  )}
                </h2>
                {paymentAlerts.length > 0 && (
                  <Button
                    size="sm"
                    variant={whatsappConfigured ? "default" : "outline"}
                    onClick={handleSendAllReminders}
                    disabled={sendingWhatsApp}
                    className={whatsappConfigured 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "border-green-500 text-green-600 hover:bg-green-50"
                    }
                  >
                    {sendingWhatsApp ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    {whatsappConfigured ? 'Enviar Lembretes' : 'Configurar WhatsApp'}
                  </Button>
                )}
              </div>
              {paymentAlerts.length === 0 ? (
                <p className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nenhum pagamento pendente
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentAlerts.slice(0, 5).map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode ? 'bg-slate-700/50' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {alert.studentName}
                          {!alert.phone && (
                            <span className="ml-2 text-xs text-slate-400">(sem telefone)</span>
                          )}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Vencimento: dia {alert.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-sm font-bold ${
                            alert.isOverdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          R$ {alert.amount.toFixed(2)}
                        </span>
                        {alert.phone && whatsappConfigured && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendSingleReminder(alert)}
                            disabled={sendingWhatsApp}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {paymentAlerts.length > 5 && (
                    <p className={`text-sm text-center pt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      E mais {paymentAlerts.length - 5} pendente(s)...
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
