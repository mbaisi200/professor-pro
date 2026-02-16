'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { isBefore, parseISO } from 'date-fns';

interface UserData {
  id: string; // Document ID in Firestore
  uid: string; // Firebase Auth UID
  email: string | null;
  name: string | null;
  role: 'admin' | 'teacher';
  phone?: string | null;
  invited?: boolean;
  createdAt?: Date;
  expiresAt?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  initialized: boolean;
  isExpired: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, name: string, role?: 'admin' | 'teacher') => Promise<{ error?: string }>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache local para dados do usuário
let userCache: { uid: string; data: UserData } | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Inicializar com usuário cacheado se disponível
    const cachedUser = auth.currentUser;
    return cachedUser;
  });
  const [userData, setUserData] = useState<UserData | null>(() => {
    // Inicializar com dados cacheados se disponíveis
    if (userCache && auth.currentUser && userCache.uid === auth.currentUser.uid) {
      return userCache.data;
    }
    return null;
  });
  const [loading, setLoading] = useState(!auth.currentUser);
  const [initialized, setInitialized] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Verificar cache primeiro
        if (userCache && userCache.uid === firebaseUser.uid) {
          console.log('=== AUTH: Usando cache ===');
          console.log('userCache.data:', userCache.data);
          setUserData(userCache.data);
        } else {
          // Buscar dados do usuário no Firestore
          try {
            console.log('=== AUTH: Buscando no Firestore ===');
            console.log('firebaseUser.uid:', firebaseUser.uid);
            
            // Primeiro, tentar buscar pelo ID do documento (Firebase Auth UID)
            let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            let docId = firebaseUser.uid;
            
            if (userDoc.exists()) {
              console.log('Encontrado pelo ID do documento:', firebaseUser.uid);
              const data = { id: docId, uid: firebaseUser.uid, ...userDoc.data() } as UserData;
              console.log('userData definido:', data);
              setUserData(data);
              userCache = { uid: firebaseUser.uid, data };
            } else {
              // Se não encontrou pelo ID, buscar pelo campo 'uid'
              console.log('Não encontrado pelo ID, buscando pelo campo uid...');
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('uid', '==', firebaseUser.uid));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                // Encontrou pelo campo uid
                const doc = querySnapshot.docs[0];
                docId = doc.id;
                console.log('Encontrado pelo campo uid. docId:', docId);
                const data = { id: docId, uid: firebaseUser.uid, ...doc.data() } as UserData;
                console.log('userData definido:', data);
                setUserData(data);
                userCache = { uid: firebaseUser.uid, data };
              } else {
                console.log('Usuário não encontrado, criando documento básico');
                // Se não existir, criar documento básico
                const basicData: UserData = {
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName,
                  role: 'teacher',
                };
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName,
                  role: 'teacher',
                  createdAt: serverTimestamp(),
                });
                setUserData(basicData);
                userCache = { uid: firebaseUser.uid, data: basicData };
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      } else {
        setUserData(null);
        userCache = null;
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: any) {
      setLoading(false);
      let message = 'Erro ao fazer login';
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Senha incorreta';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Email ou senha incorretos';
      }
      return { error: message };
    }
  }, []);

  const signOut = useCallback(async () => {
    userCache = null;
    await firebaseSignOut(auth);
  }, []);

  const createUser = useCallback(async (email: string, password: string, name: string, role: 'admin' | 'teacher' = 'teacher') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        name,
        role,
        invited: true,
        createdAt: serverTimestamp(),
      });
      
      return {};
    } catch (error: any) {
      let message = 'Erro ao criar usuário';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este email já está em uso';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres';
      }
      return { error: message };
    }
  }, []);

  const updateUserData = useCallback(async (data: Partial<UserData>) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    const newData = userData ? { ...userData, ...data } : null;
    setUserData(newData);
    if (newData) {
      userCache = { uid: user.uid, data: newData };
    }
  }, [user, userData]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) return { error: 'Usuário não autenticado' };
    
    try {
      // Reautenticar o usuário
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Atualizar a senha
      await updatePassword(user, newPassword);
      return {};
    } catch (error: any) {
      let message = 'Erro ao alterar senha';
      if (error.code === 'auth/wrong-password') {
        message = 'Senha atual incorreta';
      } else if (error.code === 'auth/weak-password') {
        message = 'A nova senha deve ter pelo menos 6 caracteres';
      }
      return { error: message };
    }
  }, [user]);

  // Verificar se o plano expirou
  const isExpired = useMemo(() => {
    if (!userData?.expiresAt) return false;
    // Admin não tem expiração
    if (userData.role === 'admin') return false;
    
    const expiresAt = typeof userData.expiresAt === 'string' 
      ? parseISO(userData.expiresAt) 
      : new Date(userData.expiresAt);
    
    return isBefore(expiresAt, new Date());
  }, [userData]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      initialized,
      isExpired,
      signIn, 
      signOut, 
      createUser, 
      updateUserData,
      changePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
