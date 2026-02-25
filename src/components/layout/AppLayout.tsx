'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [dbOnline, setDbOnline] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const darkMode = resolvedTheme === 'dark';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const db = getFirestore();
    const unsubscribe = onSnapshot(
      doc(db, 'connection_check', 'status'),
      () => {
        setDbOnline(true);
      },
      (error) => {
        console.error('Firestore connection error:', error);
        setDbOnline(false);
      }
    );

    const interval = setInterval(() => {}, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  const toggleTheme = () => {
    setTheme(darkMode ? 'light' : 'dark');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-futuristic">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-spin opacity-75"></div>
            <div className="absolute inset-2 rounded-full bg-[#121212]"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-gray-400 animate-pulse">Carregando...</p>
        </div>
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
    <div className={`flex min-h-screen ${darkMode ? 'bg-futuristic' : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/20'}`}>
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:sticky lg:top-0 ${
          darkMode 
            ? 'glass-sidebar' 
            : 'bg-gradient-to-b from-white via-white to-slate-50 border-r border-slate-200'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden ${
                  darkMode 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' 
                    : 'bg-gradient-to-br from-purple-500 to-cyan-500'
                }`}
              >
                <GraduationCap className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-white'}`} />
                {darkMode && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 animate-pulse"></div>
                )}
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  ProClass
                </h1>
                <p className={`text-xs ${darkMode ? 'text-cyan-400/70' : 'text-slate-500'}`}>
                  Gestão Inteligente
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden ${darkMode ? 'text-white hover:bg-white/10' : 'hover:bg-slate-100'}`}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Theme Toggle */}
          <div 
            className={`mt-6 p-1.5 rounded-2xl flex items-center gap-1 ${
              darkMode 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-slate-100'
            }`}
          >
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                !darkMode 
                  ? 'bg-white shadow-md text-amber-500' 
                  : darkMode 
                    ? 'text-gray-500 hover:text-white' 
                    : 'text-gray-500 hover:text-slate-800'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                darkMode 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400' 
                  : 'text-gray-500 hover:text-slate-800'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">Escuro</span>
            </button>
          </div>
          
          {/* Database Status */}
          <div 
            className={`mt-4 p-4 rounded-2xl flex items-center gap-3 ${
              dbOnline 
                ? darkMode 
                  ? 'bg-cyan-500/10 border border-cyan-500/20' 
                  : 'bg-emerald-50 border border-emerald-200'
                : darkMode 
                  ? 'bg-red-500/10 border border-red-500/20' 
                  : 'bg-red-50 border border-red-200'
            }`}
          >
            {dbOnline ? (
              <>
                <div className="relative">
                  <Wifi className={`w-5 h-5 ${darkMode ? 'text-cyan-400' : 'text-emerald-500'}`} />
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse ${
                    darkMode ? 'bg-cyan-400' : 'bg-emerald-500'
                  }`}></span>
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-cyan-400' : 'text-emerald-600'}`}>
                    Sistema Online
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-cyan-400/60' : 'text-emerald-500'}`}>
                    Conectado
                  </p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    Sistema Offline
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-red-400/60' : 'text-red-500'}`}>
                    Sem conexão
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2 pb-40">
          {allNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <motion.button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden ${
                  active
                    ? darkMode
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 shadow-lg'
                      : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : darkMode
                      ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={`w-5 h-5 ${active && !darkMode ? 'text-white' : ''}`} />
                <span className="font-medium">{item.name}</span>
                {active && darkMode && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-l-full"></div>
                )}
              </motion.button>
            );
          })}

          {/* Divider */}
          <div className="pt-4 pb-2">
            <div className={`h-px ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
          </div>

          {/* Change Password */}
          <motion.button
            onClick={() => setShowPasswordModal(true)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
              darkMode
                ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Lock className="w-5 h-5" />
            <span className="font-medium">Alterar Senha</span>
          </motion.button>

          {/* Logout */}
          <motion.button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
              darkMode
                ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                : 'text-slate-600 hover:bg-red-50 hover:text-red-500'
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair do Sistema</span>
          </motion.button>
        </nav>

        {/* Bottom Glow Effect */}
        {darkMode && (
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className={`lg:hidden sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3 ${
            darkMode 
              ? 'bg-[#121212]/80 border-white/10' 
              : 'bg-white/80 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(true)}
                className={darkMode ? 'text-white hover:bg-white/10' : ''}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    darkMode 
                      ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' 
                      : 'bg-gradient-to-br from-purple-500 to-cyan-500'
                  }`}
                >
                  <GraduationCap className={`w-5 h-5 ${darkMode ? 'text-cyan-400' : 'text-white'}`} />
                </div>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  ProClass
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
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

// Change Password Modal with Futuristic Design
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className={`w-full max-w-md rounded-3xl p-6 ${
          darkMode 
            ? 'glass-dark' 
            : 'glass-light'
        }`}
      >
        <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Alterar Senha
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full mt-2 px-4 py-3 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  : 'bg-white border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
              }`}
              required
            />
          </div>
          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full mt-2 px-4 py-3 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  : 'bg-white border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
              }`}
              required
            />
          </div>
          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full mt-2 px-4 py-3 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-white/5 border-white/10 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                  : 'bg-white border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
              }`}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`flex-1 rounded-xl ${darkMode ? 'border-white/10 text-white hover:bg-white/5' : ''}`}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-gradient rounded-xl text-white font-medium"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
