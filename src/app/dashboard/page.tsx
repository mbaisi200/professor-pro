'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  pendingPayments: number
  overduePayments: number
  todayClasses: Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    students: Array<{ student: { name: string } }>
  }>
  recentPayments: Array<{
    id: string
    amount: number
    status: string
    dueDate: string
    student: { name: string }
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      // Fetch students
      const studentsRes = await fetch('/api/students')
      const studentsData = await studentsRes.json()
      
      // Fetch classes
      const classesRes = await fetch('/api/classes')
      const classesData = await classesRes.json()
      
      // Fetch payments
      const paymentsRes = await fetch('/api/payments')
      const paymentsData = await paymentsRes.json()
      
      const today = new Date().getDay()
      const todayClasses = (classesData.classes || []).filter(
        (c: { dayOfWeek: number; active: boolean }) => c.dayOfWeek === today && c.active
      )
      
      const pendingPayments = (paymentsData.payments || []).filter(
        (p: { status: string }) => p.status === 'pending'
      )
      
      const overduePayments = (paymentsData.payments || []).filter(
        (p: { status: string }) => p.status === 'overdue'
      )
      
      setStats({
        totalStudents: studentsData.students?.length || 0,
        totalClasses: classesData.classes?.length || 0,
        pendingPayments: pendingPayments.length,
        overduePayments: overduePayments.length,
        todayClasses,
        recentPayments: (paymentsData.payments || []).slice(0, 5)
      })
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago'
      case 'pending': return 'Pendente'
      case 'overdue': return 'Atrasado'
      default: return status
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Visão geral do seu negócio</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-100">Total de Alunos</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalStudents || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.push('/students')}
              >
                Ver alunos
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-100">Total de Aulas</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalClasses || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.push('/classes')}
              >
                Ver aulas
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-yellow-100">Pagamentos Pendentes</CardDescription>
              <CardTitle className="text-3xl">{stats?.pendingPayments || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.push('/payments?status=pending')}
              >
                Ver pagamentos
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-red-100">Pagamentos Atrasados</CardDescription>
              <CardTitle className="text-3xl">{stats?.overduePayments || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.push('/payments?status=overdue')}
              >
                Ver atrasados
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Aulas de Hoje</CardTitle>
              <CardDescription>Suas aulas programadas para hoje</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.todayClasses?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma aula programada para hoje</p>
              ) : (
                <div className="space-y-3">
                  {stats?.todayClasses?.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{classItem.title}</p>
                        <p className="text-sm text-gray-500">
                          {classItem.startTime} - {classItem.endTime}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {classItem.students?.length || 0} aluno(s)
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Recentes</CardTitle>
              <CardDescription>Últimos pagamentos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentPayments?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-3">
                  {stats?.recentPayments?.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{payment.student.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
