import { NextRequest, NextResponse } from 'next/server';

// Esta API apenas valida o JSON e retorna sucesso
// A importação real é feita no cliente para evitar problemas com Firebase no servidor

interface ImportData {
  usuarios?: Array<any>;
  professores?: Array<any>;
  alunos?: Array<any>;
  aulas?: Array<any>;
  pagamentos?: Array<any>;
}

export async function POST(request: NextRequest) {
  try {
    const data: ImportData = await request.json();
    
    // Validar estrutura básica
    const counts = {
      usuarios: data.usuarios?.length || 0,
      professores: data.professores?.length || 0,
      alunos: data.alunos?.length || 0,
      aulas: data.aulas?.length || 0,
      pagamentos: data.pagamentos?.length || 0,
    };

    // Validar se tem pelo menos algum dado
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado encontrado no JSON' },
        { status: 400 }
      );
    }

    // Retornar os dados validados para importação no cliente
    return NextResponse.json({
      success: true,
      message: 'JSON válido',
      counts,
      data, // Retorna os dados para o cliente importar
    });
  } catch (error: any) {
    console.error('Import validation error:', error);
    return NextResponse.json(
      { error: 'JSON inválido', details: error.message },
      { status: 400 }
    );
  }
}
