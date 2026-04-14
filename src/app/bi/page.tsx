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
  TrendingDown,
  Target,
  Award,
  Calendar,
  Clock,
  AlertTriangle,
  Star,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  ChevronRight,
  GraduationCap,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  CheckCircle2,
  Timer,
  Flame,
  Lightbulb,
  Trophy,
  Medal,
  Crown,
  Sparkles,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, COLLECTIONS } from '@/lib/firestore-helpers';

// Futuristic Theme Colors
const CYAN = '#00F2FE';
const PURPLE = '#8A2BE2';
const EMERALD = '#10B981';
const AMBER = '#F59E0B';
const ROSE = '#F43F5E';

// Chart colors
const CHART_COLORS = ['#00F2FE', '#8A2BE2', '#10B981', '#F59E0B', '#F43F5E', '#6366F1', '#EC4899'];

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  monthlyFee: number | null;
  paymentDay: number | null;
  chargeFee: boolean;
  contractedLessons: number | null;
  completedLessonsInCycle: number;
  startDate: string | null;
  subject: string | null;
  teacherId?: string | null;
}

interface Lesson {
  id: string;
  date: string;
  startTime: string | null;
  studentId: string | null;
  studentName: string | null;
  subject: string | null;
  status: string;
  endOfCycle: boolean;
  teacherId?: string | null;
}

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
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
  darkMode,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  darkMode: boolean;
}) {
  const colorConfig: Record<string, { bg: string; iconBg: string }> = {
    cyan: {
      bg: darkMode ? 'bg-cyan-500/10' : 'bg-cyan-50',
      iconBg: darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100',
    },
    purple: {
      bg: darkMode ? 'bg-purple-500/10' : 'bg-purple-50',
      iconBg: darkMode ? 'bg-purple-500/20' : 'bg-purple-100',
    },
    emerald: {
      bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
      iconBg: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100',
    },
    amber: {
      bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50',
      iconBg: darkMode ? 'bg-amber-500/20' : 'bg-amber-100',
    },
    rose: {
      bg: darkMode ? 'bg-rose-500/10' : 'bg-rose-50',
      iconBg: darkMode ? 'bg-rose-500/20' : 'bg-rose-100',
    },
  };

  const config = colorConfig[color] || colorConfig.cyan;

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`relative rounded-2xl p-5 overflow-hidden ${
        darkMode
          ? 'glass-dark'
          : 'bg-white border border-slate-100 shadow-lg shadow-slate-200/50'
      }`}
    >
      <div className={`absolute inset-0 ${config.bg} pointer-events-none`}></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              {title}
            </p>
            <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {value}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              {subtitle}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${config.iconBg} shadow-lg`}>
            <Icon className={`w-6 h-6`} style={{ color: color === 'cyan' ? CYAN : color === 'purple' ? PURPLE : color === 'emerald' ? EMERALD : color === 'amber' ? AMBER : ROSE }} />
          </div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 mt-3 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Alert Card Component
function AlertCard({
  type,
  title,
  description,
  icon: Icon,
  darkMode,
}: {
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  description: string;
  icon: React.ElementType;
  darkMode: boolean;
}) {
  const typeConfig = {
    warning: {
      bg: darkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200',
      iconBg: darkMode ? 'bg-amber-500/20' : 'bg-amber-100',
      iconColor: 'text-amber-500',
      textColor: darkMode ? 'text-amber-300' : 'text-amber-700',
    },
    danger: {
      bg: darkMode ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200',
      iconBg: darkMode ? 'bg-rose-500/20' : 'bg-rose-100',
      iconColor: 'text-rose-500',
      textColor: darkMode ? 'text-rose-300' : 'text-rose-700',
    },
    info: {
      bg: darkMode ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200',
      iconBg: darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100',
      iconColor: 'text-cyan-500',
      textColor: darkMode ? 'text-cyan-300' : 'text-cyan-700',
    },
    success: {
      bg: darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
      iconBg: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      textColor: darkMode ? 'text-emerald-300' : 'text-emerald-700',
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`rounded-xl p-4 border cursor-pointer transition-all ${config.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.iconBg}`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div>
          <p className={`font-medium text-sm ${config.textColor}`}>{title}</p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Student Ranking Item
function StudentRankingItem({
  student,
  rank,
  metric,
  metricLabel,
  darkMode,
}: {
  student: Student;
  rank: number;
  metric: number | string;
  metricLabel: string;
  darkMode: boolean;
}) {
  const rankIcons = [Crown, Medal, Award];

  const RankIcon = rank <= 3 ? rankIcons[rank - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`flex items-center gap-3 p-3 rounded-xl ${
        darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'
      } transition-colors`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
        rank <= 3
          ? darkMode ? 'bg-white/10' : 'bg-amber-100'
          : darkMode ? 'bg-white/5' : 'bg-slate-200'
      }`}>
        {RankIcon ? (
          <RankIcon className={`w-5 h-5 ${rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : 'text-amber-600'}`} />
        ) : (
          <span className={`font-bold text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            {rank}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {student.name}
        </p>
        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
          {student.subject || 'Sem matéria'}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{metric}</p>
        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{metricLabel}</p>
      </div>
    </motion.div>
  );
}

// Achievement Badge
function AchievementBadge({
  title,
  description,
  icon: Icon,
  unlocked,
  darkMode,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  darkMode: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative rounded-xl p-4 text-center ${
        unlocked
          ? darkMode
            ? 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30'
            : 'bg-gradient-to-br from-purple-50 to-cyan-50 border border-purple-200'
          : darkMode
            ? 'bg-white/5 border border-white/10 opacity-50'
            : 'bg-slate-100 border border-slate-200 opacity-50'
      }`}
    >
      {!unlocked && (
        <div className="absolute inset-0 backdrop-blur-[2px] rounded-xl"></div>
      )}
      <div className="relative z-10">
        <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${
          unlocked
            ? 'bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/30'
            : darkMode ? 'bg-white/10' : 'bg-slate-200'
        }`}>
          <Icon className={`w-6 h-6 ${unlocked ? 'text-white' : darkMode ? 'text-gray-500' : 'text-slate-400'}`} />
        </div>
        <p className={`font-semibold text-sm mt-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {title}
        </p>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// Custom Tooltip for Charts
function CustomTooltip({ active, payload, label, darkMode }: any) {
  if (active && payload && payload.length) {
    return (
      <div className={`rounded-lg p-3 shadow-xl border ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{label}</p>
        {payload.map((entry: any, index: number) => {
          const numValue = Number(entry.value);
          const isMonetary = entry.dataKey === 'receita' || entry.dataKey === 'esperado' || entry.name?.toLowerCase().includes('receita') || entry.name?.toLowerCase().includes('valor');
          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {isMonetary && !isNaN(numValue) 
                ? numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                : !isNaN(numValue) ? numValue : entry.value}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
}

// Loading Skeleton
function LoadingSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-futuristic' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-pulse">
          <div className={`h-8 w-48 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`}></div>
          <div className={`h-4 w-64 mt-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`}></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`rounded-2xl p-5 h-32 ${darkMode ? 'glass-dark' : 'bg-white border border-slate-100'} animate-pulse`}></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className={`rounded-2xl p-6 h-80 ${darkMode ? 'glass-dark' : 'bg-white border border-slate-100'} animate-pulse`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BIPage() {
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';

  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && userData?.id) {
      fetchData();
    }
  }, [user, authLoading, router, userData]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsData, lessonsData, paymentsData] = await Promise.all([
        firestoreService.getAll<Student>(COLLECTIONS.STUDENTS),
        firestoreService.getAll<Lesson>(COLLECTIONS.LESSONS),
        firestoreService.getAll<Payment>(COLLECTIONS.PAYMENTS),
      ]);

      if (userData?.id) {
        setStudents(studentsData.filter(s => s.teacherId === userData.id));
        setLessons(lessonsData.filter(l => l.teacherId === userData.id));
        setPayments(paymentsData.filter(p => p.teacherId === userData.id));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ CALCULATIONS ============

  const today = new Date();
  const currentMonth = format(today, 'yyyy-MM');
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Active students
  const activeStudents = students.filter(s => s.status === 'active');

  // Revenue calculations
  const monthlyRevenue = useMemo(() => {
    return payments
      .filter(p => p.status === 'paid' && p.referenceMonth === currentMonth)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments, currentMonth]);

  const expectedRevenue = useMemo(() => {
    return activeStudents
      .filter(s => s.chargeFee !== false && s.monthlyFee)
      .reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);
  }, [activeStudents]);

  const pendingRevenue = useMemo(() => {
    return activeStudents
      .filter(s => s.chargeFee !== false && s.monthlyFee)
      .filter(s => {
        const hasPayment = payments.some(
          p => p.studentId === s.id && p.referenceMonth === currentMonth && p.status === 'paid'
        );
        return !hasPayment;
      })
      .reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);
  }, [activeStudents, payments, currentMonth]);

  const overdueRevenue = useMemo(() => {
    return activeStudents
      .filter(s => s.chargeFee !== false && s.monthlyFee && s.paymentDay)
      .filter(s => {
        const hasPayment = payments.some(
          p => p.studentId === s.id && p.referenceMonth === currentMonth && p.status === 'paid'
        );
        const isOverdue = today.getDate() > (Number(s.paymentDay) || 0);
        return !hasPayment && isOverdue;
      })
      .reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);
  }, [activeStudents, payments, currentMonth, today]);

  // Collection rate
  const collectionRate = expectedRevenue > 0 ? (monthlyRevenue / expectedRevenue) * 100 : 0;

  // Lesson calculations
  const completedLessonsThisMonth = useMemo(() => {
    return lessons.filter(l => {
      if (l.status !== 'completed' || l.endOfCycle) return false;
      const lessonDate = parseISO(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd;
    });
  }, [lessons, monthStart, monthEnd]);

  const scheduledLessonsThisMonth = useMemo(() => {
    return lessons.filter(l => {
      if (l.status !== 'scheduled') return false;
      const lessonDate = parseISO(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd;
    });
  }, [lessons, monthStart, monthEnd]);

  const cancelledLessonsThisMonth = useMemo(() => {
    return lessons.filter(l => {
      if (l.status !== 'cancelled') return false;
      const lessonDate = parseISO(l.date);
      return lessonDate >= monthStart && lessonDate <= monthEnd;
    });
  }, [lessons, monthStart, monthEnd]);

  // Revenue by month (last 6 months)
  const revenueByMonth = useMemo(() => {
    const months: { month: string; receita: number; esperado: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM', { locale: ptBR });

      const revenue = payments
        .filter(p => p.status === 'paid' && p.referenceMonth === monthKey)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const expected = students
        .filter(s => s.chargeFee !== false && s.monthlyFee)
        .reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);

      months.push({
        month: monthLabel,
        receita: revenue,
        esperado: expected,
      });
    }
    return months;
  }, [payments, students, today]);

  // Lessons by status
  const lessonsByStatus = useMemo(() => {
    const allLessons = lessons.filter(l => !l.endOfCycle);
    const completed = allLessons.filter(l => l.status === 'completed').length;
    const scheduled = allLessons.filter(l => l.status === 'scheduled').length;
    const cancelled = allLessons.filter(l => l.status === 'cancelled').length;
    const rescheduled = allLessons.filter(l => l.status === 'rescheduled').length;

    return [
      { name: 'Concluídas', value: completed, color: EMERALD },
      { name: 'Agendadas', value: scheduled, color: CYAN },
      { name: 'Canceladas', value: cancelled, color: ROSE },
      { name: 'Remarcadas', value: rescheduled, color: AMBER },
    ].filter(item => item.value > 0);
  }, [lessons]);

  // Lessons by day of week
  const lessonsByDayOfWeek = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    lessons
      .filter(l => !l.endOfCycle && l.status === 'completed')
      .forEach(l => {
        const date = parseISO(l.date);
        const dayOfWeek = getDay(date);
        counts[dayOfWeek]++;
      });

    return days.map((day, index) => ({
      day,
      aulas: counts[index],
    }));
  }, [lessons]);

  // Lessons by hour
  const lessonsByHour = useMemo(() => {
    const hours: Record<string, number> = {};

    lessons
      .filter(l => !l.endOfCycle && l.startTime)
      .forEach(l => {
        const hour = l.startTime!.split(':')[0];
        hours[hour] = (hours[hour] || 0) + 1;
      });

    return Object.entries(hours)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([hour, count]) => ({
        hora: `${hour}h`,
        aulas: count,
      }));
  }, [lessons]);

  // Subjects distribution
  const subjectsDistribution = useMemo(() => {
    const subjects: Record<string, number> = {};

    activeStudents.forEach(s => {
      if (s.subject) {
        subjects[s.subject] = (subjects[s.subject] || 0) + 1;
      }
    });

    return Object.entries(subjects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [activeStudents]);

  // Student ranking by frequency
  const studentRankingByFrequency = useMemo(() => {
    const studentLessons: Record<string, number> = {};

    completedLessonsThisMonth.forEach(l => {
      if (l.studentId) {
        studentLessons[l.studentId] = (studentLessons[l.studentId] || 0) + 1;
      }
    });

    return activeStudents
      .map(s => ({
        ...s,
        lessonCount: studentLessons[s.id] || 0,
      }))
      .sort((a, b) => b.lessonCount - a.lessonCount)
      .slice(0, 5);
  }, [activeStudents, completedLessonsThisMonth]);

  // Students at risk (low attendance or pending payments)
  const studentsAtRisk = useMemo(() => {
    return activeStudents.filter(s => {
      // Check for overdue payments
      if (s.chargeFee !== false && s.monthlyFee && s.paymentDay) {
        const hasPayment = payments.some(
          p => p.studentId === s.id && p.referenceMonth === currentMonth && p.status === 'paid'
        );
        if (!hasPayment && today.getDate() > (s.paymentDay || 0) + 5) {
          return true;
        }
      }
      return false;
    });
  }, [activeStudents, payments, currentMonth, today]);

  // Students near end of cycle
  const studentsNearEndOfCycle = useMemo(() => {
    return activeStudents.filter(s => {
      const contracted = Number(s.contractedLessons) || 0;
      if (contracted <= 0) return false;
      const completed = Number(s.completedLessonsInCycle) || 0;
      const remaining = contracted - completed;
      return remaining <= 2 && remaining > 0;
    });
  }, [activeStudents]);

  // Average ticket
  const activeStudentsWithFee = activeStudents.filter(s => s.chargeFee !== false);
  const averageTicket = activeStudentsWithFee.length > 0
    ? expectedRevenue / activeStudentsWithFee.length
    : 0;

  // Completion rate
  const completionRate = useMemo(() => {
    const total = completedLessonsThisMonth.length + cancelledLessonsThisMonth.length;
    return total > 0 ? (completedLessonsThisMonth.length / total) * 100 : 0;
  }, [completedLessonsThisMonth, cancelledLessonsThisMonth]);

  // New students this month
  const newStudentsThisMonth = useMemo(() => {
    return students.filter(s => {
      if (!s.startDate) return false;
      const startDate = parseISO(s.startDate);
      return startDate >= monthStart && startDate <= monthEnd;
    });
  }, [students, monthStart, monthEnd]);

  // Retention rate (students who started more than 3 months ago and are still active)
  const retentionRate = useMemo(() => {
    const threeMonthsAgo = subMonths(today, 3);
    const longTermStudents = students.filter(s => {
      if (!s.startDate) return false;
      return parseISO(s.startDate) <= threeMonthsAgo;
    });

    if (longTermStudents.length === 0) return 100;

    const stillActive = longTermStudents.filter(s => s.status === 'active');
    return (stillActive.length / longTermStudents.length) * 100;
  }, [students, today]);

  // Achievements
  const achievements = useMemo(() => {
    const list = [
      {
        title: 'Primeiro Aluno',
        description: 'Cadastrou o primeiro aluno',
        icon: GraduationCap,
        unlocked: students.length >= 1,
      },
      {
        title: 'Mestre',
        description: '50 aulas concluídas',
        icon: BookOpen,
        unlocked: lessons.filter(l => l.status === 'completed' && !l.endOfCycle).length >= 50,
      },
      {
        title: 'Gestor Financeiro',
        description: 'R$ 5.000 em receitas',
        icon: DollarSign,
        unlocked: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0) >= 5000,
      },
      {
        title: 'Excelência',
        description: '90%+ taxa de conclusão',
        icon: Trophy,
        unlocked: completionRate >= 90,
      },
      {
        title: 'Veterano',
        description: '10+ alunos ativos',
        icon: Award,
        unlocked: activeStudents.length >= 10,
      },
      {
        title: 'Rentável',
        description: '95%+ taxa de cobrança',
        icon: Target,
        unlocked: collectionRate >= 95,
      },
    ];

    return {
      list,
      unlocked: list.filter(a => a.unlocked).length,
      total: list.length,
    };
  }, [students, lessons, payments, completionRate, activeStudents.length, collectionRate]);

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: 'warning' | 'danger' | 'info' | 'success'; title: string; description: string; icon: React.ElementType }[] = [];

    // Overdue payments
    if (overdueRevenue > 0) {
      list.push({
        type: 'danger',
        title: 'Pagamentos Atrasados',
        description: `${studentsAtRisk.length} aluno(s) com pagamentos atrasados - R$ ${overdueRevenue.toFixed(2)}`,
        icon: AlertTriangle,
      });
    }

    // Students near end of cycle
    if (studentsNearEndOfCycle.length > 0) {
      list.push({
        type: 'info',
        title: 'Ciclos Próximos ao Fim',
        description: `${studentsNearEndOfCycle.length} aluno(s) finalizando ciclo de aulas`,
        icon: Timer,
      });
    }

    // New students
    if (newStudentsThisMonth.length > 0) {
      list.push({
        type: 'success',
        title: 'Novos Alunos',
        description: `${newStudentsThisMonth.length} novo(s) aluno(s) este mês`,
        icon: Star,
      });
    }

    // Low completion rate
    if (completionRate < 70 && completedLessonsThisMonth.length > 0) {
      list.push({
        type: 'warning',
        title: 'Taxa de Conclusão Baixa',
        description: `Apenas ${completionRate.toFixed(0)}% das aulas foram concluídas`,
        icon: TrendingDown,
      });
    }

    // High collection rate
    if (collectionRate >= 90 && expectedRevenue > 0) {
      list.push({
        type: 'success',
        title: 'Excelente Cobrança!',
        description: `${collectionRate.toFixed(0)}% da receita prevista foi recebida`,
        icon: CheckCircle2,
      });
    }

    return list;
  }, [overdueRevenue, studentsAtRisk, studentsNearEndOfCycle, newStudentsThisMonth, completionRate, collectionRate, expectedRevenue, completedLessonsThisMonth.length]);

  if (authLoading || isLoading) {
    return <LoadingSkeleton darkMode={darkMode} />;
  }

  if (!user || !userData) {
    return null;
  }

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
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <BarChart3 className="w-6 h-6" style={{ color: PURPLE }} />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    Business Intelligence
                  </h1>
                  <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    Análise completa do seu desempenho como professor
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={fetchData}
                variant="outline"
                className={`rounded-xl ${darkMode ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
              </Button>
            </div>
          </motion.div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {alerts.map((alert, index) => (
                  <AlertCard key={index} {...alert} darkMode={darkMode} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Main Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Alunos Ativos"
              value={activeStudents.length}
              subtitle={`${newStudentsThisMonth.length} novo(s) este mês`}
              icon={Users}
              color="cyan"
              darkMode={darkMode}
            />
            <MetricCard
              title="Receita do Mês"
              value={`R$ ${monthlyRevenue.toFixed(0)}`}
              subtitle={`de R$ ${expectedRevenue.toFixed(0)} esperado`}
              icon={DollarSign}
              trend={collectionRate >= 80 ? 'up' : collectionRate >= 50 ? 'neutral' : 'down'}
              trendValue={`${collectionRate.toFixed(0)}%`}
              color="emerald"
              darkMode={darkMode}
            />
            <MetricCard
              title="Aulas Concluídas"
              value={completedLessonsThisMonth.length}
              subtitle={`${scheduledLessonsThisMonth.length} agendada(s)`}
              icon={BookOpen}
              color="purple"
              darkMode={darkMode}
            />
            <MetricCard
              title="Ticket Médio"
              value={`R$ ${averageTicket.toFixed(0)}`}
              subtitle="por aluno ativo"
              icon={Target}
              color="amber"
              darkMode={darkMode}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Evolution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  <TrendingUp className="w-5 h-5" style={{ color: EMERALD }} />
                  Evolução de Receitas
                </h2>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueByMonth}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={EMERALD} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={EMERALD} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEsperado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={PURPLE} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#ffffff10' : '#e2e8f0'} />
                  <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  <Area
                    type="monotone"
                    dataKey="esperado"
                    stroke={PURPLE}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEsperado)"
                    name="Esperado"
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke={EMERALD}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                    name="Recebido"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Lessons by Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  <PieChartIcon className="w-5 h-5" style={{ color: PURPLE }} />
                  Distribuição de Aulas
                </h2>
              </div>

              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={lessonsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {lessonsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {lessonsByStatus.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className={`flex-1 text-sm ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                        {item.name}
                      </span>
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Lessons by Day of Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                <Calendar className="w-5 h-5" style={{ color: CYAN }} />
                Aulas por Dia da Semana
              </h2>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={lessonsByDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#ffffff10' : '#e2e8f0'} />
                  <XAxis dataKey="day" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  <Bar dataKey="aulas" fill={CYAN} radius={[4, 4, 0, 0]} name="Aulas" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Lessons by Hour */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                <Clock className="w-5 h-5" style={{ color: AMBER }} />
                Horários Mais Movimentados
              </h2>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={lessonsByHour} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#ffffff10' : '#e2e8f0'} />
                  <XAxis type="number" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                  <YAxis dataKey="hora" type="category" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} width={40} />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  <Bar dataKey="aulas" fill={AMBER} radius={[0, 4, 4, 0]} name="Aulas" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Painel de Desempenho */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`rounded-2xl p-5 overflow-y-auto max-h-[600px] ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                <Activity className="w-5 h-5" style={{ color: PURPLE }} />
                Painel de Desempenho
              </h2>

              <div className="space-y-3">
                {/* Seção Financeiro */}
                {(() => {
                  const value = Math.min(collectionRate, 100);
                  const label = value >= 90 ? 'Excelente' : value >= 70 ? 'Bom' : value >= 50 ? 'Atenção' : 'Crítico';
                  const color = value >= 90 ? EMERALD : value >= 70 ? CYAN : value >= 50 ? AMBER : ROSE;
                  return (
                    <div className={`p-3 rounded-xl border-l-4 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}`} style={{ borderLeftColor: color }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" style={{ color }} />
                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                            Financeiro
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            value >= 90 ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            : value >= 70 ? (darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700')
                            : value >= 50 ? (darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')
                            : (darkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700')
                          }`}>{label}</span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {value.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
                      </div>
                      <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        Dos alunos com mensalidade, <strong>{value.toFixed(0)}%</strong> realizaram o pagamento este mês.
                        {value >= 70 ? ' Saúde financeira positiva.' : ' Verifique pagamentos em atraso.'}
                      </p>
                      <div className={`mt-1.5 text-xs ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                        Pendente: R$ {pendingRevenue.toFixed(0)}
                      </div>
                    </div>
                  );
                })()}

                {/* Seção Aulas */}
                {(() => {
                  const value = Math.min(completionRate, 100);
                  const label = value >= 90 ? 'Excelente' : value >= 70 ? 'Bom' : value >= 50 ? 'Atenção' : 'Crítico';
                  const color = value >= 90 ? EMERALD : value >= 70 ? CYAN : value >= 50 ? AMBER : ROSE;
                  return (
                    <div className={`p-3 rounded-xl border-l-4 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}`} style={{ borderLeftColor: color }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" style={{ color }} />
                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                            Aulas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            value >= 90 ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            : value >= 70 ? (darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700')
                            : value >= 50 ? (darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')
                            : (darkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700')
                          }`}>{label}</span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {value.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
                      </div>
                      <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        Do total de aulas agendadas, <strong>{value.toFixed(0)}%</strong> foram concluídas sem cancelamento.
                        {value >= 70 ? ' Comprometimento dos alunos é alto.' : ' Avalie causas de cancelamento.'}
                      </p>
                      <div className={`mt-1.5 text-xs ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                        Canceladas: {cancelledLessonsThisMonth.length} este mês
                      </div>
                    </div>
                  );
                })()}

                {/* Seção Alunos */}
                {(() => {
                  const value = Math.min(retentionRate, 100);
                  const label = value >= 90 ? 'Excelente' : value >= 70 ? 'Bom' : value >= 50 ? 'Atenção' : 'Crítico';
                  const color = value >= 90 ? EMERALD : value >= 70 ? CYAN : value >= 50 ? AMBER : ROSE;
                  return (
                    <div className={`p-3 rounded-xl border-l-4 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}`} style={{ borderLeftColor: color }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" style={{ color }} />
                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                            Alunos
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            value >= 90 ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            : value >= 70 ? (darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700')
                            : value >= 50 ? (darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')
                            : (darkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700')
                          }`}>{label}</span>
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {value.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
                      </div>
                      <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        <strong>{value.toFixed(0)}%</strong> dos alunos com mais de 3 meses continuam ativos.
                        {value >= 70 ? ' Boa fidelização de alunos.' : ' Foco em manter os alunos engajados.'}
                      </p>
                      <div className={`mt-1.5 text-xs ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>
                        Novos alunos: {newStudentsThisMonth.length} este mês
                      </div>
                    </div>
                  );
                })()}

                {/* Score Geral */}
                {(() => {
                  const overall = (Math.min(collectionRate, 100) + Math.min(completionRate, 100) + Math.min(retentionRate, 100)) / 3;
                  const grade = overall >= 90 ? 'A+' : overall >= 80 ? 'A' : overall >= 70 ? 'B+' : overall >= 60 ? 'B' : overall >= 50 ? 'C' : 'D';
                  const gradeColor = overall >= 70 ? EMERALD : overall >= 50 ? AMBER : ROSE;
                  const gradeDesc = overall >= 90 ? 'Desempenho excepcional! Continue assim.' : overall >= 70 ? 'Bom desempenho geral. Oportunidades de melhoria nas áreas sinalizadas.' : overall >= 50 ? 'Desempenho moderado. Ação recomendada nos indicadores em atenção.' : 'Desempenho abaixo do esperado. Ação urgente necessária.';
                  return (
                    <div className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20' : 'bg-gradient-to-r from-purple-50 to-cyan-50 border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                            Score Geral
                          </p>
                          <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                            Média das taxas de cobrança, conclusão e retenção
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold`} style={{ color: gradeColor }}>{grade}</span>
                          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {overall.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        {gradeDesc}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>

          {/* Student Ranking & Subjects */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Top Students */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  <Award className="w-5 h-5" style={{ color: AMBER }} />
                  Ranking de Frequência
                </h2>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  darkMode ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  Este mês
                </span>
              </div>

              <div className="space-y-2">
                {studentRankingByFrequency.length > 0 ? (
                  studentRankingByFrequency.map((student, index) => (
                    <StudentRankingItem
                      key={student.id}
                      student={student}
                      rank={index + 1}
                      metric={student.lessonCount}
                      metricLabel="aulas"
                      darkMode={darkMode}
                    />
                  ))
                ) : (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                    Nenhuma aula concluída este mês
                  </div>
                )}
              </div>
            </motion.div>

            {/* Subjects Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className={`rounded-2xl p-6 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                <BookOpen className="w-5 h-5" style={{ color: PURPLE }} />
                Matérias Mais Lecionadas
              </h2>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectsDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#ffffff10' : '#e2e8f0'} />
                  <XAxis type="number" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    width={100}
                    tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                  />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Alunos">
                    {subjectsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className={`rounded-2xl p-6 mb-8 ${
              darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                <Trophy className="w-5 h-5" style={{ color: AMBER }} />
                Conquistas
              </h2>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                {achievements.unlocked} de {achievements.total} desbloqueadas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {achievements.list.map((achievement, index) => (
                <AchievementBadge key={index} {...achievement} darkMode={darkMode} />
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className={`h-2 rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(achievements.unlocked / achievements.total) * 100}%` }}
                  transition={{ duration: 1, delay: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                ></motion.div>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className={`rounded-xl p-4 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Flame className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Taxa de Retenção</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {retentionRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className={`rounded-xl p-4 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                  <Zap className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aulas Este Mês</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {completedLessonsThisMonth.length + scheduledLessonsThisMonth.length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className={`rounded-xl p-4 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Previsão Próx. Mês</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    R$ {expectedRevenue.toFixed(0)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className={`rounded-xl p-4 ${
                darkMode ? 'glass-dark' : 'bg-white border border-slate-100 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Total a Receber</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    R$ {pendingRevenue.toFixed(0)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className={`mt-8 rounded-2xl p-6 ${
              darkMode
                ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20'
                : 'bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-100'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Lightbulb className="w-6 h-6" style={{ color: AMBER }} />
              </div>
              <div>
                <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Dicas para Melhorar seu Desempenho
                </h3>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                  {collectionRate < 80 && (
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-500" />
                      Considere enviar lembretes de pagamento para aumentar sua taxa de cobrança
                    </li>
                  )}
                  {completionRate < 90 && (
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-500" />
                      Tente remarcar aulas canceladas para manter uma alta taxa de conclusão
                    </li>
                  )}
                  {activeStudents.length < 10 && (
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-500" />
                      Expandir sua base de alunos pode aumentar significativamente sua receita
                    </li>
                  )}
                  {studentsNearEndOfCycle.length > 0 && (
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-500" />
                      Entre em contato com {studentsNearEndOfCycle.length} aluno(s) que estão finalizando o ciclo de aulas
                    </li>
                  )}
                  {collectionRate >= 80 && completionRate >= 90 && (
                    <li className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                      Parabéns! Você está mantendo excelentes métricas. Continue assim!
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
