import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getBaseIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  clearAllIncomes,
} from '@/lib/db';

// GET - Obtener todos los ingresos del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const data = await getBaseIncomes(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching incomes:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST - Agregar ingreso
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const income = await request.json();

    if (!income.id || !income.descripcion) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await addIncome(session.user.id, income);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding income:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PUT - Actualizar ingreso
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
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id' },
        { status: 400 }
      );
    }

    await updateIncome(session.user.id, id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating income:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Borrar ingreso
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      await clearAllIncomes(session.user.id);
      return NextResponse.json({ success: true, message: 'All incomes deleted' });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id' },
        { status: 400 }
      );
    }

    await deleteIncome(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting income:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
