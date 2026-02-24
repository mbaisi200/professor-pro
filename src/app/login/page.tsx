'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { signIn, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn(email, password);

    if (result.error) {
      toast({
        title: 'Erro de login',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      router.push('/');
    }
    
    setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-futuristic flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Glowing orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,254,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,254,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-dark rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="relative p-8 text-center">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent"></div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-500/30 relative overflow-hidden">
                <GraduationCap className="w-10 h-10 text-white relative z-10" />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse"></div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">ProClass</h1>
              <p className="text-gray-400">Sistema de Gestão de Aulas</p>
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 btn-gradient text-white font-medium rounded-xl text-base shadow-lg shadow-purple-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-gray-500">
              Sistema de gestão para professores
            </p>
          </div>
        </div>

        {/* Bottom glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 blur-2xl rounded-full"></div>
      </motion.div>
    </div>
  );
}
