import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRate, setExchangeRate } from '@/lib/db';

// GET - Obtener configuración
export async function GET() {
  try {
    const exchangeRate = await getExchangeRate();
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
    const body = await request.json();

    if (body.exchangeRate !== undefined) {
      await setExchangeRate(body.exchangeRate);
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
