'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  paymentMethod: string | null
  notes: string | null
  reminderSent: boolean
  student: { id: string; name: string; phone: string }
  class: { id: string; title: string } | null
}

interface Student {
  id: string
  name: string
}

interface ClassItem {
  id: string
  title: string
}

const initialForm = {
  studentId: '',
  classId: '',
  amount: '',
  dueDate: '',
  paymentMethod: '',
  notes: ''
}

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit', label: 'Cartão de Crédito' },
  { value: 'debit', label: 'Cartão de Débito' },
]

function PaymentsContent() {
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all')

  useEffect(() => {
    fetchData()
  }, [filterStatus])

  const fetchData = async () => {
    try {
      const [paymentsRes, studentsRes, classesRes] = await Promise.all([
        fetch(`/api/payments${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`),
        fetch('/api/students?active=true'),
        fetch('/api/classes?active=true')
      ])
      const paymentsData = await paymentsRes.json()
      const studentsData = await studentsRes.json()
      const classesData = await classesRes.json()
      setPayments(paymentsData.payments || [])
      setStudents(studentsData.students || [])
      setClasses(classesData.classes || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editPayment 
        ? `/api/payments/${editPayment.id}`
        : '/api/payments'
      
      const response = await fetch(url, {
        method: editPayment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          classId: form.classId || null,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
          paymentMethod: form.paymentMethod || null,
          notes: form.notes || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao salvar pagamento')
        return
      }

      setDialogOpen(false)
      setForm(initialForm)
      setEditPayment(null)
      fetchData()
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('Erro ao salvar pagamento')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAsPaid = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paidDate: new Date().toISOString()
        })
      })

      if (!response.ok) {
        alert('Erro ao marcar como pago')
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/payments/${deleteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir pagamento')
        return
      }

      setDeleteId(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Erro ao excluir pagamento')
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

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return '-'
    return paymentMethods.find(m => m.value === method)?.label || method
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
            <p className="text-gray-500">Gerencie os pagamentos dos alunos</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditPayment(null)
              setForm(initialForm)
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                + Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Pagamento</DialogTitle>
                  <DialogDescription>
                    Registre um novo pagamento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Aluno *</Label>
                    <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classId">Aula (opcional)</Label>
                    <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a aula" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(classItem => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Data de Vencimento *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Input
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Observações"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Pendentes
          </Button>
          <Button
            variant={filterStatus === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('overdue')}
          >
            Atrasados
          </Button>
          <Button
            variant={filterStatus === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('paid')}
          >
            Pagos
          </Button>
        </div>

        {/* Payments List */}
        <div className="grid gap-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Nenhum pagamento encontrado
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{payment.student.name}</h3>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                        {payment.reminderSent && (
                          <Badge variant="outline">Lembrete enviado</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>💰 {formatCurrency(payment.amount)}</p>
                        <p>📅 Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}</p>
                        {payment.paidDate && (
                          <p>✅ Pago em: {new Date(payment.paidDate).toLocaleDateString('pt-BR')}</p>
                        )}
                        {payment.class && (
                          <p>📚 Aula: {payment.class.title}</p>
                        )}
                        {payment.paymentMethod && (
                          <p>💳 Forma: {getPaymentMethodLabel(payment.paymentMethod)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.status !== 'paid' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarkAsPaid(payment)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Marcar como Pago
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(payment.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    }>
      <PaymentsContent />
    </Suspense>
  )
}
