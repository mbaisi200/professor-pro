'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getTeacherPayments,
  createTeacherPayment,
  updateTeacherPayment,
  deleteTeacherPayment,
  getTeachers
} from '@/lib/firestore';

// ============== STUDENTS ==============
export function useStudents(teacherId?: string) {
  return useQuery({
    queryKey: ['students', teacherId],
    queryFn: () => getStudents(teacherId),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateStudent>[1] }) =>
      updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// ============== TEACHERS ==============
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
  });
}

// ============== LESSONS ==============
export function useLessons(teacherId?: string) {
  return useQuery({
    queryKey: ['lessons', teacherId],
    queryFn: () => getLessons(teacherId),
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateLesson>[1] }) =>
      updateLesson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

// ============== PAYMENTS ==============
export function usePayments(teacherId?: string) {
  return useQuery({
    queryKey: ['payments', teacherId],
    queryFn: () => getPayments(teacherId),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePayment>[1] }) =>
      updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// ============== TEACHER PAYMENTS ==============
export function useTeacherPayments(teacherId?: string) {
  return useQuery({
    queryKey: ['teacherPayments', teacherId],
    queryFn: () => getTeacherPayments(teacherId),
  });
}

export function useCreateTeacherPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTeacherPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherPayments'] });
    },
  });
}

export function useUpdateTeacherPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTeacherPayment>[1] }) =>
      updateTeacherPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherPayments'] });
    },
  });
}

export function useDeleteTeacherPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTeacherPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherPayments'] });
    },
  });
}

// ============== DASHBOARD DATA ==============
export function useDashboardData(teacherId?: string) {
  const students = useStudents(teacherId);
  const lessons = useLessons(teacherId);
  const payments = usePayments(teacherId);

  return {
    students: students.data || [],
    lessons: lessons.data || [],
    payments: payments.data || [],
    isLoading: students.isLoading || lessons.isLoading || payments.isLoading,
    isError: students.isError || lessons.isError || payments.isError,
    refetch: () => {
      students.refetch();
      lessons.refetch();
      payments.refetch();
    },
  };
}
