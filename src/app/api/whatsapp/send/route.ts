import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getUserTwilioConfig, sendWhatsAppMessage } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const twilioConfig = getUserTwilioConfig(user)
    
    if (!twilioConfig || !user.whatsappEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp não configurado ou desabilitado' 
      }, { status: 400 })
    }
    
    const body = await request.json()
    const { paymentId, phone, message } = body
    
    if (!phone || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Telefone e mensagem são obrigatórios' 
      }, { status: 400 })
    }
    
    const result = await sendWhatsAppMessage(twilioConfig, phone, message)
    
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
