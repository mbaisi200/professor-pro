import { NextRequest, NextResponse } from 'next/server';
import Twilio from 'twilio';
import { 
  getTwilioConfig, 
  getStudents, 
  getPayments,
  logWhatsAppReminder,
  hasReminderBeenSent
} from '@/lib/firestore';
import { format } from 'date-fns';

// Helper para formatar número de telefone
function formatPhoneNumber(phone: string): string {
  let formatted = phone.replace(/\D/g, '');
  if (!formatted.startsWith('55')) {
    formatted = '55' + formatted;
  }
  return formatted;
}

// Enviar mensagem via Twilio
async function sendWhatsAppMessage(
  config: { accountSid: string; authToken: string; phoneNumber: string },
  to: string,
  message: string
) {
  const client = Twilio(config.accountSid, config.authToken);
  
  const result = await client.messages.create({
    from: config.phoneNumber,
    to: `whatsapp:+${to}`,
    body: message,
  });
  
  return result;
}

// GET - Verificar status do cron
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'WhatsApp reminder cron is running',
    timestamp: new Date().toISOString()
  });
}

// POST - Executar verificação e envio de lembretes
export async function POST(request: NextRequest) {
  try {
    // Verificar autorização (Vercel Cron Jobs envia header específico ou usar token)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Se tiver secret configurado, verificar
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { teacherId: specificTeacherId } = body;

    // Buscar todos os teachers com WhatsApp configurado ou um específico
    // Por simplicidade, vamos processar um teacher por vez
    // Em produção, você pode querer buscar todos os teachers ativos
    
    if (!specificTeacherId) {
      return NextResponse.json({ 
        error: 'teacherId é obrigatório no body' 
      }, { status: 400 });
    }

    const config = await getTwilioConfig(specificTeacherId);
    
    if (!config || !config.enabled || !config.autoSendEnabled) {
      return NextResponse.json({ 
        message: 'WhatsApp não configurado ou envio automático desabilitado',
        processed: 0 
      });
    }

    // Data atual
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = format(today, 'yyyy-MM');
    
    // Buscar alunos e pagamentos
    const students = await getStudents(specificTeacherId);
    const payments = await getPayments(specificTeacherId);

    // Filtrar alunos elegíveis para lembrete
    const eligibleStudents = students.filter(s => {
      // Aluno ativo, com mensalidade e dia de pagamento definidos
      if (s.status !== 'active' || !s.monthlyFee || !s.paymentDay || !s.phone) {
        return false;
      }
      
      // Verificar se cobra mensalidade
      if (s.chargeFee === false) {
        return false;
      }
      
      // Verificar se já existe pagamento para este mês
      const hasPaymentThisMonth = payments.some(
        p => p.studentId === s.id && 
             p.referenceMonth === currentMonth && 
             (p.status === 'paid' || p.status === 'pending')
      );
      
      if (hasPaymentThisMonth) {
        return false;
      }
      
      // Verificar se já enviou lembrete este mês
      // Nota: isso é assíncrono, vamos verificar depois
      
      return true;
    });

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };

    for (const student of eligibleStudents) {
      try {
        // Verificar se já enviou lembrete
        const alreadySent = await hasReminderBeenSent(specificTeacherId, student.id!, currentMonth);
        if (alreadySent) {
          results.skipped++;
          continue;
        }

        // Verificar se está no dia correto para enviar
        const dueDay = student.paymentDay!;
        const daysBeforeDue = config.autoSendBeforeDue || 0;
        const targetDay = dueDay - daysBeforeDue;
        
        // Enviar se:
        // 1. É o dia exato do envio (targetDay)
        // 2. Ou já passou do dia de vencimento (atrasado)
        const isOnTargetDay = currentDay === targetDay;
        const isOverdue = currentDay > dueDay;
        
        if (!isOnTargetDay && !isOverdue) {
          results.skipped++;
          continue;
        }

        // Montar mensagem
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
          .replace('{valor}', student.monthlyFee!.toFixed(2))
          .replace('{vencimento}', dueDay.toString());

        // Enviar mensagem
        const formattedPhone = formatPhoneNumber(student.phone!);
        const result = await sendWhatsAppMessage(
          { 
            accountSid: config.accountSid, 
            authToken: config.authToken, 
            phoneNumber: config.phoneNumber 
          },
          formattedPhone,
          message
        );

        // Registrar log
        await logWhatsAppReminder({
          teacherId: specificTeacherId,
          studentId: student.id!,
          studentName: student.name,
          phone: student.phone!,
          amount: student.monthlyFee!,
          dueDate: dueDay,
          status: result.status === 'failed' ? 'failed' : 'sent',
          messageId: result.sid,
          referenceMonth: currentMonth,
          errorMessage: result.errorMessage,
        });

        results.processed++;
        if (result.status === 'failed') {
          results.failed++;
        } else {
          results.sent++;
        }

        results.details.push({
          student: student.name,
          status: result.status,
          messageId: result.sid,
        });

      } catch (error: any) {
        results.failed++;
        results.details.push({
          student: student.name,
          status: 'error',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error: any) {
    console.error('Erro no cron de lembretes:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao processar lembretes' 
    }, { status: 500 });
  }
}
