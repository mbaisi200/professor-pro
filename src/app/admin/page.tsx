'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  Shield,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Loader2,
  Calendar,
  AlertTriangle,
  MessageCircle,
  DollarSign,
  Clock,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Crown,
  MoreVertical,
  Upload,
  FileJson,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  Database,
  Download,
  Archive
} from 'lucide-react';
import { format, addMonths, isBefore, parseISO, startOfMonth, endOfMonth, subMonths, addDays, getDay, isWithinInterval } from 'date-fns';
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { firestoreService } from '@/lib/firestore-helpers';

interface Teacher {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  invited?: boolean;
  createdAt?: any;
  status?: string;
  expiresAt?: string;
  isExempt?: boolean;
  hasAuth?: boolean;
  authCreatedAt?: any;
}

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

// Phone mask for Brazilian format
function formatPhone(value: string): string {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Se tiver mais de 11 dígitos, pode ser estrangeiro - mantém como está
  if (numbers.length > 11) {
    return value;
  }
  
  // Formato brasileiro
  if (numbers.length <= 10) {
    // Fixo: (XX) XXXX-XXXX
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  } else {
    // Celular: (XX) XXXXX-XXXX
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  }
}

// Check if phone is Brazilian (has 10 or 11 digits)
function isBrazilianPhone(phone: string): boolean {
  if (!phone) return true;
  const numbers = phone.replace(/\D/g, '');
  return numbers.length <= 11;
}

// Expiration Modal
function ExpirationModal({
  onClose,
  darkMode,
}: {
  onClose: () => void;
  darkMode: boolean;
}) {
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
        className={`rounded-2xl w-full max-w-md p-6 text-center ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Contrato Expirado
        </h2>
        <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Seu plano expirou. Entre em contato conosco para renovar seu acesso.
        </p>
        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <div className="flex items-center justify-center gap-3">
            <MessageCircle className="w-6 h-6 text-green-500" />
            <div className="text-left">
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>WhatsApp</p>
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                (11) 98861-1088
              </p>
            </div>
          </div>
        </div>
        <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
          Entendi
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Teacher Form Modal
function TeacherForm({
  teacher,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}: {
  teacher: Teacher | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [form, setForm] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    role: teacher?.role || 'teacher',
    expiresAt: teacher?.expiresAt || format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    isExempt: teacher?.isExempt || false,
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleNameChange = (value: string) => {
    // Converter para maiúsculas
    setForm({ ...form, name: value.toUpperCase() });
  };

  const handleEmailChange = (value: string) => {
    // Converter para minúsculas
    setForm({ ...form, email: value.toLowerCase() });
  };

  const handlePhoneChange = (value: string) => {
    // Formatar telefone se for brasileiro
    const formatted = isBrazilianPhone(value) ? formatPhone(value) : value;
    setForm({ ...form, phone: formatted });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, newPassword: pass, confirmPassword: pass });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    // Validar senha se foi preenchida
    if (form.newPassword) {
      if (form.newPassword.length < 6) {
        setPasswordError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setPasswordError('As senhas não coincidem');
        return;
      }
    }
    
    // Validar nome em maiúsculas e email em minúsculas
    const dataToSave = {
      ...form,
      name: form.name.toUpperCase(),
      email: form.email.toLowerCase(),
    };
    
    onSave(dataToSave);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`rounded-2xl w-full max-w-lg my-8 max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div className={`border-b p-5 flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
        }`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {teacher ? 'Editar Professor' : 'Cadastrar Novo Professor'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <span className={darkMode ? 'text-white' : ''}>✕</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Nome completo * (MAIÚSCULAS)
            </label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="NOME DO PROFESSOR"
              required
              className={`mt-1 uppercase ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : ''}`}
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Email * (minúsculas)
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="email@exemplo.com"
              required
              className={`mt-1 lowercase ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : ''}`}
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Telefone
            </label>
            <Input
              value={form.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={20}
              className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : ''}`}
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Formato brasileiro automático. Estrangeiros: digite normalmente.
            </p>
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Tipo de Acesso
            </label>
            <Select 
              value={form.role} 
              onValueChange={(v) => setForm({ ...form, role: v })}
            >
              <SelectTrigger className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Professor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Isento de Mensalidade */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-amber-50 border-amber-200'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isExempt}
                onChange={(e) => setForm({ ...form, isExempt: e.target.checked })}
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Isento de Mensalidade
                </span>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Professor não paga mensalidade (acesso não expira)
                </p>
              </div>
            </label>
          </div>

          {/* Data de Expiração - só mostra se NÃO for isento */}
          {!form.isExempt && (
            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Data de Expiração do Plano *
              </label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                required
                className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Padrão: 1 mês a partir de hoje
              </p>
            </div>
          )}

          {/* Campo de Senha - só mostra na EDIÇÃO */}
          {teacher && (
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Key className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Alterar Senha de Acesso
                </label>
              </div>
              <p className={`text-xs mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Deixe em branco para manter a senha atual. Preencha apenas se desejar alterar.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Nova Senha
                  </label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className={`pr-10 ${darkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Confirmar Nova Senha
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repita a nova senha"
                    className={`mt-1 ${darkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white'}`}
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className={`w-full text-sm ${darkMode ? 'border-slate-500 text-white hover:bg-slate-600' : 'border-blue-200 text-blue-700 hover:bg-blue-100'}`}
                >
                  🎲 Gerar Senha Aleatória
                </Button>
                
                {passwordError && (
                  <div className="p-2 rounded-lg bg-red-50 text-red-600 text-xs">
                    {passwordError}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 shrink-0 sticky bottom-0 bg-inherit pb-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Salvando...' : teacher ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
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

  // Filtrar apenas professores não isentos
  const payingTeachers = teachers.filter(t => !t.isExempt && t.role === 'teacher');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`rounded-2xl w-full max-w-lg my-8 max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div
          className={`border-b p-5 flex items-center justify-between shrink-0 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {payment ? 'Editar Pagamento' : 'Nova Mensalidade'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <span className={darkMode ? 'text-white' : ''}>✕</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
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
              {payingTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name || teacher.email}
                </option>
              ))}
            </select>
            {payingTeachers.length === 0 && (
              <p className={`text-xs mt-1 text-amber-500`}>
                Nenhum professor pagante cadastrado
              </p>
            )}
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

          <div className="flex gap-3 pt-4 shrink-0 sticky bottom-0 bg-inherit pb-2">
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

// Set Password Modal
function SetPasswordModal({
  teacher,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}: {
  teacher: Teacher;
  onSave: (password: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    onSave(password);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setConfirmPassword(pass);
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
        className={`rounded-2xl w-full max-w-md p-6 ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Key className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Definir Senha de Acesso
            </h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Para: {teacher.name}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <strong>Email:</strong> {teacher.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Nova Senha *
            </label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className={`pr-10 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Confirmar Senha *
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={generatePassword}
            className={`w-full ${darkMode ? 'border-slate-600 text-white hover:bg-slate-700' : ''}`}
          >
            🎲 Gerar Senha Aleatória
          </Button>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-xs ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              ⚠️ Anote a senha antes de salvar! O professor precisará dela para fazer login.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                'Definir Senha'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Clear Payments Modal
function ClearPaymentsModal({
  teachers,
  payments,
  clearFilter,
  setClearFilter,
  clearTeacherId,
  setClearTeacherId,
  onConfirm,
  onCancel,
  isLoading,
  darkMode,
}: {
  teachers: Teacher[];
  payments: TeacherPayment[];
  clearFilter: 'all' | 'admin' | 'teacher';
  setClearFilter: (value: 'all' | 'admin' | 'teacher') => void;
  clearTeacherId: string;
  setClearTeacherId: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  darkMode: boolean;
}) {
  // Calculate how many payments will be deleted
  const getPaymentCount = () => {
    if (clearFilter === 'all') {
      return payments.length;
    } else if (clearFilter === 'admin') {
      const adminIds = teachers.filter(t => t.role === 'admin').map(t => t.id);
      return payments.filter(p => adminIds.includes(p.teacherId || '')).length;
    } else if (clearFilter === 'teacher' && clearTeacherId) {
      return payments.filter(p => p.teacherId === clearTeacherId).length;
    }
    return 0;
  };

  const paymentCount = getPaymentCount();

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
        className={`rounded-2xl w-full max-w-md p-6 ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
            <Trash2 className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Limpar Lançamentos
            </h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Selecione quais lançamentos deseja excluir
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Filter Options */}
          <div className={`p-4 rounded-xl space-y-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="clearFilter"
                value="all"
                checked={clearFilter === 'all'}
                onChange={() => setClearFilter('all')}
                className="w-4 h-4 text-red-600"
              />
              <div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Todos os lançamentos
                </span>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Excluir todos os {payments.length} registros
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="clearFilter"
                value="admin"
                checked={clearFilter === 'admin'}
                onChange={() => setClearFilter('admin')}
                className="w-4 h-4 text-red-600"
              />
              <div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Apenas de Administradores
                </span>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {payments.filter(p => teachers.filter(t => t.role === 'admin').map(t => t.id).includes(p.teacherId || '')).length} registros
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="clearFilter"
                value="teacher"
                checked={clearFilter === 'teacher'}
                onChange={() => setClearFilter('teacher')}
                className="w-4 h-4 text-red-600 mt-1"
              />
              <div className="flex-1">
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  De um professor específico
                </span>
                {clearFilter === 'teacher' && (
                  <select
                    value={clearTeacherId}
                    onChange={(e) => setClearTeacherId(e.target.value)}
                    className={`w-full mt-2 px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-slate-600 border-slate-500 text-white'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="">Selecione um professor...</option>
                    {teachers
                      .filter(t => t.role === 'teacher')
                      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                      .map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({payments.filter(p => p.teacherId === teacher.id).length} registros)
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </label>
          </div>

          {/* Warning */}
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
              ⚠️ <strong>{paymentCount} registro(s)</strong> serão excluídos permanentemente!
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading || paymentCount === 0 || (clearFilter === 'teacher' && !clearTeacherId)}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...
                </>
              ) : (
                `Excluir ${paymentCount} registro(s)`
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Stats Card
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
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  const darkColorClasses: Record<string, string> = {
    blue: 'bg-blue-900/30 text-blue-400',
    purple: 'bg-purple-900/30 text-purple-400',
    green: 'bg-emerald-900/30 text-emerald-400',
    amber: 'bg-amber-900/30 text-amber-400',
    red: 'bg-red-900/30 text-red-400',
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

// Tab Button
function TabButton({
  active,
  onClick,
  children,
  icon: Icon,
  darkMode,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ElementType;
  darkMode: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : darkMode
          ? 'text-slate-300 hover:bg-slate-700'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

export default function AdminPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<TeacherPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingPayment, setEditingPayment] = useState<TeacherPayment | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'teachers' | 'payments' | 'import' | 'populate' | 'backup'>('teachers');
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [assignTeacherId, setAssignTeacherId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [linkToTeacher, setLinkToTeacher] = useState(false);
  const [linkTeacherId, setLinkTeacherId] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showClearPaymentsModal, setShowClearPaymentsModal] = useState(false);
  const [clearFilter, setClearFilter] = useState<'all' | 'admin' | 'teacher'>('all');
  const [clearTeacherId, setClearTeacherId] = useState<string>('');
  // Populate Data states
  const [populateTeacherId, setPopulateTeacherId] = useState<string>('');
  const [populateStartDate, setPopulateStartDate] = useState<string>(format(subMonths(new Date(), 2), 'yyyy-MM-dd'));
  const [populateEndDate, setPopulateEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [populateStudentCount, setPopulateStudentCount] = useState<number>(5);
  const [populateTotalLessons, setPopulateTotalLessons] = useState<number>(40);
  const [isPopulating, setIsPopulating] = useState<boolean>(false);
  const [populateProgress, setPopulateProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [populateResults, setPopulateResults] = useState<any>(null);
  // Backup states
  const [backupFilter, setBackupFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [backupTeacherId, setBackupTeacherId] = useState<string>('');
  const [backupMode, setBackupMode] = useState<'all' | 'teacher' | 'students'>('all');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState<any>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [allStudentsForBackup, setAllStudentsForBackup] = useState<any[]>([]);
  const [backupStudentSearch, setBackupStudentSearch] = useState('');
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
    } else if (user && userData?.role !== 'admin') {
      // Verificar se o contrato expirou (apenas se não for isento)
      if (userData?.isExempt) {
        router.push('/');
      } else if (userData?.expiresAt) {
        const expiresAt = typeof userData.expiresAt === 'string' 
          ? parseISO(userData.expiresAt) 
          : new Date(userData.expiresAt);
        
        if (isBefore(expiresAt, new Date())) {
          setShowExpirationModal(true);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } else if (user && userData?.role === 'admin') {
      fetchData();
    }
  }, [user, userData, loading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar professores
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Teacher[];
      setTeachers(data);

      // Buscar pagamentos
      const paymentsData = await firestoreService.getAll<TeacherPayment>('teacherPayments');
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, cole o JSON de importação',
        variant: 'destructive',
      });
      return;
    }

    // Se optou por vincular a um professor, precisa selecionar um
    if (linkToTeacher && !linkTeacherId) {
      toast({
        title: 'Erro',
        description: 'Selecione um professor para vincular os dados',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const data = JSON.parse(importJson);
      
      // Mapeamento de IDs
      const idMapping: {
        professores: Record<string, string>;
        alunos: Record<string, string>;
      } = {
        professores: {},
        alunos: {},
      };

      const results = {
        usuarios: 0,
        professores: 0,
        alunos: 0,
        aulas: 0,
        pagamentos: 0,
        errors: [] as string[],
      };

      // Buscar emails e nomes existentes
      const existingEmails = new Set(teachers.map(t => t.email?.toLowerCase()).filter(Boolean));
      const existingStudentNames = new Set(
        (await getDocs(collection(db, 'students'))).docs.map(d => d.data().name?.toUpperCase()).filter(Boolean)
      );

      // Se está vinculando a um professor específico, pular criação de usuários
      if (!linkToTeacher) {
        // 1. Importar Usuários (apenas se não estiver vinculando a professor específico)
        if (data.usuarios && data.usuarios.length > 0) {
          for (const usuario of data.usuarios) {
            try {
              const emailLower = usuario.email?.toLowerCase();
              if (existingEmails.has(emailLower)) {
                results.errors.push(`Usuário ${usuario.email}: já existe`);
                continue;
              }
              const newId = doc(collection(db, 'users')).id;
              await setDoc(doc(db, 'users', newId), {
                name: usuario.nome?.toUpperCase() || 'SEM NOME',
                email: emailLower,
                role: usuario.tipo === 'admin' ? 'admin' : 'teacher',
                status: 'active',
                isExempt: true,
                createdAt: usuario.data_cadastro ? new Date(usuario.data_cadastro) : serverTimestamp(),
                importedFrom: 'base44',
              });
              results.usuarios++;
            } catch (error: any) {
              results.errors.push(`Usuário ${usuario.email}: ${error.message}`);
            }
          }
        }

        // 2. Importar Professores
        if (data.professores && data.professores.length > 0) {
          for (const professor of data.professores) {
            try {
              const emailLower = professor.email?.toLowerCase();
              if (existingEmails.has(emailLower)) {
                results.errors.push(`Professor ${professor.email}: já existe`);
                continue;
              }
              const newId = doc(collection(db, 'users')).id;
              idMapping.professores[emailLower] = newId;
              idMapping.professores[professor.nome?.toUpperCase()] = newId;
              await setDoc(doc(db, 'users', newId), {
                name: professor.nome?.toUpperCase() || 'SEM NOME',
                email: emailLower,
                phone: professor.telefone || null,
                role: 'teacher',
                status: professor.status || 'active',
                isExempt: professor.mensalidade === 0,
                notes: professor.observacoes || null,
                createdAt: professor.data_cadastro ? new Date(professor.data_cadastro) : serverTimestamp(),
                importedFrom: 'base44',
              });
              results.professores++;
            } catch (error: any) {
              results.errors.push(`Professor ${professor.nome}: ${error.message}`);
            }
          }
        }
      }

      // ID do professor para vincular (se selecionado)
      const teacherIdToLink = linkToTeacher ? linkTeacherId : null;

      // 3. Importar Alunos
      if (data.alunos && data.alunos.length > 0) {
        for (const aluno of data.alunos) {
          try {
            const nameUpper = aluno.nome?.toUpperCase();
            if (existingStudentNames.has(nameUpper)) {
              results.errors.push(`Aluno ${aluno.nome}: já existe`);
              continue;
            }
            const newId = doc(collection(db, 'students')).id;
            idMapping.alunos[aluno.nome] = newId;
            idMapping.alunos[nameUpper] = newId;
            await setDoc(doc(db, 'students', newId), {
              name: nameUpper || 'SEM NOME',
              email: aluno.email?.toLowerCase() || null,
              phone: aluno.telefone || null,
              guardianName: aluno.responsavel?.toUpperCase() || null,
              guardianPhone: aluno.telefone_responsavel || null,
              subject: aluno.disciplina || null,
              turma: aluno.turma || null,
              monthlyFee: aluno.mensalidade || 0,
              paymentDay: aluno.dia_pagamento || 1,
              status: aluno.status || 'active',
              contractedLessons: aluno.aulas_contratadas || 0,
              completedLessonsInCycle: 0,
              notes: aluno.observacoes || null,
              startDate: aluno.data_inicio || null,
              teacherId: teacherIdToLink,
              chargeFee: true,
              createdAt: aluno.data_cadastro ? new Date(aluno.data_cadastro) : serverTimestamp(),
              importedFrom: 'base44',
            });
            results.alunos++;
          } catch (error: any) {
            results.errors.push(`Aluno ${aluno.nome}: ${error.message}`);
          }
        }
      }

      // 4. Importar Aulas
      if (data.aulas && data.aulas.length > 0) {
        for (const aula of data.aulas) {
          try {
            const newId = doc(collection(db, 'lessons')).id;
            const studentId = idMapping.alunos[aula.aluno_nome] || idMapping.alunos[aula.aluno_nome?.toUpperCase()] || null;
            await setDoc(doc(db, 'lessons', newId), {
              date: aula.data,
              startTime: aula.horario_inicio || null,
              endTime: aula.horario_fim || null,
              studentId: studentId,
              studentName: aula.aluno_nome?.toUpperCase() || null,
              subject: aula.disciplina || null,
              contentCovered: aula.conteudo || null,
              status: aula.status === 'completed' ? 'completed' : 'scheduled',
              attendance: aula.presenca === 'present' ? 'present' : aula.presenca === 'absent' ? 'absent' : null,
              endOfCycle: aula.fim_de_ciclo || false,
              notes: aula.observacoes || null,
              teacherId: teacherIdToLink,
              createdAt: aula.data_cadastro ? new Date(aula.data_cadastro) : serverTimestamp(),
              importedFrom: 'base44',
            });
            results.aulas++;
          } catch (error: any) {
            results.errors.push(`Aula ${aula.data}: ${error.message}`);
          }
        }
      }

      // 5. Importar Pagamentos
      if (data.pagamentos && data.pagamentos.length > 0) {
        for (const pagamento of data.pagamentos) {
          try {
            const newId = doc(collection(db, 'payments')).id;
            const studentId = idMapping.alunos[pagamento.aluno_nome] || idMapping.alunos[pagamento.aluno_nome?.toUpperCase()] || null;
            await setDoc(doc(db, 'payments', newId), {
              studentId: studentId,
              studentName: pagamento.aluno_nome?.toUpperCase() || null,
              amount: pagamento.valor || 0,
              paymentDate: pagamento.data_pagamento || null,
              dueDate: pagamento.data_vencimento || null,
              status: pagamento.status === 'paid' ? 'paid' : pagamento.status || 'pending',
              referenceMonth: pagamento.mes_referencia || null,
              notes: pagamento.observacoes || null,
              teacherId: teacherIdToLink,
              createdAt: pagamento.data_cadastro ? new Date(pagamento.data_cadastro) : serverTimestamp(),
              importedFrom: 'base44',
            });
            results.pagamentos++;
          } catch (error: any) {
            results.errors.push(`Pagamento ${pagamento.aluno_nome}: ${error.message}`);
          }
        }
      }

      setImportResults(results);
      const total = results.usuarios + results.professores + results.alunos + results.aulas + results.pagamentos;
      toast({
        title: 'Sucesso!',
        description: `Importação concluída! ${total} registros importados.`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'JSON inválido. Verifique o formato.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Associar dados importados a um professor
  const handleAssignData = async () => {
    if (!assignTeacherId) {
      toast({
        title: 'Erro',
        description: 'Selecione um professor',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Atualizar alunos sem teacherId
      const studentsSnapshot = await getDocs(
        query(collection(db, 'students'), where('teacherId', '==', null))
      );
      for (const studentDoc of studentsSnapshot.docs) {
        await updateDoc(doc(db, 'students', studentDoc.id), { teacherId: assignTeacherId });
      }

      // Atualizar aulas sem teacherId
      const lessonsSnapshot = await getDocs(
        query(collection(db, 'lessons'), where('teacherId', '==', null))
      );
      for (const lessonDoc of lessonsSnapshot.docs) {
        await updateDoc(doc(db, 'lessons', lessonDoc.id), { teacherId: assignTeacherId });
      }

      toast({
        title: 'Sucesso!',
        description: `${studentsSnapshot.size} alunos e ${lessonsSnapshot.size} aulas associados ao professor!`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Limpar dados importados do Base44
  const handleClearImportedData = async () => {
    if (!confirm('Tem certeza que deseja excluir TODOS os dados importados do Base44?\n\nIsso irá apagar:\n- Alunos importados\n- Aulas importadas\n- Pagamentos importados\n\nEsta ação não pode ser desfeita!')) {
      return;
    }

    setIsAssigning(true);
    try {
      let deletedCount = { students: 0, lessons: 0, payments: 0 };

      // Excluir alunos importados
      const studentsSnapshot = await getDocs(
        query(collection(db, 'students'), where('importedFrom', '==', 'base44'))
      );
      for (const studentDoc of studentsSnapshot.docs) {
        await deleteDoc(doc(db, 'students', studentDoc.id));
        deletedCount.students++;
      }

      // Excluir aulas importadas
      const lessonsSnapshot = await getDocs(
        query(collection(db, 'lessons'), where('importedFrom', '==', 'base44'))
      );
      for (const lessonDoc of lessonsSnapshot.docs) {
        await deleteDoc(doc(db, 'lessons', lessonDoc.id));
        deletedCount.lessons++;
      }

      // Excluir pagamentos importados
      const paymentsSnapshot = await getDocs(
        query(collection(db, 'payments'), where('importedFrom', '==', 'base44'))
      );
      for (const paymentDoc of paymentsSnapshot.docs) {
        await deleteDoc(doc(db, 'payments', paymentDoc.id));
        deletedCount.payments++;
      }

      const total = deletedCount.students + deletedCount.lessons + deletedCount.payments;
      toast({
        title: 'Dados excluídos!',
        description: `${total} registros removidos (${deletedCount.students} alunos, ${deletedCount.lessons} aulas, ${deletedCount.payments} pagamentos)`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupResult(null);
    try {
      // Fetch all data from all collections
      const [studentsData, lessonsData, paymentsData, usersData] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'lessons')),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'users')),
      ]);

      let allStudents = studentsData.docs.map(d => ({ id: d.id, ...d.data() }));
      let allLessons = lessonsData.docs.map(d => ({ id: d.id, ...d.data() }));
      let allPayments = paymentsData.docs.map(d => ({ id: d.id, ...d.data() }));
      const allUsers = usersData.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter by teacher if specific teacher selected
      if (backupMode === 'teacher' && backupTeacherId) {
        allStudents = allStudents.filter((s: any) => s.teacherId === backupTeacherId);
        allLessons = allLessons.filter((l: any) => l.teacherId === backupTeacherId);
        allPayments = allPayments.filter((p: any) => p.teacherId === backupTeacherId);
      }

      // Filter by specific students selected
      if (backupMode === 'students' && selectedStudentIds.length > 0) {
        const selectedSet = new Set(selectedStudentIds);
        allStudents = allStudents.filter((s: any) => selectedSet.has(s.id));
        allLessons = allLessons.filter((l: any) => l.studentId && selectedSet.has(l.studentId));
        allPayments = allPayments.filter((p: any) => p.studentId && selectedSet.has(p.studentId));
      }

      // Filter by status (active/inactive)
      if (backupFilter !== 'all') {
        allStudents = allStudents.filter((s: any) => s.status === backupFilter);
        // Also filter lessons and payments to only include those from filtered students
        const filteredStudentIds = new Set(allStudents.map((s: any) => s.id));
        allLessons = allLessons.filter((l: any) => !l.studentId || filteredStudentIds.has(l.studentId));
        allPayments = allPayments.filter((p: any) => !p.studentId || filteredStudentIds.has(p.studentId));
      }

      // Clean data for backup (remove undefined values and convert timestamps)
      const cleanData = (data: any[]) => data.map(item => {
        const cleaned: Record<string, any> = {};
        Object.entries(item).forEach(([key, value]) => {
          if (value === undefined) return;
          // Convert Firestore timestamps to ISO strings
          if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
            cleaned[key] = value.toDate().toISOString();
          } else {
            cleaned[key] = value;
          }
        });
        return cleaned;
      });

      const backupData = {
        _metadata: {
          version: '1.0',
          exportDate: new Date().toISOString(),
          system: 'professor-pro',
          filter: backupFilter,
          backupMode: backupMode,
          teacherId: backupMode === 'teacher' ? backupTeacherId : null,
          selectedStudentIds: backupMode === 'students' ? selectedStudentIds : null,
          counts: {
            students: allStudents.length,
            lessons: allLessons.length,
            payments: allPayments.length,
            users: allUsers.length,
          },
        },
        students: cleanData(allStudents),
        lessons: cleanData(allLessons),
        payments: cleanData(allPayments),
        users: cleanData(allUsers),
      };

      // Create and download JSON file
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmmss');
      const filterStr = backupFilter !== 'all' ? `_${backupFilter}` : '';
      const teacherStr = backupMode === 'teacher' ? '_professor' : backupMode === 'students' ? `_alunos-selecionados` : '_todos';
      link.download = `backup_professor-pro${filterStr}${teacherStr}_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupResult({
        students: allStudents.length,
        lessons: allLessons.length,
        payments: allPayments.length,
        users: allUsers.length,
        fileName: link.download,
      });

      toast({
        title: 'Backup realizado com sucesso!',
        description: `${allStudents.length} alunos, ${allLessons.length} aulas e ${allPayments.length} pagamentos exportados.`,
      });
    } catch (error: any) {
      console.error('Backup error:', error);
      toast({
        title: 'Erro no backup',
        description: error.message || 'Erro desconhecido ao gerar backup',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (editingTeacher) {
        await updateDoc(doc(db, 'users', editingTeacher.id), {
          name: data.name.toUpperCase(),
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          role: data.role,
          expiresAt: data.isExempt ? null : data.expiresAt,
          isExempt: data.isExempt,
        });
        
        // Se foi fornecida uma nova senha, atualizar via API
        if (data.newPassword && data.newPassword.length >= 6) {
          try {
            const response = await fetch('/api/create-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: data.email.toLowerCase(),
                password: data.newPassword,
                displayName: data.name.toUpperCase(),
                teacherId: editingTeacher.id,
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              toast({
                title: 'Aviso',
                description: `Professor atualizado, mas houve erro ao alterar a senha: ${errorData.error || 'Erro desconhecido'}`,
                variant: 'destructive',
              });
            } else {
              toast({ 
                title: 'Professor atualizado!',
                description: 'Dados e senha atualizados com sucesso.'
              });
            }
          } catch (passwordError: any) {
            console.error('Erro ao atualizar senha:', passwordError);
            toast({
              title: 'Aviso',
              description: 'Professor atualizado, mas houve erro ao alterar a senha.',
              variant: 'destructive',
            });
          }
        } else {
          toast({ title: 'Professor atualizado!' });
        }
      } else {
        const newId = `teacher-${Date.now()}`;
        await setDoc(doc(db, 'users', newId), {
          name: data.name.toUpperCase(),
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          role: data.role,
          status: 'active',
          expiresAt: data.isExempt ? null : data.expiresAt,
          isExempt: data.isExempt,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Professor cadastrado!' });
      }

      setShowForm(false);
      setEditingTeacher(null);
      fetchData();
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar professor',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Verificar se há dados vinculados
    const studentsSnapshot = await getDocs(query(collection(db, 'students'), where('teacherId', '==', id)));
    const lessonsSnapshot = await getDocs(query(collection(db, 'lessons'), where('teacherId', '==', id)));
    const paymentsSnapshot = await getDocs(query(collection(db, 'payments'), where('teacherId', '==', id)));
    const teacherPaymentsSnapshot = await getDocs(query(collection(db, 'teacherPayments'), where('teacherId', '==', id)));
    
    // Buscar o teacher para pegar o uid (se tiver acesso auth)
    const teacherToDelete = teachers.find(t => t.id === id);
    const hasAuthAccess = teacherToDelete?.uid || teacherToDelete?.hasAuth;
    
    const totalLinked = studentsSnapshot.size + lessonsSnapshot.size + paymentsSnapshot.size + teacherPaymentsSnapshot.size;
    
    let confirmMessage = 'Deseja realmente excluir este professor?';
    if (totalLinked > 0 && hasAuthAccess) {
      confirmMessage = `ATENÇÃO! Este professor possui:\n\n- ${studentsSnapshot.size} aluno(s)\n- ${lessonsSnapshot.size} aula(s)\n- ${paymentsSnapshot.size} pagamento(s) de alunos\n- ${teacherPaymentsSnapshot.size} mensalidade(s)\n- Acesso ao sistema (login)\n\nTodos esses dados também serão EXCLUÍDOS e ele PERDERÁ O ACESSO!\n\nDeseja continuar?`;
    } else if (totalLinked > 0) {
      confirmMessage = `ATENÇÃO! Este professor possui:\n\n- ${studentsSnapshot.size} aluno(s)\n- ${lessonsSnapshot.size} aula(s)\n- ${paymentsSnapshot.size} pagamento(s) de alunos\n- ${teacherPaymentsSnapshot.size} mensalidade(s)\n\nTodos esses dados também serão EXCLUÍDOS!\n\nDeseja continuar?`;
    } else if (hasAuthAccess) {
      confirmMessage = 'Este professor possui ACESSO AO SISTEMA.\n\nAo excluir, ele PERDERÁ o acesso!\n\nDeseja continuar?';
    }
    
    if (!confirm(confirmMessage)) return;

    try {
      // Excluir dados vinculados - ALUNOS
      for (const studentDoc of studentsSnapshot.docs) {
        await deleteDoc(doc(db, 'students', studentDoc.id));
      }
      // Excluir dados vinculados - AULAS
      for (const lessonDoc of lessonsSnapshot.docs) {
        await deleteDoc(doc(db, 'lessons', lessonDoc.id));
      }
      // Excluir dados vinculados - PAGAMENTOS DE ALUNOS
      for (const paymentDoc of paymentsSnapshot.docs) {
        await deleteDoc(doc(db, 'payments', paymentDoc.id));
      }
      // Excluir dados vinculados - MENSALIDADES DO PROFESSOR
      for (const teacherPaymentDoc of teacherPaymentsSnapshot.docs) {
        await deleteDoc(doc(db, 'teacherPayments', teacherPaymentDoc.id));
      }
      
      // Excluir do Firebase Auth se tiver uid
      if (teacherToDelete?.uid) {
        try {
          const response = await fetch('/api/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: teacherToDelete.uid }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro ao excluir do Firebase Auth:', errorData);
            // Continua mesmo se falhar a exclusão do Auth (o usuário pode não existir no Auth)
          }
        } catch (authError) {
          console.error('Error deleting from Firebase Auth:', authError);
          // Continua mesmo se falhar a exclusão do Auth
        }
      }
      
      // Excluir o professor do Firestore
      await deleteDoc(doc(db, 'users', id));
      
      // Limpar cache local e atualizar lista
      setTeachers(prev => prev.filter(t => t.id !== id));
      
      toast({ 
        title: 'Professor excluído!', 
        description: totalLinked > 0 ? `${totalLinked} registro(s) vinculados também foram removidos` : undefined
      });
      
      // Recarregar dados do servidor para garantir sincronização
      fetchData();
    } catch (error: any) {
      console.error('Erro completo ao excluir professor:', error);
      toast({
        title: 'Erro ao excluir professor',
        description: error?.message || 'Erro desconhecido. Verifique se você tem permissão de administrador.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'users', teacher.id), { status: newStatus });
      toast({ title: `Professor ${newStatus === 'active' ? 'ativado' : 'desativado'}!` });
      fetchData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive',
      });
    }
  };

  // Payment handlers
  const handleSavePayment = async (data: any) => {
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

      setShowPaymentForm(false);
      setEditingPayment(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar pagamento', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Deseja realmente excluir este pagamento?')) return;
    try {
      await firestoreService.delete('teacherPayments', id);
      toast({ title: 'Pagamento excluído!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao excluir pagamento', variant: 'destructive' });
    }
  };

  // Clear all teacher payments (admin only)
  const handleClearAllPayments = async () => {
    // Determine which payments to delete based on filter
    let paymentsToDelete: TeacherPayment[] = [];
    let filterDescription = '';
    
    if (clearFilter === 'all') {
      paymentsToDelete = payments;
      filterDescription = 'TODOS os lançamentos';
    } else if (clearFilter === 'admin') {
      // Get admin IDs
      const adminIds = teachers.filter(t => t.role === 'admin').map(t => t.id);
      paymentsToDelete = payments.filter(p => adminIds.includes(p.teacherId || ''));
      filterDescription = 'lançamentos de ADMINISTRADORES';
    } else if (clearFilter === 'teacher' && clearTeacherId) {
      paymentsToDelete = payments.filter(p => p.teacherId === clearTeacherId);
      const teacher = teachers.find(t => t.id === clearTeacherId);
      filterDescription = `lançamentos de ${teacher?.name || 'professor selecionado'}`;
    }
    
    if (paymentsToDelete.length === 0) {
      toast({ 
        title: 'Nenhum lançamento encontrado', 
        description: 'Não há lançamentos para o filtro selecionado',
        variant: 'destructive'
      });
      return;
    }
    
    if (!confirm(`ATENÇÃO!\n\nDeseja realmente excluir ${filterDescription}?\n\nTotal: ${paymentsToDelete.length} registro(s)\n\nEsta ação não pode ser desfeita!`)) return;
    
    setIsSaving(true);
    try {
      let deletedCount = 0;
      
      for (const payment of paymentsToDelete) {
        await deleteDoc(doc(db, 'teacherPayments', payment.id));
        deletedCount++;
      }
      
      toast({ 
        title: 'Lançamentos excluídos!', 
        description: `${deletedCount} registros removidos` 
      });
      setShowClearPaymentsModal(false);
      setClearFilter('all');
      setClearTeacherId('');
      fetchData();
    } catch (error) {
      toast({ 
        title: 'Erro ao excluir lançamentos', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Set Password handler
  const handleSetPassword = async (password: string) => {
    if (!selectedTeacher) return;
    
    setIsSettingPassword(true);
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedTeacher.email,
          password: password,
          displayName: selectedTeacher.name,
          teacherId: selectedTeacher.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      toast({
        title: 'Sucesso!',
        description: `Senha definida para ${selectedTeacher.name}. O professor já pode fazer login!`,
      });

      setShowPasswordModal(false);
      setSelectedTeacher(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao definir senha',
        variant: 'destructive',
      });
    } finally {
      setIsSettingPassword(false);
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

  const checkExpired = (teacher: Teacher): boolean => {
    // Se for isento, nunca expira
    if (teacher.isExempt) return false;
    if (!teacher.expiresAt) return false;
    const expiresAt = typeof teacher.expiresAt === 'string' 
      ? parseISO(teacher.expiresAt) 
      : new Date(teacher.expiresAt);
    return isBefore(expiresAt, new Date());
  };

  // Popular dados de demonstração
  const handlePopulateData = async () => {
    if (!populateTeacherId) {
      toast({
        title: 'Erro',
        description: 'Selecione um professor para popular os dados',
        variant: 'destructive',
      });
      return;
    }

    setIsPopulating(true);
    setPopulateResults(null);
    setPopulateProgress({ current: 0, total: 100, message: 'Iniciando...' });

    try {
      const results = {
        students: 0,
        lessons: 0,
        payments: 0,
        cancelledLessons: 0,
        scheduledLessons: 0,
        overduePayments: 0,
        inactiveStudents: 0,
        errors: [] as string[],
      };

      const totalSteps = 3 + populateStudentCount + populateTotalLessons + (populateStudentCount * 3);
      let currentStep = 0;

      const updateProgress = (message: string) => {
        currentStep++;
        setPopulateProgress({ current: currentStep, total: totalSteps, message });
      };

      // SEMPRE limpar dados do professor antes de popular
      updateProgress('Excluindo alunos antigos...');
      const studentsSnapshot = await getDocs(
        query(collection(db, 'students'), where('teacherId', '==', populateTeacherId))
      );
      for (const studentDoc of studentsSnapshot.docs) {
        await deleteDoc(doc(db, 'students', studentDoc.id));
      }

      updateProgress('Excluindo aulas antigas...');
      const lessonsSnapshot = await getDocs(
        query(collection(db, 'lessons'), where('teacherId', '==', populateTeacherId))
      );
      for (const lessonDoc of lessonsSnapshot.docs) {
        await deleteDoc(doc(db, 'lessons', lessonDoc.id));
      }

      updateProgress('Excluindo pagamentos antigos...');
      const paymentsSnapshot = await getDocs(
        query(collection(db, 'payments'), where('teacherId', '==', populateTeacherId))
      );
      for (const paymentDoc of paymentsSnapshot.docs) {
        await deleteDoc(doc(db, 'payments', paymentDoc.id));
      }

      // Dados de exemplo para nomes de alunos
      const firstNames = ['MARIA', 'JOSE', 'ANA', 'JOAO', 'FRANCISCO', 'ANTONIO', 'CARLOS', 'PAULO', 'PEDRO', 'LUCAS', 'MARCOS', 'LUIS', 'GABRIEL', 'RAFAEL', 'DANIEL', 'MARCELO', 'BRUNO', 'EDUARDO', 'FELIPE', 'RODRIGO', 'GUSTAVO', 'ANDRE', 'FERNANDO', 'FABIO', 'LEONARDO', 'DIEGO', 'MATHEUS', 'THIAGO', 'VINICIUS', 'CAIO'];
      const lastNames = ['SILVA', 'SANTOS', 'OLIVEIRA', 'SOUSA', 'RODRIGUES', 'FERREIRA', 'ALVES', 'PEREIRA', 'LIMA', 'GOMES', 'COSTA', 'RIBEIRO', 'MARTINS', 'CARVALHO', 'ALMEIDA', 'LOPES', 'SOUSA', 'FERNANDES', 'PEREIRA', 'OLIVEIRA'];
      const subjects = ['MATEMATICA', 'PORTUGUES', 'INGLES', 'FISICA', 'QUIMICA', 'BIOLOGIA', 'HISTORIA', 'GEOGRAFIA', 'FILOSOFIA', 'SOCIOLOGIA', 'REDAÇÃO', 'ESPANHOL'];
      const contents = ['REVISAO GERAL', 'EXERCICIOS PRATICOS', 'PROVA APLICADA', 'DUVIDAS E REVISAO', 'CONTEUDO NOVO', 'SIMULADO', 'ATIVIDADE AVALIATIVA', 'REFORCO ESCOLAR', 'PREPARATORIO ENEM', 'EXERCICIOS DE FIXACAO', 'CORRECAO DE PROVA', 'ESTUDO DIRIGIDO'];
      const hours = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

      const startDate = parseISO(populateStartDate);
      const endDate = parseISO(populateEndDate);
      const today = new Date();

      // Gerar lista de dias úteis (segunda a sexta) no período
      const weekdays: Date[] = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        const dayOfWeek = getDay(currentDate);
        // 1 = segunda, 2 = terça, 3 = quarta, 4 = quinta, 5 = sexta
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          weekdays.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }

      // Criar alunos com diferentes estados
      const createdStudents: { id: string; name: string; subject: string; monthlyFee: number; status: string }[] = [];
      
      for (let i = 0; i < populateStudentCount; i++) {
        try {
          updateProgress(`Criando aluno ${i + 1}/${populateStudentCount}...`);
          
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          const name = `${firstName} ${lastName}`;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const monthlyFee = Math.floor(Math.random() * 300) + 150;
          
          // 15% de chance de aluno inativo (para simular retenção)
          const isInactive = Math.random() < 0.15;
          const studentStatus = isInactive ? 'inactive' : 'active';

          const studentId = doc(collection(db, 'students')).id;
          await setDoc(doc(db, 'students', studentId), {
            name,
            subject,
            monthlyFee,
            paymentDay: Math.floor(Math.random() * 28) + 1,
            status: studentStatus,
            chargeFee: true,
            contractedLessons: Math.ceil(populateTotalLessons / populateStudentCount),
            completedLessonsInCycle: isInactive ? 0 : Math.floor(Math.random() * Math.ceil(populateTotalLessons / populateStudentCount)),
            teacherId: populateTeacherId,
            startDate: populateStartDate,
            phone: `(${Math.floor(Math.random() * 90) + 11}) 9${Math.floor(Math.random() * 9000)}-${Math.floor(Math.random() * 9000)}`,
            createdAt: serverTimestamp(),
            isPopulated: true,
          });

          createdStudents.push({ id: studentId, name, subject, monthlyFee, status: studentStatus });
          results.students++;
          if (isInactive) results.inactiveStudents++;
        } catch (error: any) {
          results.errors.push(`Erro ao criar aluno ${i + 1}: ${error.message}`);
        }
      }

      // Distribuir aulas em dias úteis de forma equilibrada entre alunos
      const lessonsPerStudent = Math.ceil(populateTotalLessons / createdStudents.length);
      let lessonIndex = 0;
      
      for (let i = 0; i < populateTotalLessons && weekdays.length > 0; i++) {
        try {
          const studentIndex = i % createdStudents.length;
          const student = createdStudents[studentIndex];
          
          // Escolher um dia útil (distribuir uniformemente)
          const weekdayIndex = Math.floor((i / populateTotalLessons) * weekdays.length);
          const lessonDate = weekdays[Math.min(weekdayIndex, weekdays.length - 1)];
          
          updateProgress(`Criando aula ${i + 1}/${populateTotalLessons} - ${student.name}...`);
          
          const content = contents[Math.floor(Math.random() * contents.length)];
          const startTime = hours[Math.floor(Math.random() * hours.length)];

          // Definir status da aula com distribuição realista
          let lessonStatus: string;
          const isPastLesson = lessonDate <= today;
          
          if (student.status === 'inactive' && isPastLesson && Math.random() < 0.5) {
            lessonStatus = 'cancelled';
          } else if (isPastLesson) {
            const rand = Math.random();
            if (rand < 0.75) lessonStatus = 'completed';
            else if (rand < 0.90) lessonStatus = 'cancelled';
            else lessonStatus = 'rescheduled';
          } else {
            const rand = Math.random();
            if (rand < 0.85) lessonStatus = 'scheduled';
            else if (rand < 0.95) lessonStatus = 'rescheduled';
            else lessonStatus = 'cancelled';
          }

          const lessonId = doc(collection(db, 'lessons')).id;
          await setDoc(doc(db, 'lessons', lessonId), {
            date: format(lessonDate, 'yyyy-MM-dd'),
            startTime,
            studentId: student.id,
            studentName: student.name,
            subject: student.subject,
            contentCovered: lessonStatus === 'completed' ? content : null,
            status: lessonStatus,
            endOfCycle: false,
            teacherId: populateTeacherId,
            createdAt: serverTimestamp(),
            isPopulated: true,
          });

          results.lessons++;
          if (lessonStatus === 'cancelled') results.cancelledLessons++;
          if (lessonStatus === 'scheduled') results.scheduledLessons++;
        } catch (error: any) {
          results.errors.push(`Erro ao criar aula ${i + 1}: ${error.message}`);
        }
      }

      // Criar pagamentos para cada aluno
      const months = [];
      let currentMonth = startOfMonth(startDate);
      while (currentMonth <= endDate) {
        months.push(format(currentMonth, 'yyyy-MM'));
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      }

      for (const student of createdStudents) {
        const monthsToPay = student.status === 'inactive' 
          ? months.slice(0, Math.floor(months.length * 0.5))
          : months;

        for (const month of monthsToPay) {
          try {
            updateProgress(`Criando pagamento - ${student.name} (${month})...`);
            
            let paymentStatus: string;
            let paymentDate: string | null = null;
            const monthDueDate = new Date(month + '-10');
            const isPastDue = monthDueDate < today;

            if (student.status === 'inactive' && months.indexOf(month) >= monthsToPay.length - 1) {
              paymentStatus = isPastDue ? 'overdue' : 'pending';
            } else if (isPastDue) {
              const rand = Math.random();
              if (rand < 0.65) {
                paymentStatus = 'paid';
                paymentDate = format(new Date(month + '-' + (Math.floor(Math.random() * 10) + 5)), 'yyyy-MM-dd');
              } else if (rand < 0.85) {
                paymentStatus = 'overdue';
              } else {
                paymentStatus = 'pending';
              }
            } else {
              const rand = Math.random();
              if (rand < 0.30) {
                paymentStatus = 'paid';
                paymentDate = format(new Date(), 'yyyy-MM-dd');
              } else {
                paymentStatus = 'pending';
              }
            }

            const paymentId = doc(collection(db, 'payments')).id;
            await setDoc(doc(db, 'payments', paymentId), {
              studentId: student.id,
              studentName: student.name,
              amount: student.monthlyFee,
              paymentDate,
              dueDate: format(new Date(month + '-10'), 'yyyy-MM-dd'),
              status: paymentStatus,
              referenceMonth: month,
              teacherId: populateTeacherId,
              createdAt: serverTimestamp(),
              isPopulated: true,
            });

            results.payments++;
            if (paymentStatus === 'overdue') results.overduePayments++;
          } catch (error: any) {
            results.errors.push(`Erro ao criar pagamento para ${student.name} em ${month}: ${error.message}`);
          }
        }
      }

      setPopulateResults(results);
      setPopulateProgress({ current: totalSteps, total: totalSteps, message: 'Concluído!' });
      toast({
        title: 'Dados Populados!',
        description: `${results.students} alunos, ${results.lessons} aulas e ${results.payments} pagamentos criados.`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao popular dados',
        variant: 'destructive',
      });
    } finally {
      setIsPopulating(false);
      setPopulateProgress(null);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name?.toLowerCase().includes(search.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || teacher.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Helper to filter students for backup selection
  const getFilteredBackupStudents = () => {
    let filtered = allStudentsForBackup;
    if (backupStudentSearch) {
      filtered = filtered.filter((s: any) =>
        (s.name || '').toLowerCase().includes(backupStudentSearch.toLowerCase()) ||
        (s.subject || '').toLowerCase().includes(backupStudentSearch.toLowerCase())
      );
    }
    if (backupFilter !== 'all') {
      filtered = filtered.filter((s: any) => s.status === backupFilter);
    }
    return filtered.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  };

  const totalTeachers = teachers.filter(t => t.role === 'teacher').length;
  const totalAdmins = teachers.filter(t => t.role === 'admin').length;
  const activeTeachers = teachers.filter(t => t.status === 'active' && !checkExpired(t)).length;
  const expiredTeachers = teachers.filter(t => checkExpired(t)).length;
  const exemptTeachers = teachers.filter(t => t.isExempt).length;

  // Payment stats
  const monthlyPaid = payments
    .filter((p) => p.status === 'paid' && p.paymentDate)
    .filter((p) => {
      const payDate = parseISO(p.paymentDate!);
      return payDate >= monthStart && payDate <= monthEnd;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.teacherName?.toLowerCase().includes(search.toLowerCase()) ?? false;
    return matchesSearch;
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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || userData?.role !== 'admin') {
    return (
      <>
        <AnimatePresence>
          {showExpirationModal && (
            <ExpirationModal onClose={() => {
              setShowExpirationModal(false);
              router.push('/login');
            }} darkMode={darkMode} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <AppLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                  <Shield className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    Painel Administrativo
                  </h1>
                  <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Gerencie professores e mensalidades do sistema
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setEditingTeacher(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Novo Professor
              </Button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className={`flex gap-2 mb-6 p-1 rounded-lg w-fit ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <TabButton
              active={activeTab === 'teachers'}
              onClick={() => setActiveTab('teachers')}
              icon={GraduationCap}
              darkMode={darkMode}
            >
              Professores
            </TabButton>
            <TabButton
              active={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
              icon={DollarSign}
              darkMode={darkMode}
            >
              Mensalidades
            </TabButton>
            <TabButton
              active={activeTab === 'import'}
              onClick={() => setActiveTab('import')}
              icon={Upload}
              darkMode={darkMode}
            >
              Importar
            </TabButton>
            <TabButton
              active={activeTab === 'populate'}
              onClick={() => setActiveTab('populate')}
              icon={Database}
              darkMode={darkMode}
            >
              Popular Dados
            </TabButton>
            <TabButton
              active={activeTab === 'backup'}
              onClick={() => setActiveTab('backup')}
              icon={Archive}
              darkMode={darkMode}
            >
              Backup
            </TabButton>
          </div>

          {/* Import Tab */}
          {activeTab === 'import' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl shadow-sm border p-6 ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <FileJson className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    Importar Dados do Base44
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Cole o JSON exportado do sistema anterior
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-amber-900/20 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                      Atenção
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      Registros com email ou nome já existentes serão ignorados para evitar duplicados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  JSON de Importação
                </label>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='Cole aqui o JSON exportado do Base44...'
                  rows={12}
                  className={`w-full mt-2 px-4 py-3 rounded-xl border font-mono text-sm ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Opção para vincular a um professor específico */}
              <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkToTeacher}
                    onChange={(e) => setLinkToTeacher(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded"
                  />
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Vincular dados a um professor específico
                    </span>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Os dados serão importados apenas para Alunos, Aulas e Pagamentos, vinculados ao professor selecionado. Não serão criados novos usuários.
                    </p>
                  </div>
                </label>
                
                {linkToTeacher && (
                  <div className="mt-4">
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Selecione o Professor *
                    </label>
                    <select
                      value={linkTeacherId}
                      onChange={(e) => setLinkTeacherId(e.target.value)}
                      className={`w-full mt-2 px-4 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value="">Selecione um professor...</option>
                      {teachers
                        .filter(t => t.role === 'teacher' || t.role === 'admin')
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                        .map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.email}) {teacher.role === 'admin' ? '- ADMIN' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || !importJson.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" /> Importar Dados
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportJson('');
                    setImportResults(null);
                  }}
                >
                  Limpar
                </Button>
              </div>

              {/* Resultados da Importação */}
              {importResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-xl ${
                    darkMode ? 'bg-green-900/20 border border-green-700/50' : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <h3 className={`font-semibold mb-3 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    ✓ Importação Concluída!
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {importResults.usuarios}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Usuários</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {importResults.professores}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Professores</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {importResults.alunos}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Alunos</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {importResults.aulas}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Aulas</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {importResults.pagamentos}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pagamentos</p>
                    </div>
                  </div>
                  
                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Avisos ({importResults.errors.length}):
                      </p>
                      <div className="max-h-32 overflow-y-auto">
                        {importResults.errors.slice(0, 10).map((error: string, index: number) => (
                          <p key={index} className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            • {error}
                          </p>
                        ))}
                        {importResults.errors.length > 10 && (
                          <p className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            ... e mais {importResults.errors.length - 10} avisos
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Associar Dados Importados */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`mt-6 rounded-2xl shadow-sm border p-6 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                    <Users className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Associar Dados Importados
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Vincule alunos e aulas importados a um professor
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Os dados importados ficam sem professor vinculado. Use esta função para associar todos os alunos e aulas órfãos a um professor específico.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Selecione o Professor
                    </label>
                    <select
                      value={assignTeacherId}
                      onChange={(e) => setAssignTeacherId(e.target.value)}
                      className={`w-full mt-2 px-4 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value="">Selecione um usuário...</option>
                      {teachers
                        .map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.email}) {teacher.role === 'admin' ? '- ADMIN' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAssignData}
                      disabled={isAssigning || !assignTeacherId}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Associando...
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 mr-2" /> Associar Dados
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Limpar dados importados */}
                <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        Limpar Dados Importados
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Exclui todos os alunos, aulas e pagamentos importados do Base44
                      </p>
                    </div>
                    <Button
                      onClick={handleClearImportedData}
                      disabled={isAssigning}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Limpar Importação
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-cyan-900/30' : 'bg-cyan-100'}`}>
                  <Archive className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    Backup de Dados
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Exporte os dados do sistema em formato JSON para backup ou restauração futura
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Seleção de Escopo */}
                <div>
                  <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Escopo do Backup
                  </h3>
                  <div className={`p-4 rounded-xl space-y-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="backupMode"
                        value="all"
                        checked={backupMode === 'all'}
                        onChange={() => setBackupMode('all')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          Todos os Professores
                        </span>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Backup completo de todos os dados do sistema
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="backupMode"
                        value="teacher"
                        checked={backupMode === 'teacher'}
                        onChange={() => { setBackupMode('teacher'); setSelectedStudentIds([]); }}
                        className="w-4 h-4 text-blue-600 mt-1"
                      />
                      <div className="flex-1">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          De um Professor Específico
                        </span>
                        <p className={`text-xs mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Backup apenas dos dados vinculados a um professor
                        </p>
                        {backupMode === 'teacher' && (
                          <select
                            value={backupTeacherId}
                            onChange={(e) => setBackupTeacherId(e.target.value)}
                            className={`w-full mt-2 px-3 py-2 rounded-lg border text-sm ${
                              darkMode
                                ? 'bg-slate-600 border-slate-500 text-white'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <option value="">Selecione um professor...</option>
                            {teachers
                              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                              .map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.name} ({teacher.role === 'admin' ? 'Admin' : 'Professor'})
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="backupMode"
                        value="students"
                        checked={backupMode === 'students'}
                        onChange={() => setBackupMode('students')}
                        className="w-4 h-4 text-blue-600 mt-1"
                      />
                      <div className="flex-1">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          Alunos Selecionados
                        </span>
                        <p className={`text-xs mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Escolha alunos específicos para incluir no backup
                        </p>
                        {backupMode === 'students' && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                placeholder="Buscar aluno por nome..."
                                value={backupStudentSearch}
                                onChange={(e) => setBackupStudentSearch(e.target.value)}
                                className={`text-sm ${darkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-slate-200'}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const snapshot = await getDocs(collection(db, 'students'));
                                  const studentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                                  setAllStudentsForBackup(studentsData);
                                }}
                                className={`whitespace-nowrap text-xs ${darkMode ? 'border-slate-500 text-white' : ''}`}
                              >
                                Carregar
                              </Button>
                            </div>
                            {allStudentsForBackup.length > 0 ? (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const filteredIds = getFilteredBackupStudents().map((s: any) => s.id);
                                      setSelectedStudentIds(filteredIds);
                                    }}
                                    className="text-xs h-6 px-2"
                                  >
                                    Selecionar todos
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedStudentIds([])}
                                    className="text-xs h-6 px-2"
                                  >
                                    Limpar seleção
                                  </Button>
                                  <span className={`text-xs ml-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {selectedStudentIds.length} selecionado(s)
                                  </span>
                                </div>
                                <div className={`max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1 ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                                  {getFilteredBackupStudents().map((student: any) => (
                                    <label key={student.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                                      <input
                                        type="checkbox"
                                        checked={selectedStudentIds.includes(student.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedStudentIds([...selectedStudentIds, student.id]);
                                          } else {
                                            setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                          }
                                        }}
                                        className="w-3.5 h-3.5 rounded"
                                      />
                                      <span className={`text-sm flex-1 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {student.name || 'Sem nome'}
                                      </span>
                                      {student.subject && (
                                        <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                          {student.subject}
                                        </span>
                                      )}
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        student.status === 'active' ? (darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                                        : student.status === 'inactive' ? (darkMode ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-600')
                                        : (darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700')
                                      }`}>
                                        {student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : 'Teste'}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className={`text-xs text-center py-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Clique em &quot;Carregar&quot; para buscar a lista de alunos
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Filtro de Status */}
                <div>
                  <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Filtro de Alunos
                  </h3>
                  <div className={`p-4 rounded-xl space-y-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="backupFilter"
                        value="all"
                        checked={backupFilter === 'all'}
                        onChange={() => setBackupFilter('all')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          Todos os Alunos
                        </span>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Inclui ativos, inativos e em teste
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="backupFilter"
                        value="active"
                        checked={backupFilter === 'active'}
                        onChange={() => setBackupFilter('active')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          Apenas Alunos Ativos
                        </span>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Inclui somente alunos com status ativo e suas aulas/pagamentos
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="backupFilter"
                        value="inactive"
                        checked={backupFilter === 'inactive'}
                        onChange={() => setBackupFilter('inactive')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          Apenas Alunos Inativos
                        </span>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Inclui somente alunos inativos e suas aulas/pagamentos
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Info sobre o formato */}
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <FileJson className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <p className={`font-medium text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        Formato compatível com o sistema
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        O backup é exportado em JSON com a estrutura completa dos dados (alunos, aulas, pagamentos e usuários). 
                        Este formato é compatível com a função de importação do sistema, permitindo restauração futura caso necessário. 
                        O arquivo inclui metadados como data, versão e filtros utilizados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resultado do backup */}
                {backupResult && (
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <p className={`font-medium text-sm ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        Backup gerado com sucesso!
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                        <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{backupResult.students}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Alunos</p>
                      </div>
                      <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                        <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{backupResult.lessons}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Aulas</p>
                      </div>
                      <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                        <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{backupResult.payments}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pagamentos</p>
                      </div>
                      <div className={`p-2 rounded-lg text-center ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                        <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{backupResult.users}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Usuários</p>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Arquivo: {backupResult.fileName}
                    </p>
                  </div>
                )}

                {/* Botão de backup */}
                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp || (backupMode === 'teacher' && !backupTeacherId) || (backupMode === 'students' && selectedStudentIds.length === 0)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isBackingUp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Backup...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" /> Gerar Backup JSON
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Populate Data Tab */}
          {activeTab === 'populate' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl shadow-sm border p-6 ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <Database className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    Popular Dados de Demonstração
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Gere dados fictícios para testar o sistema
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      ⚠️ Importante - Dados serão substituídos!
                    </p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Ao popular os dados, <strong>todos os alunos, aulas e pagamentos existentes</strong> do professor selecionado serão <strong>excluídos permanentemente</strong> antes de criar os novos dados de demonstração.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Selection */}
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Professor *
                    </label>
                    <select
                      value={populateTeacherId}
                      onChange={(e) => setPopulateTeacherId(e.target.value)}
                      className={`w-full mt-2 px-4 py-2.5 rounded-lg border ${
                        darkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value="">Selecione um professor...</option>
                      {teachers
                        .filter(t => t.role === 'teacher' || t.role === 'admin')
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                        .map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.email}) {teacher.role === 'admin' ? '- ADMIN' : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Data Inicial
                      </label>
                      <Input
                        type="date"
                        value={populateStartDate}
                        onChange={(e) => setPopulateStartDate(e.target.value)}
                        className={`mt-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                      />
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Data Final
                      </label>
                      <Input
                        type="date"
                        value={populateEndDate}
                        onChange={(e) => setPopulateEndDate(e.target.value)}
                        className={`mt-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Quantities */}
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Número de Alunos
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={populateStudentCount}
                        onChange={(e) => setPopulateStudentCount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className={`font-bold text-lg w-8 text-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {populateStudentCount}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Total de Aulas (Segunda a Sexta)
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={populateTotalLessons}
                        onChange={(e) => setPopulateTotalLessons(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className={`font-bold text-lg w-12 text-center ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {populateTotalLessons}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Distribuídas em dias úteis (seg-sex)
                    </p>
                  </div>

                  {/* Preview */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
                    <h4 className={`font-medium mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      📊 Prévia dos Dados que serão criados
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                        <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {populateStudentCount}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Alunos</p>
                      </div>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                        <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {populateTotalLessons}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Aulas</p>
                      </div>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                        <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {populateStudentCount * 3}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pagamentos</p>
                      </div>
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'} space-y-1`}>
                      <p>• <strong>Aulas:</strong> ~75% concluídas, ~15% canceladas, ~10% remarcadas</p>
                      <p>• <strong>Pagamentos:</strong> ~65% pagos, ~20% atrasados, ~15% pendentes</p>
                      <p>• <strong>Alunos:</strong> ~15% inativos (simulando retenção)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isPopulating && populateProgress && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                      {populateProgress.message}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {Math.round((populateProgress.current / populateProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}>
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(populateProgress.current / populateProgress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {populateProgress.current} de {populateProgress.total} operações
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handlePopulateData}
                  disabled={isPopulating || !populateTeacherId}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isPopulating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Populando Dados...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" /> Popular Dados
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPopulateTeacherId('');
                    setPopulateStartDate(format(subMonths(new Date(), 2), 'yyyy-MM-dd'));
                    setPopulateEndDate(format(new Date(), 'yyyy-MM-dd'));
                    setPopulateStudentCount(5);
                    setPopulateTotalLessons(40);
                    setPopulateResults(null);
                  }}
                  disabled={isPopulating}
                >
                  Resetar
                </Button>
              </div>

              {/* Results */}
              {populateResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-xl ${
                    darkMode ? 'bg-green-900/20 border border-green-700/50' : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <h3 className={`font-semibold mb-3 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    ✓ Dados Populados com Sucesso!
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {populateResults.students}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Alunos</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {populateResults.lessons}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Aulas</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {populateResults.payments}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pagamentos</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-xl font-bold text-rose-500`}>
                        {populateResults.cancelledLessons}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Canceladas</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-xl font-bold text-amber-500`}>
                        {populateResults.overduePayments}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Atrasados</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-xl font-bold text-slate-400`}>
                        {populateResults.inactiveStudents}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Inativos</p>
                    </div>
                  </div>
                  
                  {populateResults.errors && populateResults.errors.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Avisos ({populateResults.errors.length}):
                      </p>
                      <div className="max-h-24 overflow-y-auto">
                        {populateResults.errors.slice(0, 5).map((error: string, index: number) => (
                          <p key={index} className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatsCard
                  title="Total Professores"
                  value={totalTeachers}
                  subtitle={`${activeTeachers} ativos`}
                  icon={GraduationCap}
                  color="blue"
                  darkMode={darkMode}
                />
                <StatsCard
                  title="Administradores"
                  value={totalAdmins}
                  subtitle="Com acesso total"
                  icon={Shield}
                  color="purple"
                  darkMode={darkMode}
                />
                <StatsCard
                  title="Planos Expirados"
                  value={expiredTeachers}
                  subtitle="Necessitam renovação"
                  icon={AlertTriangle}
                  color="red"
                  darkMode={darkMode}
                />
                <StatsCard
                  title="Isentos"
                  value={exemptTeachers}
                  subtitle="Não pagam mensalidade"
                  icon={Crown}
                  color="amber"
                  darkMode={darkMode}
                />
                <StatsCard
                  title="Total Usuários"
                  value={teachers.length}
                  subtitle="No sistema"
                  icon={Users}
                  color="green"
                  darkMode={darkMode}
                />
              </div>

              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-4 mb-6"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`pl-10 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className={`w-full sm:w-48 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="teacher">Professores</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Teachers Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl shadow-sm border overflow-hidden ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-slate-700' : 'bg-slate-50'}>
                      <tr>
                        <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          Usuário
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          Contato
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          Cargo
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          Status
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          Acesso
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          Expiração
                        </th>
                        <th className={`px-6 py-4 text-right text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                      {filteredTeachers.map((teacher, index) => {
                        const isExpired = checkExpired(teacher);
                        return (
                          <motion.tr
                            key={teacher.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} ${
                              isExpired ? 'bg-red-50 dark:bg-red-900/10' : ''
                            } transition-colors`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  teacher.isExempt 
                                    ? 'bg-amber-100 text-amber-600' 
                                    : isExpired 
                                      ? 'bg-red-100 text-red-600' 
                                      : darkMode 
                                        ? 'bg-slate-700 text-white' 
                                        : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {teacher.isExempt ? (
                                    <Crown className="w-5 h-5" />
                                  ) : (
                                    (teacher.name || 'U').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                    {teacher.name || 'SEM NOME'}
                                  </p>
                                  {teacher.isExempt && (
                                    <span className="text-xs text-amber-600 font-medium">ISENTO</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {teacher.email}
                              </p>
                              {teacher.phone && (
                                <p className={`text-xs flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  <Phone className="w-3 h-3" /> {teacher.phone}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                teacher.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {teacher.role === 'admin' ? 'Administrador' : 'Professor'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {teacher.isExempt ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  <Crown className="w-3 h-3" /> Isento
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <AlertTriangle className="w-3 h-3" /> Expirado
                                </span>
                              ) : teacher.status === 'inactive' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  <XCircle className="w-3 h-3" /> Inativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3" /> Ativo
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {teacher.hasAuth ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <Key className="w-3 h-3" /> Com acesso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                  <AlertCircle className="w-3 h-3" /> Sem senha
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {teacher.isExempt ? (
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Sem expiração
                                </p>
                              ) : teacher.expiresAt ? (
                                <p className={`text-sm ${isExpired ? 'text-red-600 font-medium' : darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {format(
                                    typeof teacher.expiresAt === 'string' 
                                      ? parseISO(teacher.expiresAt) 
                                      : new Date(teacher.expiresAt),
                                    'dd/MM/yyyy',
                                    { locale: ptBR }
                                  )}
                                </p>
                              ) : (
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Sem data
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!teacher.hasAuth && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedTeacher(teacher);
                                      setShowPasswordModal(true);
                                    }}
                                    className="text-orange-500 hover:bg-orange-50"
                                    title="Definir Senha"
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingTeacher(teacher);
                                    setShowForm(true);
                                  }}
                                  className={darkMode ? 'hover:bg-slate-700' : ''}
                                  title="Editar"
                                >
                                  <Edit className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleStatus(teacher)}
                                  className={darkMode ? 'hover:bg-slate-700' : ''}
                                  title={teacher.status === 'inactive' ? 'Ativar' : 'Desativar'}
                                >
                                  {teacher.status === 'inactive' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-orange-500" />
                                  )}
                                </Button>
                                {teacher.id !== userData?.uid && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(teacher.id)}
                                    className="text-red-500 hover:bg-red-50"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredTeachers.length === 0 && (
                  <div className="text-center py-12">
                    <GraduationCap className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Nenhum professor encontrado
                    </h3>
                    <p className={`mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Comece cadastrando um novo professor
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" /> Cadastrar Professor
                    </Button>
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <>
              {/* Payment Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <StatsCard
                  title="Pago no Mês"
                  value={`R$ ${monthlyPaid.toFixed(2)}`}
                  subtitle={format(today, "MMMM 'de' yyyy", { locale: ptBR })}
                  icon={TrendingUp}
                  color="green"
                  darkMode={darkMode}
                />
                <StatsCard
                  title="A Receber"
                  value={`R$ ${pendingPayments.toFixed(2)}`}
                  subtitle="Pendente + Atrasado"
                  icon={Clock}
                  color="amber"
                  darkMode={darkMode}
                />
              </div>

              {/* Payments Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por professor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`pl-10 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                  />
                </div>
                <div className="flex gap-2">
                  {payments.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowClearPaymentsModal(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Limpar Tudo
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setEditingPayment(null);
                      setShowPaymentForm(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" /> Nova Mensalidade
                  </Button>
                </div>
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
                          Vencimento
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
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
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
                              {payment.dueDate
                                ? format(parseISO(payment.dueDate), 'dd/MM/yyyy')
                                : '-'}
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
                                        setShowPaymentForm(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-2" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeletePayment(payment.id)}
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
            </>
          )}
        </div>

        {/* Form Modals */}
        <AnimatePresence>
          {showForm && (
            <TeacherForm
              teacher={editingTeacher}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingTeacher(null);
              }}
              isLoading={isSaving}
              darkMode={darkMode}
            />
          )}
          {showPaymentForm && (
            <TeacherPaymentForm
              payment={editingPayment}
              teachers={teachers}
              onSave={handleSavePayment}
              onCancel={() => {
                setShowPaymentForm(false);
                setEditingPayment(null);
              }}
              isLoading={isSaving}
              darkMode={darkMode}
            />
          )}
          {showPasswordModal && selectedTeacher && (
            <SetPasswordModal
              teacher={selectedTeacher}
              onSave={handleSetPassword}
              onCancel={() => {
                setShowPasswordModal(false);
                setSelectedTeacher(null);
              }}
              isLoading={isSettingPassword}
              darkMode={darkMode}
            />
          )}
          {showClearPaymentsModal && (
            <ClearPaymentsModal
              teachers={teachers}
              payments={payments}
              clearFilter={clearFilter}
              setClearFilter={setClearFilter}
              clearTeacherId={clearTeacherId}
              setClearTeacherId={setClearTeacherId}
              onConfirm={handleClearAllPayments}
              onCancel={() => {
                setShowClearPaymentsModal(false);
                setClearFilter('all');
                setClearTeacherId('');
              }}
              isLoading={isSaving}
              darkMode={darkMode}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
