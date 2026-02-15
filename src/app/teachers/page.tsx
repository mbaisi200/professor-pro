'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, GraduationCap, Edit, Trash2, Mail, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, COLLECTIONS } from '@/lib/firestore-helpers';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Teacher {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  invited: boolean;
  role: string;
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
        className={`rounded-2xl w-full max-w-md ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div
          className={`sticky top-0 border-b p-5 flex items-center justify-between ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          }`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {teacher ? 'Editar Professor' : 'Novo Professor'}
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
              placeholder="Nome do professor"
              required
              className={`mt-1 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}`}
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Email *
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
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

export default function TeachersPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const { user, userData, loading, createUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && userData?.role === 'admin') {
      fetchTeachers();
    } else if (user && userData?.role !== 'admin') {
      router.push('/');
    }
  }, [user, userData, loading, router]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      // Buscar usuários com role 'teacher'
      const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const snapshot = await getDocs(teachersQuery);
      const teachersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Teacher[];
      
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (editingTeacher) {
        // Atualizar professor existente
        await firestoreService.update(COLLECTIONS.USERS, editingTeacher.id, {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
        });
        toast({ title: 'Professor atualizado!' });
      } else {
        // Criar novo professor
        const result = await createUser(data.email, 'senha123', data.name, 'teacher');
        if (result.error) {
          toast({ title: result.error, variant: 'destructive' });
          setIsSaving(false);
          return;
        }
        
        // Atualizar telefone se fornecido
        if (data.phone) {
          // O usuário já foi criado, então precisamos atualizar o telefone
          // Isso será feito através de uma nova busca
        }
        
        toast({ title: 'Professor cadastrado! Senha padrão: senha123' });
      }

      setShowForm(false);
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error) {
      toast({ title: 'Erro ao salvar professor', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este professor? Todos os dados relacionados serão perdidos.')) return;
    try {
      await firestoreService.delete(COLLECTIONS.USERS, id);
      toast({ title: 'Professor excluído!' });
      fetchTeachers();
    } catch (error) {
      toast({ title: 'Erro ao excluir professor', variant: 'destructive' });
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Professores
                </h1>
                <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Gerencie seus professores e pagamentos
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingTeacher(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Professor
              </Button>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-10 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
              />
            </div>
          </motion.div>

          {/* Teachers Grid */}
          {filteredTeachers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-12 text-center border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
            >
              <GraduationCap className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Nenhum professor cadastrado ainda
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Cadastrar Primeiro Professor
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher, index) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl p-6 shadow-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                        darkMode ? 'bg-slate-700 text-white' : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {teacher.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {teacher.name || 'Sem nome'}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          teacher.invited
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {teacher.invited ? 'Convidado' : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTeacher(teacher);
                        setShowForm(true);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(teacher.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Form Modal */}
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
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
