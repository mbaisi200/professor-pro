import { NextRequest, NextResponse } from 'next/server';
import Twilio from 'twilio';
import { getTwilioConfig, getStudent, getStudents, getPayments } from '@/lib/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Enviar mensagem individual
async function sendWhatsAppMessage(
  config: { accountSid: string; authToken: string; phoneNumber: string },
  to: string,
  message: string
) {
  const client = Twilio(config.accountSid, config.authToken);
  
  // Formatar número se necessário
  let formattedTo = to.replace(/\D/g, '');
  if (!formattedTo.startsWith('55')) {
    formattedTo = '55' + formattedTo;
  }
  
  const result = await client.messages.create({
    from: config.phoneNumber,
    to: `whatsapp:+${formattedTo}`,
    body: message,
  });
  
  return result;
}

// POST - Enviar lembrete de pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, studentId, phone, studentName, amount, dueDate, customMessage } = body;

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId é obrigatório' }, { status: 400 });
    }

    // Buscar configuração do Twilio
    const config = await getTwilioConfig(teacherId);
    if (!config) {
      return NextResponse.json({ error: 'Configuração do Twilio não encontrada' }, { status: 404 });
    }

    if (!config.enabled) {
      return NextResponse.json({ error: 'Integração WhatsApp está desabilitada' }, { status: 400 });
    }

    // Montar mensagem
    let message = customMessage || config.reminderMessage || 
      `Olá! Este é um lembrete de pagamento da mensalidade.

Aluno: {aluno}
Valor: R$ {valor}
Vencimento: Dia {vencimento}

Por favor, entre em contato para regularizar.`;

    // Substituir variáveis
    message = message
      .replace('{aluno}', studentName || '')
      .replace('{valor}', amount ? amount.toFixed(2) : '0,00')
      .replace('{vencimento}', dueDate?.toString() || '');

    // Enviar mensagem
    const result = await sendWhatsAppMessage(
      { accountSid: config.accountSid, authToken: config.authToken, phoneNumber: config.phoneNumber },
      phone,
      message
    );

    return NextResponse.json({ 
      success: true, 
      messageId: result.sid,
      status: result.status 
    });

  } catch (error: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao enviar mensagem' 
    }, { status: 500 });
  }
}

// PUT - Enviar lembretes para todos os pagamentos pendentes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId } = body;

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId é obrigatório' }, { status: 400 });
    }

    // Buscar configuração do Twilio
    const config = await getTwilioConfig(teacherId);
    if (!config || !config.enabled) {
      return NextResponse.json({ error: 'Configuração do Twilio não encontrada ou desabilitada' }, { status: 404 });
    }

    // Buscar alunos e pagamentos
    const students = await getStudents(teacherId);
    const payments = await getPayments(teacherId);
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = format(today, 'yyyy-MM');

    // Filtrar alunos com pagamentos pendentes
    const pendingStudents = students.filter(s => {
      if (s.status !== 'active' || s.chargeFee === false || !s.monthlyFee || !s.paymentDay) {
        return false;
      }
      
      // Verificar se já existe pagamento para este aluno no mês atual
      const hasPaymentThisMonth = payments.some(
        p => p.studentId === s.id && 
             p.referenceMonth === currentMonth && 
             (p.status === 'paid' || p.status === 'pending')
      );
      
      return !hasPaymentThisMonth && s.phone;
    });

    const results = [];
    
    for (const student of pendingStudents) {
      try {
        const isOverdue = currentDay > (student.paymentDay || 0);
        const amount = student.monthlyFee!;
        const dueDate = student.paymentDay!;

        let message = config.reminderMessage || 
          `Olá! Este é um lembrete de pagamento da mensalidade.

Aluno: {aluno}
Valor: R$ {valor}
Vencimento: Dia {vencimento}

Por favor, entre em contato para regularizar.`;

        if (isOverdue) {
          message = `⚠️ PAGAMENTO EM ATRASO ⚠️

${message}

Estamos aguardando sua regularização.`;
        }

        message = message
          .replace('{aluno}', student.name)
          .replace('{valor}', amount.toFixed(2))
          .replace('{vencimento}', dueDate.toString());

        const result = await sendWhatsAppMessage(
          { accountSid: config.accountSid, authToken: config.authToken, phoneNumber: config.phoneNumber },
          student.phone!,
          message
        );

        results.push({
          studentId: student.id,
          studentName: student.name,
          success: true,
          messageId: result.sid,
        });

      } catch (error: any) {
        results.push({
          studentId: student.id,
          studentName: student.name,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results 
    });

  } catch (error: any) {
    console.error('Erro ao enviar lembretes:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao enviar lembretes' 
    }, { status: 500 });
  }
}
