import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@proclass.com' },
    update: {},
    create: {
      email: 'admin@proclass.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
      active: true
    }
  })

  console.log('✅ Admin user created:', admin.email)

  // Create a sample teacher
  const teacherPassword = await bcrypt.hash('professor123', 10)
  
  const teacher = await prisma.user.upsert({
    where: { email: 'professor@proclass.com' },
    update: {},
    create: {
      email: 'professor@proclass.com',
      password: teacherPassword,
      name: 'Professor Exemplo',
      role: 'teacher',
      phone: '11999999999',
      active: true
    }
  })

  console.log('✅ Teacher user created:', teacher.email)

  // Create sample students for the teacher
  const student1 = await prisma.student.upsert({
    where: { id: 'student1' },
    update: {},
    create: {
      id: 'student1',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11988887777',
      responsibleName: 'Maria Silva',
      responsiblePhone: '11977776666',
      teacherId: teacher.id
    }
  })

  const student2 = await prisma.student.upsert({
    where: { id: 'student2' },
    update: {},
    create: {
      id: 'student2',
      name: 'Ana Santos',
      email: 'ana@email.com',
      phone: '11966665555',
      teacherId: teacher.id
    }
  })

  console.log('✅ Sample students created')

  // Create sample classes
  const class1 = await prisma.class.upsert({
    where: { id: 'class1' },
    update: {},
    create: {
      id: 'class1',
      title: 'Aula de Violão',
      description: 'Aula para iniciantes',
      dayOfWeek: 1, // Segunda
      startTime: '14:00',
      endTime: '15:00',
      price: 100,
      teacherId: teacher.id
    }
  })

  const class2 = await prisma.class.upsert({
    where: { id: 'class2' },
    update: {},
    create: {
      id: 'class2',
      title: 'Aula de Piano',
      dayOfWeek: 3, // Quarta
      startTime: '16:00',
      endTime: '17:00',
      price: 150,
      teacherId: teacher.id
    }
  })

  console.log('✅ Sample classes created')

  // Link students to classes
  await prisma.classStudent.upsert({
    where: { classId_studentId: { classId: class1.id, studentId: student1.id } },
    update: {},
    create: {
      classId: class1.id,
      studentId: student1.id
    }
  })

  await prisma.classStudent.upsert({
    where: { classId_studentId: { classId: class1.id, studentId: student2.id } },
    update: {},
    create: {
      classId: class1.id,
      studentId: student2.id
    }
  })

  await prisma.classStudent.upsert({
    where: { classId_studentId: { classId: class2.id, studentId: student2.id } },
    update: {},
    create: {
      classId: class2.id,
      studentId: student2.id
    }
  })

  console.log('✅ Students linked to classes')

  // Create sample payments
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  await prisma.payment.upsert({
    where: { id: 'payment1' },
    update: {},
    create: {
      id: 'payment1',
      amount: 100,
      dueDate: nextWeek,
      status: 'pending',
      studentId: student1.id,
      classId: class1.id,
      teacherId: teacher.id
    }
  })

  await prisma.payment.upsert({
    where: { id: 'payment2' },
    update: {},
    create: {
      id: 'payment2',
      amount: 150,
      dueDate: nextMonth,
      status: 'pending',
      studentId: student2.id,
      classId: class2.id,
      teacherId: teacher.id
    }
  })

  console.log('✅ Sample payments created')

  console.log('🎉 Seeding completed!')
  console.log('\n📋 Login credentials:')
  console.log('Admin: admin@proclass.com / admin123')
  console.log('Professor: professor@proclass.com / professor123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
