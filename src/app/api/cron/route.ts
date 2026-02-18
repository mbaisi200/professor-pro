import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserTwilioConfig, sendWhatsAppMessage, formatPaymentReminderMessage } from '@/lib/twilio'

// Cron job endpoint for automatic payment reminders
// Each teacher's reminders are sent using THEIR OWN Twilio credentials
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Find all pending payments due in the next 3 days that haven't had reminders sent
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const pendingPayments = await db.payment.findMany({
      where: {
        status: 'pending',
        reminderSent: false,
        dueDate: {
          gte: today,
          lte: threeDaysFromNow
        }
      },
      include: {
        student: true,
        teacher: true
      }
    })
    
    console.log(`Found ${pendingPayments.length} pending payments for reminders`)
    
    const results = {
      total: pendingPayments.length,
      sent: 0,
      failed: 0,
      noConfig: 0,
      errors: [] as string[]
    }
    
    // Group payments by teacher to use each teacher's Twilio config
    const paymentsByTeacher = new Map<string, typeof pendingPayments>()
    
    for (const payment of pendingPayments) {
      const teacherId = payment.teacherId
      if (!paymentsByTeacher.has(teacherId)) {
        paymentsByTeacher.set(teacherId, [])
      }
      paymentsByTeacher.get(teacherId)!.push(payment)
    }
    
    // Process each teacher's payments with their own Twilio credentials
    for (const [teacherId, payments] of paymentsByTeacher) {
      const teacher = payments[0].teacher
      
      // Check if teacher has WhatsApp enabled and configured
      if (!teacher.whatsappEnabled) {
        console.log(`Teacher ${teacher.name} has WhatsApp disabled, skipping ${payments.length} payments`)
        results.noConfig += payments.length
        continue
      }
      
      const twilioConfig = getUserTwilioConfig(teacher)
      if (!twilioConfig) {
        console.log(`Teacher ${teacher.name} has no Twilio config, skipping ${payments.length} payments`)
        results.noConfig += payments.length
        continue
      }
      
      // Send reminders for each payment
      for (const payment of payments) {
        const phone = payment.student.responsiblePhone || payment.student.phone
        
        if (!phone) {
          console.log(`No phone for student ${payment.student.name}`)
          results.failed++
          continue
        }
        
        const message = formatPaymentReminderMessage(
          payment.student.name,
          payment.amount,
          payment.dueDate,
          teacher.name
        )
        
        const result = await sendWhatsAppMessage(twilioConfig, phone, message)
        
        if (result.success) {
          // Mark reminder as sent
          await db.payment.update({
            where: { id: payment.id },
            data: { reminderSent: true }
          })
          results.sent++
          console.log(`Reminder sent to ${payment.student.name}`)
        } else {
          results.failed++
          results.errors.push(`${payment.student.name}: ${result.error}`)
          console.error(`Failed to send reminder to ${payment.student.name}:`, result.error)
        }
      }
    }
    
    // Update overdue payments
    await db.payment.updateMany({
      where: {
        status: 'pending',
        dueDate: { lt: today }
      },
      data: { status: 'overdue' }
    })
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Error processing reminders',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
