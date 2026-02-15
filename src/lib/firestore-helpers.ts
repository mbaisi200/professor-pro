import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generic CRUD operations for Firestore
export const firestoreService = {
  // Get all documents from a collection
  async getAll<T>(collectionName: string): Promise<(T & { id: string })[]> {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[];
  },

  // Get a single document by ID
  async getById<T>(collectionName: string, id: string): Promise<(T & { id: string }) | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
  },

  // Create a new document
  async create<T extends Record<string, any>>(
    collectionName: string,
    data: T
  ): Promise<string> {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update a document
  async update<T extends Record<string, any>>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete a document
  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  // Query documents with filters
  async query<T>(
    collectionName: string,
    ...constraints: any[]
  ): Promise<(T & { id: string })[]> {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[];
  },

  // Convert Firestore timestamp to Date
  timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
    if (!timestamp) return null;
    return timestamp.toDate();
  },

  // Convert Date to Firestore timestamp
  dateToTimestamp(date: Date | string | null): Timestamp | null {
    if (!date) return null;
    if (typeof date === 'string') {
      return Timestamp.fromDate(new Date(date));
    }
    return Timestamp.fromDate(date);
  },
};

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  LESSONS: 'lessons',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
} as const;
