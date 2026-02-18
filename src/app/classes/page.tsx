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

interface ClassItem {
  id: string
  title: string
  description: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  price: number
  active: boolean
  students: Array<{ student: { id: string; name: string } }>
}

interface Student {
  id: string
  name: string
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
]

const initialForm = {
  title: '',
  description: '',
  dayOfWeek: '1',
  startTime: '09:00',
  endTime: '10:00',
  price: '',
  studentIds: [] as string[]
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editClass, setEditClass] = useState<ClassItem | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/students?active=true')
      ])
      const classesData = await classesRes.json()
      const studentsData = await studentsRes.json()
      setClasses(classesData.classes || [])
      setStudents(studentsData.students || [])
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
      const url = editClass 
        ? `/api/classes/${editClass.id}`
        : '/api/classes'
      
      const response = await fetch(url, {
        method: editClass ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          dayOfWeek: parseInt(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          price: parseFloat(form.price) || 0,
          studentIds: form.studentIds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao salvar aula')
        return
      }

      setDialogOpen(false)
      setForm(initialForm)
      setEditClass(null)
      fetchData()
    } catch (error) {
      console.error('Error saving class:', error)
      alert('Erro ao salvar aula')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (classItem: ClassItem) => {
    setEditClass(classItem)
    setForm({
      title: classItem.title,
      description: classItem.description || '',
      dayOfWeek: classItem.dayOfWeek.toString(),
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      price: classItem.price.toString(),
      studentIds: classItem.students?.map(s => s.student.id) || []
    })
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/classes/${deleteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir aula')
        return
      }

      setDeleteId(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('Erro ao excluir aula')
    }
  }

  const handleToggleActive = async (classItem: ClassItem) => {
    try {
      const response = await fetch(`/api/classes/${classItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !classItem.active })
      })

      if (!response.ok) {
        alert('Erro ao atualizar status')
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error toggling class status:', error)
    }
  }

  const getDayName = (dayOfWeek: number) => {
    return daysOfWeek.find(d => d.value === dayOfWeek)?.label || ''
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Group classes by day
  const classesByDay = daysOfWeek.map(day => ({
    ...day,
    classes: classes.filter(c => c.dayOfWeek === day.value)
  })).filter(d => d.classes.length > 0)

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
            <h1 className="text-2xl font-bold text-gray-900">Aulas</h1>
            <p className="text-gray-500">Gerencie suas aulas e horários</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditClass(null)
              setForm(initialForm)
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                + Nova Aula
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editClass ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da aula
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Ex: Aula de Violão"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descrição da aula"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Dia da Semana *</Label>
                    <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map(day => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Início *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Término *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Valor por Aula</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alunos</Label>
                    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-2">
                      {students.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Nenhum aluno cadastrado
                        </p>
                      ) : (
                        students.map(student => (
                          <label key={student.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.studentIds.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setForm({ ...form, studentIds: [...form.studentIds, student.id] })
                                } else {
                                  setForm({ ...form, studentIds: form.studentIds.filter(id => id !== student.id) })
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{student.name}</span>
                          </label>
                        ))
                      )}
                    </div>
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

        {/* Classes by Day */}
        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Nenhuma aula cadastrada
            </CardContent>
          </Card>
        ) : (
          classesByDay.map(dayGroup => (
            <div key={dayGroup.value} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-700">{dayGroup.label}</h2>
              <div className="grid gap-3">
                {dayGroup.classes.map(classItem => (
                  <Card key={classItem.id} className={!classItem.active ? 'opacity-60' : ''}>
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{classItem.title}</h3>
                            {!classItem.active && (
                              <Badge variant="secondary">Inativa</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>⏰ {classItem.startTime} - {classItem.endTime}</p>
                            {classItem.price > 0 && (
                              <p>💰 {formatCurrency(classItem.price)} por aula</p>
                            )}
                            {classItem.students?.length > 0 && (
                              <p>👨‍🎓 {classItem.students.length} aluno(s): {classItem.students.map(s => s.student.name).join(', ')}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(classItem)}
                          >
                            {classItem.active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(classItem)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteId(classItem.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aula?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados da aula serão removidos.
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
