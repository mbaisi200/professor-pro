import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }
    
    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('Missing Firebase Admin SDK credentials');
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
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'UID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    const app = getFirebaseAdminApp();
    const auth = getAuth(app);

    // Delete user from Firebase Auth
    await auth.deleteUser(uid);

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído do Firebase Auth com sucesso!',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    let errorMessage = 'Erro ao excluir usuário do Firebase Auth';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado no Firebase Auth';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
