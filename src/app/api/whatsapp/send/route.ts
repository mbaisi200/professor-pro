import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { createTwilioClient, formatPhoneNumber } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    if (!user.whatsappEnabled || !user.twilioAccountSid || !user.twilioAuthToken || !user.twilioPhoneNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp não configurado ou desabilitado' 
      })
    }
    
    const body = await request.json()
    const { paymentId, phone, message } = body
    
    if (!phone || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Telefone e mensagem são obrigatórios' 
      })
    }
    
    const twilio = createTwilioClient({
      accountSid: user.twilioAccountSid,
      authToken: user.twilioAuthToken,
      phoneNumber: user.twilioPhoneNumber,
    })
    
    const formattedPhone = formatPhoneNumber(phone)
    const result = await twilio.sendWhatsAppMessage(formattedPhone, message)
    
    if (result.success && paymentId) {
      // Mark reminder as sent
      await db.payment.update({
        where: { id: paymentId },
        data: { reminderSent: true },
      })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Send WhatsApp error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao enviar mensagem' 
    }, { status: 500 })
  }
}
