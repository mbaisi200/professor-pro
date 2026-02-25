'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  Sparkles,
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

// Futuristic Theme Colors
const CYAN = '#00F2FE';
const PURPLE = '#8A2BE2';

// Expiration Modal - Futuristic Style
function ExpirationModal({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-3xl w-full max-w-md p-8 text-center relative overflow-hidden ${
          darkMode ? 'glass-dark' : 'glass-light'
        }`}
      >
        {/* Glow Effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Contrato Expirado
          </h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
            Seu plano expirou. Entre em contato conosco para renovar seu acesso ao ProClass.
          </p>
          <div className={`p-5 rounded-2xl mb-6 ${
            darkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'
          }`}>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>WhatsApp</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  (11) 98861-1088
                </p>
              </div>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
            Entre em contato para regularizar seu plano e continuar usando o sistema.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Stats Card Component - Futuristic Style
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
  const colorConfig: Record<string, { gradient: string; iconBg: string; iconColor: string; glow: string }> = {
    cyan: {
      gradient: 'from-cyan-500/10 to-transparent',
      iconBg: darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100',
      iconColor: 'text-cyan-500',
      glow: 'shadow-cyan-500/20',
    },
    purple: {
      gradient: 'from-purple-500/10 to-transparent',
      iconBg: darkMode ? 'bg-purple-500/20' : 'bg-purple-100',
      iconColor: 'text-purple-500',
      glow: 'shadow-purple-500/20',
    },
    green: {
      gradient: 'from-emerald-500/10 to-transparent',
      iconBg: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      glow: 'shadow-emerald-500/20',
    },
    amber: {
      gradient: 'from-amber-500/10 to-transparent',
      iconBg: darkMode ? 'bg-amber-500/20' : 'bg-amber-100',
      iconColor: 'text-amber-500',
      glow: 'shadow-amber-500/20',
    },
    gradient: {
      gradient: 'from-cyan-500/10 via-purple-500/10 to-transparent',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-purple-500',
      iconColor: 'text-white',
      glow: 'shadow-purple-500/30',
    },
  };

  const config = colorConfig[color] || colorConfig.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative rounded-2xl p-5 overflow-hidden ${
        darkMode 
          ? 'glass-dark' 
          : 'bg-white border border-slate-100 shadow-lg shadow-slate-200/50'
      }`}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`}></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {value}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
            {subtitle}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${config.iconBg} shadow-lg ${config.glow}`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
}

// Loading Skeleton - Futuristic
function LoadingSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-futuristic' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className={`h-8 w-48 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`}></div>
          <div className={`h-4 w-64 mt-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`}></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`rounded-2xl p-5 ${darkMode ? 'glass-dark' : 'bg-white border border-slate-100'} animate-pulse`}>
              <div className={`h-4 w-24 rounded ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
              <div className={`h-8 w-16 mt-3 rounded ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className={`rounded-2xl p-6 ${darkMode ? 'glass-dark' : 'bg-white border border-slate-100'} animate-pulse`}>
              <div className={`h-6 w-32 rounded ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
              <div className="mt-4 space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className={`h-16 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';

  const { user, userData, loading: authLoading, isExpired } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const teacherId = useMemo(() => {
    if (!userData) return null;
    return userData.id;
  }, [userData]);
  
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

  const today = useMemo(() => new Date(), []);
  const currentDay = today.getDate();
  const currentMonth = format(today, 'yyyy-MM');
  const formattedToday = format(today, "EEEE, dd 'de' MMMM", { locale: ptBR });

  if (isExpired) {
    return <ExpirationModal darkMode={darkMode} />;
  }

  if (authLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-futuristic">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-spin opacity-75"></div>
            <div className="absolute inset-2 rounded-full bg-[#121212]"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-gray-400 animate-pulse">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const monthStart = startOfMonth(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()));
  const monthEnd = endOfMonth(parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date()));

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

  const monthlyIncome = payments
    .filter((p) => p.status === 'paid')
    .filter((p) => p.referenceMonth === selectedMonth)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paymentAlerts = students
    .filter(s => s.status === 'active' && s.chargeFee !== false && s.monthlyFee && s.paymentDay)
    .filter(student => {
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
      isOverdue: currentDay > student.paymentDay!,
    }))
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.dueDate - b.dueDate;
    });

  const pendingAmount = paymentAlerts.reduce((sum, a) => sum + a.amount, 0);

  // Aulas concluídas - IGNORA marcadores de final de ciclo
  // REGRA: Aulas com endOfCycle=true são apenas marcadores, não aulas reais
  const completedLessons = lessons
    .filter((l) => l.status === 'completed' && l.date && l.endOfCycle !== true)
    .filter((l) => {
      const lessonDate = parseISO(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd;
    }).length;

  // Total de aulas do mês (excluindo marcadores de fim de ciclo)
  const totalLessonsThisMonth = lessons
    .filter((l) => l.endOfCycle !== true)
    .filter((l) => {
      const lessonDate = parseISO(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd;
    }).length;

  if (isLoading) return <LoadingSkeleton darkMode={darkMode} />;

  return (
    <AppLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-futuristic' : 'bg-gradient-to-br from-slate-50 via-slate-100/50 to-purple-50/20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Olá, {userData?.name || 'Professor'}! 👋
              </h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                {formattedToday} • Resumo do seu desempenho
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className={`w-[200px] rounded-xl ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 text-white' 
                    : 'bg-white border-slate-200'
                }`}>
                  <Calendar className="w-4 h-4 mr-2" style={{ color: CYAN }} />
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-[#1a1a1a] border-white/10' : ''}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const value = format(date, 'yyyy-MM');
                    const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
                    return (
                      <SelectItem key={value} value={value} className={darkMode ? 'text-white hover:bg-white/5' : ''}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="icon" 
                className={`rounded-xl ${darkMode ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard
              title="Alunos Ativos"
              value={activeStudents}
              subtitle="Total de alunos"
              icon={Users}
              color="cyan"
              darkMode={darkMode}
            />
            <StatsCard
              title="Aulas Concluídas"
              value={completedLessons}
              subtitle={totalLessonsThisMonth > 0 ? `de ${totalLessonsThisMonth} no mês` : 'no mês'}
              icon={BookOpen}
              color="purple"
              darkMode={darkMode}
            />
            <StatsCard
              title="Receita do Mês"
              value={`R$ ${monthlyIncome.toFixed(2)}`}
              subtitle="Total recebido"
              icon={DollarSign}
              color="green"
              darkMode={darkMode}
            />
            <StatsCard
              title="A Receber"
              value={`R$ ${pendingAmount.toFixed(2)}`}
              subtitle="Mensalidades pendentes"
              icon={Wallet}
              color="amber"
              darkMode={darkMode}
            />
            <StatsCard
              title="Previsão Total"
              value={`R$ ${expectedMonthlyRevenue.toFixed(2)}`}
              subtitle="Faturamento esperado"
              icon={TrendingUp}
              color="gradient"
              darkMode={darkMode}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upcoming Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg shadow-slate-200/50'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                    <Calendar className="w-5 h-5 text-cyan-500" />
                  </div>
                  Próximas Aulas
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/lessons')}
                  className={`rounded-xl ${darkMode ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10' : 'text-cyan-600 hover:bg-cyan-50'}`}
                >
                  Ver todas
                </Button>
              </div>

              {upcomingLessons.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    darkMode ? 'bg-white/5' : 'bg-slate-100'
                  }`}>
                    <Calendar className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} />
                  </div>
                  <p className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
                    Nenhuma aula agendada para os próximos 7 dias
                  </p>
                  <Button
                    className="mt-4 btn-gradient rounded-xl"
                    onClick={() => router.push('/lessons')}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Agendar Aula
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLessons.slice(0, 5).map((lesson) => (
                    <motion.div
                      key={lesson.id}
                      whileHover={{ x: 4 }}
                      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                        darkMode 
                          ? 'bg-white/5 hover:bg-white/10 border border-white/5' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {lesson.studentName}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {format(parseISO(lesson.date), "dd 'de' MMMM", { locale: ptBR })} • {lesson.startTime}
                        </p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        darkMode 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                          : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {lesson.subject}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Payment Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg shadow-slate-200/50'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  Alertas de Pagamento
                  {paymentAlerts.length > 0 && (
                    <span className={`ml-2 px-2.5 py-1 rounded-lg text-sm font-medium ${
                      darkMode 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {paymentAlerts.length}
                    </span>
                  )}
                </h2>
              </div>
              {paymentAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
                  }`}>
                    <DollarSign className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className={darkMode ? 'text-gray-400' : 'text-slate-500'}>
                    Nenhum pagamento pendente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentAlerts.slice(0, 5).map((alert, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 4 }}
                      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                        darkMode 
                          ? 'bg-white/5 hover:bg-white/10 border border-white/5' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {alert.studentName}
                          {!alert.phone && (
                            <span className="ml-2 text-xs text-gray-500">(sem telefone)</span>
                          )}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          Vencimento: dia {alert.dueDate}
                        </p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        alert.isOverdue
                          ? darkMode 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-red-100 text-red-700'
                          : darkMode
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        R$ {alert.amount.toFixed(2)}
                      </span>
                    </motion.div>
                  ))}
                  {paymentAlerts.length > 5 && (
                    <p className={`text-sm text-center pt-2 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
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
