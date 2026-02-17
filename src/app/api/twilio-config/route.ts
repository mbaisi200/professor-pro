import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConfig, saveTwilioConfig, deleteTwilioConfig } from '@/lib/firestore';

// GET - Buscar configuração do Twilio
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId é obrigatório' }, { status: 400 });
    }

    const config = await getTwilioConfig(teacherId);
    
    // Não retornar o authToken por segurança
    if (config) {
      return NextResponse.json({ 
        ...config, 
        authToken: config.authToken ? '••••••••' : '' 
      });
    }
    
    return NextResponse.json(null);

  } catch (error: any) {
    console.error('Erro ao buscar configuração:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao buscar configuração' 
    }, { status: 500 });
  }
}

// POST - Salvar configuração do Twilio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      teacherId, 
      accountSid, 
      authToken, 
      phoneNumber, 
      reminderDays, 
      reminderMessage, 
      enabled,
      autoSendEnabled,
      autoSendTime,
      autoSendBeforeDue,
      timezone
    } = body;

    if (!teacherId || !accountSid || !authToken || !phoneNumber) {
      return NextResponse.json({ 
        error: 'teacherId, accountSid, authToken e phoneNumber são obrigatórios' 
      }, { status: 400 });
    }

    const config = await saveTwilioConfig({
      teacherId,
      accountSid,
      authToken,
      phoneNumber,
      reminderDays: reminderDays || 3,
      reminderMessage: reminderMessage || `Olá! Este é um lembrete de pagamento da mensalidade.

Aluno: {aluno}
Valor: R$ {valor}
Vencimento: Dia {vencimento}

Por favor, entre em contato para regularizar.`,
      enabled: enabled ?? true,
      autoSendEnabled: autoSendEnabled ?? false,
      autoSendTime: autoSendTime || '09:00',
      autoSendBeforeDue: autoSendBeforeDue ?? 0,
      timezone: timezone || 'America/Sao_Paulo',
    });

    return NextResponse.json({ 
      success: true, 
      config: { ...config, authToken: '••••••••' } 
    });

  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao salvar configuração' 
    }, { status: 500 });
  }
}

// DELETE - Remover configuração do Twilio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId é obrigatório' }, { status: 400 });
    }

    await deleteTwilioConfig(teacherId);
    
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao deletar configuração:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao deletar configuração' 
    }, { status: 500 });
  }
}
