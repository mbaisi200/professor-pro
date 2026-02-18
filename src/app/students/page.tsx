'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'

interface Student {
  id: string
  name: string
  email: string | null
  phone: string
  responsibleName: string | null
  responsiblePhone: string | null
  notes: string | null
  active: boolean
  classes: Array<{ class: { id: string; title: string } }>
  _count?: { payments: number }
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  responsibleName: '',
  responsiblePhone: '',
  notes: ''
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editStudent 
        ? `/api/students/${editStudent.id}`
        : '/api/students'
      
      const response = await fetch(url, {
        method: editStudent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao salvar aluno')
        return
      }

      setDialogOpen(false)
      setForm(initialForm)
      setEditStudent(null)
      fetchStudents()
    } catch (error) {
      console.error('Error saving student:', error)
      alert('Erro ao salvar aluno')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (student: Student) => {
    setEditStudent(student)
    setForm({
      name: student.name,
      email: student.email || '',
      phone: student.phone,
      responsibleName: student.responsibleName || '',
      responsiblePhone: student.responsiblePhone || '',
      notes: student.notes || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/students/${deleteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir aluno')
        return
      }

      setDeleteId(null)
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Erro ao excluir aluno')
    }
  }

  const handleToggleActive = async (student: Student) => {
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !student.active })
      })

      if (!response.ok) {
        alert('Erro ao atualizar status')
        return
      }

      fetchStudents()
    } catch (error) {
      console.error('Error toggling student status:', error)
    }
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    (s.email?.toLowerCase().includes(search.toLowerCase()))
  )

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
            <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
            <p className="text-gray-500">Gerencie seus alunos</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditStudent(null)
              setForm(initialForm)
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                + Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editStudent ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do aluno
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibleName">Nome do Responsável</Label>
                    <Input
                      id="responsibleName"
                      value={form.responsibleName}
                      onChange={(e) => setForm({ ...form, responsibleName: e.target.value })}
                      placeholder="Nome do responsável (se menor)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsiblePhone">Telefone do Responsável</Label>
                    <Input
                      id="responsiblePhone"
                      value={form.responsiblePhone}
                      onChange={(e) => setForm({ ...form, responsiblePhone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Observações sobre o aluno"
                      rows={3}
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

        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Students List */}
        <div className="grid gap-4">
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                {search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((student) => (
              <Card key={student.id} className={!student.active ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        {!student.active && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>📞 {formatPhone(student.phone)}</p>
                        {student.email && <p>✉️ {student.email}</p>}
                        {student.responsibleName && (
                          <p>👤 Responsável: {student.responsibleName}</p>
                        )}
                        {student.classes?.length > 0 && (
                          <p>📚 Aulas: {student.classes.map(c => c.class.title).join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(student)}
                      >
                        {student.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(student)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(student.id)}
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
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do aluno serão removidos.
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
