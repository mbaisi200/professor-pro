import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    // Use environment variables for Firebase Admin SDK
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // Handle different formats of the private key
    // If it contains literal \n, replace with actual newlines
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Ensure the key has the proper format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }
    
    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('Missing Firebase Admin SDK credentials:', {
        hasPrivateKey: !!privateKey,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      throw new Error('Firebase Admin SDK credentials not configured');
    }

    try {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } catch (initError: any) {
      console.error('Error initializing Firebase Admin:', initError);
      throw initError;
    }
  }
  return getApps()[0];
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, teacherId } = await request.json();

    if (!email || !password || !teacherId) {
      return NextResponse.json(
        { error: 'Email, senha e ID do professor são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    const app = getFirebaseAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Check if user already exists in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      // User exists, update password
      await auth.updateUser(userRecord.uid, {
        password: password,
        displayName: displayName || undefined,
      });
    } catch (error: any) {
      // User doesn't exist, create new user
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: displayName || undefined,
          emailVerified: true,
        });
      } else {
        throw error;
      }
    }

    // Update teacher document in Firestore
    await db.collection('users').doc(teacherId).update({
      uid: userRecord.uid,
      hasAuth: true,
      authCreatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Senha definida com sucesso!',
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'Erro ao criar usuário';
    
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Este email já está cadastrado no sistema de autenticação';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
    } else if (error.message?.includes('credentials not configured')) {
      errorMessage = 'Firebase Admin SDK não configurado. Verifique as variáveis de ambiente.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
