import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogTrigger 
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { UserCog, Plus, Pencil, Trash2, Users, BookOpen, CreditCard, Mail, Phone, CheckCircle, XCircle } from 'lucide-react'
import { hashPassword } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function getTeachers() {
  return db.user.findMany({
    where: { role: 'teacher' },
    include: {
      _count: { select: { students: true, classes: true, payments: true } },
    },
    orderBy: { name: 'asc' },
  })
}

async function createTeacher(formData: FormData) {
  'use server'
  
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Não autorizado' }
  }
  
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string
  
  if (!name || !email || !password) {
    return { error: 'Nome, email e senha são obrigatórios' }
  }
  
  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Email já cadastrado' }
  }
  
  const hashedPassword = await hashPassword(password)
  
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'teacher',
      active: true,
    },
  })
  
  revalidatePath('/admin')
  return { success: true }
}

async function updateTeacher(formData: FormData) {
  'use server'
  
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Não autorizado' }
  }
  
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const active = formData.get('active') === 'on'
  const password = formData.get('password') as string
  
  if (!id || !name || !email) {
    return { error: 'ID, nome e email são obrigatórios' }
  }
  
  const updateData: any = {
    name,
    email,
    phone,
    active,
  }
  
  if (password && password.length > 0) {
    updateData.password = await hashPassword(password)
  }
  
  await db.user.update({
    where: { id },
    data: updateData,
  })
  
  revalidatePath('/admin')
  return { success: true }
}

async function deleteTeacher(formData: FormData) {
  'use server'
  
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { error: 'Não autorizado' }
  }
  
  const id = formData.get('id') as string
  
  if (!id) {
    return { error: 'ID é obrigatório' }
  }
  
  // Delete related data
  await db.payment.deleteMany({ where: { teacherId: id } })
  await db.classEnrollment.deleteMany({ where: { class: { teacherId: id } } })
  await db.class.deleteMany({ where: { teacherId: id } })
  await db.student.deleteMany({ where: { teacherId: id } })
  await db.user.delete({ where: { id } })
  
  revalidatePath('/admin')
  return { success: true }
}

export default async function AdminPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'admin') {
    redirect('/dashboard')
  }
  
  const teachers = await getTeachers()
  
  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Professores</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Administre as contas dos professores
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Professor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Professor</DialogTitle>
                <DialogDescription>
                  Crie uma nova conta de professor
                </DialogDescription>
              </DialogHeader>
              <form action={createTeacher} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required placeholder="Nome do professor" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required placeholder="email@exemplo.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input id="password" name="password" type="password" required placeholder="Senha inicial" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" placeholder="+5511999999999" />
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Criar Professor
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Teachers list */}
        <div className="grid gap-4">
          {teachers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCog className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Nenhum professor cadastrado
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeiro Professor
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            teachers.map((teacher) => (
              <Card key={teacher.id} className={!teacher.active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCog className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold">{teacher.name}</h3>
                        {teacher.active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {teacher.email}
                        </div>
                        {teacher.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {teacher.phone}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          {teacher._count.students} alunos
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <BookOpen className="h-4 w-4" />
                          {teacher._count.classes} aulas
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <CreditCard className="h-4 w-4" />
                          {teacher._count.payments} pagamentos
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Professor</DialogTitle>
                          </DialogHeader>
                          <form action={updateTeacher} className="space-y-4">
                            <input type="hidden" name="id" value={teacher.id} />
                            
                            <div className="space-y-2">
                              <Label>Nome *</Label>
                              <Input name="name" required defaultValue={teacher.name} />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Email *</Label>
                              <Input name="email" type="email" required defaultValue={teacher.email} />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Telefone</Label>
                              <Input name="phone" defaultValue={teacher.phone || ''} />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Nova Senha</Label>
                              <Input name="password" type="password" placeholder="Deixe em branco para manter" />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox id={`active-${teacher.id}`} name="active" defaultChecked={teacher.active} />
                              <Label htmlFor={`active-${teacher.id}`}>Professor ativo</Label>
                            </div>
                            
                            <DialogFooter>
                              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                                Salvar Alterações
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir professor?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O professor "{teacher.name}" será removido permanentemente junto com todos os seus dados (alunos, aulas e pagamentos).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button variant="destructive" form={`delete-teacher-${teacher.id}`}>
                                Excluir
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <form id={`delete-teacher-${teacher.id}`} action={deleteTeacher} className="hidden">
                        <input type="hidden" name="id" value={teacher.id} />
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}
