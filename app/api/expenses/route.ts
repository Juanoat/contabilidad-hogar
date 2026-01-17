import { NextRequest, NextResponse } from 'next/server';
import {
  getAllExpenses,
  addExpenses,
  deleteExpense,
  clearMonthExpenses,
  clearAllExpenses,
} from '@/lib/db';

// GET - Obtener todos los gastos
export async function GET() {
  try {
    const data = await getAllExpenses();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST - Agregar gastos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expenses, monthKey } = body;

    if (!expenses || !monthKey) {
      return NextResponse.json(
        { success: false, error: 'Missing expenses or monthKey' },
        { status: 400 }
      );
    }

    await addExpenses(expenses, monthKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding expenses:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Borrar gastos
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get('monthKey');
    const index = searchParams.get('index');
    const all = searchParams.get('all');

    if (all === 'true') {
      await clearAllExpenses();
      return NextResponse.json({ success: true, message: 'All expenses deleted' });
    }

    if (!monthKey) {
      return NextResponse.json(
        { success: false, error: 'Missing monthKey' },
        { status: 400 }
      );
    }

    if (index !== null) {
      await deleteExpense(monthKey, parseInt(index));
    } else {
      await clearMonthExpenses(monthKey);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expenses:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
