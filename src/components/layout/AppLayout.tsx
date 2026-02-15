'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Menu,
  GraduationCap,
  Moon,
  Sun,
  Lock,
  LogOut,
  X,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Alunos', href: '/students', icon: Users },
  { name: 'Aulas', href: '/lessons', icon: Calendar },
  { name: 'Financeiro', href: '/finance', icon: DollarSign },
];

const adminNavigation = [
  { name: 'Painel Admin', href: '/admin', icon: Shield },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved) {
        const isDark = JSON.parse(saved);
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
        return isDark;
      }
    }
    return false;
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const allNavigation = userData?.role === 'admin'
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 ${
          darkMode ? 'bg-gradient-to-b from-slate-700 to-slate-800' : 'bg-gradient-to-b from-blue-600 to-blue-700'
        } z-50 shadow-xl transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:sticky lg:top-0`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${
                  darkMode ? 'bg-slate-600' : 'bg-white'
                } flex items-center justify-center shadow-lg`}
              >
                <GraduationCap className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ProClass</h1>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-blue-100'}`}>
                  Gestão de Aulas
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={toggleDarkMode}
            className="mt-4 w-full text-white hover:bg-white/10 justify-start"
          >
            {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            <span className="text-sm">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </Button>
        </div>

        <nav className="px-3 space-y-1 pb-40">
          {allNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? darkMode
                      ? 'bg-slate-600 text-white shadow-md'
                      : 'bg-white text-blue-600 shadow-md'
                    : darkMode
                    ? 'text-slate-200 hover:bg-slate-600/50 hover:text-white'
                    : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}

          {/* Divisor */}
          <div className="pt-2 pb-1">
            <div className={`h-px ${darkMode ? 'bg-slate-600' : 'bg-blue-500/30'}`}></div>
          </div>

          {/* Alterar Senha */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              darkMode
                ? 'text-slate-200 hover:bg-slate-600/50 hover:text-white'
                : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span className="font-medium">Alterar Senha</span>
          </button>

          {/* Sair */}
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              darkMode
                ? 'text-slate-200 hover:bg-red-500/50 hover:text-white'
                : 'text-blue-100 hover:bg-red-500/50 hover:text-white'
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair do Sistema</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className={`lg:hidden sticky top-0 z-30 backdrop-blur-lg border-b px-4 py-3 shadow-sm ${
            darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-blue-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
              </Button>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
                    darkMode ? 'bg-slate-700' : 'bg-blue-600'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-blue-600'}`}>
                  ProClass
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} darkMode={darkMode} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Change Password Modal
function ChangePasswordModal({ onClose, darkMode }: { onClose: () => void; darkMode: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { changePassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsLoading(false);
    
    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!',
      });
      onClose();
    }
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
        className={`w-full max-w-md rounded-2xl p-6 ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Alterar Senha
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
              required
            />
          </div>
          <div>
            <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
              required
            />
          </div>
          <div>
            <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-200'
              }`}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
