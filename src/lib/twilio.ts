import { User } from '@prisma/client'
import twilio from 'twilio'

interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
}

interface SendMessageResult {
  success: boolean
  messageSid?: string
  error?: string
}

export function getTwilioClient(config: TwilioConfig) {
  return twilio(config.accountSid, config.authToken)
}

export function getUserTwilioConfig(user: User): TwilioConfig | null {
  if (!user.twilioAccountSid || !user.twilioAuthToken || !user.twilioPhoneNumber) {
    return null
  }
  
  return {
    accountSid: user.twilioAccountSid,
    authToken: user.twilioAuthToken,
    phoneNumber: user.twilioPhoneNumber
  }
}

export async function sendWhatsAppMessage(
  config: TwilioConfig,
  to: string,
  message: string
): Promise<SendMessageResult> {
  try {
    const client = getTwilioClient(config)
    
    // Format phone number for WhatsApp
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:+55${to.replace(/\D/g, '')}`
    const whatsappFrom = config.phoneNumber.startsWith('whatsapp:') 
      ? config.phoneNumber 
      : `whatsapp:${config.phoneNumber}`
    
    const result = await client.messages.create({
      from: whatsappFrom,
      to: whatsappTo,
      body: message
    })
    
    return {
      success: true,
      messageSid: result.sid
    }
  } catch (error: unknown) {
    console.error('Error sending WhatsApp message:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      success: false,
      error: errorMessage
    }
  }
}

export function formatPaymentReminderMessage(
  studentName: string,
  amount: number,
  dueDate: Date,
  teacherName: string
): string {
  const formattedDate = dueDate.toLocaleDateString('pt-BR')
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
  
  return `🔔 *Lembrete de Pagamento*

Olá! Este é um lembrete da aula de *${teacherName}*.

📊 *Aluno:* ${studentName}
💰 *Valor:* ${formattedAmount}
📅 *Vencimento:* ${formattedDate}

Por favor, entre em contato para regularizar o pagamento.

Obrigado! 🙏`
}

export function formatClassReminderMessage(
  studentName: string,
  classTitle: string,
  dayOfWeek: number,
  startTime: string,
  teacherName: string
): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const dayName = days[dayOfWeek] || ''
  
  return `📚 *Lembrete de Aula*

Olá! Este é um lembrete da aula de *${teacherName}*.

👨‍🎓 *Aluno:* ${studentName}
📖 *Aula:* ${classTitle}
📅 *Dia:* ${dayName}
⏰ *Horário:* ${startTime}

Até lá! 🎯`
}
