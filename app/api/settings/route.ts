import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getExchangeRate, setExchangeRate } from '@/lib/db';

// GET - Obtener configuración del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const exchangeRate = await getExchangeRate(session.user.id);
    return NextResponse.json({
      success: true,
      data: { exchangeRate }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (body.exchangeRate !== undefined) {
      await setExchangeRate(session.user.id, body.exchangeRate);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
