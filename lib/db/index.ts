// ═══════════════════════════════════════════════════════════════
// DATABASE CLIENT - Conexión a Neon Postgres
// ═══════════════════════════════════════════════════════════════

import { sql } from '@vercel/postgres';
import type { Expense, Income } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════

export async function getExpensesByMonth(monthKey: string): Promise<Expense[]> {
  const { rows } = await sql`
    SELECT * FROM expenses WHERE month_key = ${monthKey} ORDER BY fecha DESC
  `;
  return rows.map(row => ({
    fecha: row.fecha,
    descripcion: row.descripcion,
    medio_pago: row.medio_pago,
    entidad: row.entidad,
    cuotas: row.cuotas,
    cuota_actual: row.cuota_actual,
    monto_ars: parseFloat(row.monto_ars) || 0,
    monto_usd: row.monto_usd ? parseFloat(row.monto_usd) : undefined,
    responsable: row.responsable,
    categoria: row.categoria,
    pagado: row.pagado,
  }));
}

export async function getAllExpenses(): Promise<Record<string, Expense[]>> {
  const { rows } = await sql`
    SELECT * FROM expenses ORDER BY month_key DESC, fecha DESC
  `;

  const grouped: Record<string, Expense[]> = {};
  rows.forEach(row => {
    const monthKey = row.month_key;
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push({
      fecha: row.fecha,
      descripcion: row.descripcion,
      medio_pago: row.medio_pago,
      entidad: row.entidad,
      cuotas: row.cuotas,
      cuota_actual: row.cuota_actual,
      monto_ars: parseFloat(row.monto_ars) || 0,
      monto_usd: row.monto_usd ? parseFloat(row.monto_usd) : undefined,
      responsable: row.responsable,
      categoria: row.categoria,
      pagado: row.pagado,
    });
  });
  return grouped;
}

export async function addExpenses(expenses: Expense[], monthKey: string): Promise<void> {
  for (const expense of expenses) {
    await sql`
      INSERT INTO expenses (month_key, fecha, descripcion, medio_pago, entidad, cuotas, cuota_actual, monto_ars, monto_usd, responsable, categoria, pagado)
      VALUES (${monthKey}, ${expense.fecha}, ${expense.descripcion}, ${expense.medio_pago}, ${expense.entidad}, ${expense.cuotas}, ${expense.cuota_actual}, ${expense.monto_ars}, ${expense.monto_usd || 0}, ${expense.responsable}, ${expense.categoria || null}, ${expense.pagado || false})
    `;
  }
}

export async function deleteExpense(monthKey: string, index: number): Promise<void> {
  // Obtener el ID real del gasto en esa posición
  const { rows } = await sql`
    SELECT id FROM expenses WHERE month_key = ${monthKey} ORDER BY fecha DESC LIMIT 1 OFFSET ${index}
  `;
  if (rows.length > 0) {
    await sql`DELETE FROM expenses WHERE id = ${rows[0].id}`;
  }
}

export async function clearMonthExpenses(monthKey: string): Promise<void> {
  await sql`DELETE FROM expenses WHERE month_key = ${monthKey}`;
}

export async function clearAllExpenses(): Promise<void> {
  await sql`DELETE FROM expenses`;
}

// ═══════════════════════════════════════════════════════════════
// INCOMES
// ═══════════════════════════════════════════════════════════════

export async function getBaseIncomes(): Promise<Income[]> {
  const { rows } = await sql`SELECT * FROM incomes ORDER BY created_at`;
  return rows.map(row => ({
    id: row.id,
    descripcion: row.descripcion,
    monto: parseFloat(row.monto),
    moneda: row.moneda,
    responsable: row.responsable,
    recurrente: row.recurrente,
  }));
}

export async function addIncome(income: Income): Promise<void> {
  await sql`
    INSERT INTO incomes (id, descripcion, monto, moneda, responsable, recurrente)
    VALUES (${income.id}, ${income.descripcion}, ${income.monto}, ${income.moneda}, ${income.responsable}, ${income.recurrente})
  `;
}

export async function updateIncome(id: string, updates: Partial<Income>): Promise<void> {
  const current = await sql`SELECT * FROM incomes WHERE id = ${id}`;
  if (current.rows.length === 0) return;

  const row = current.rows[0];
  await sql`
    UPDATE incomes SET
      descripcion = ${updates.descripcion ?? row.descripcion},
      monto = ${updates.monto ?? row.monto},
      moneda = ${updates.moneda ?? row.moneda},
      responsable = ${updates.responsable ?? row.responsable},
      recurrente = ${updates.recurrente ?? row.recurrente}
    WHERE id = ${id}
  `;
}

export async function deleteIncome(id: string): Promise<void> {
  await sql`DELETE FROM incomes WHERE id = ${id}`;
}

export async function clearAllIncomes(): Promise<void> {
  await sql`DELETE FROM incomes`;
  await sql`DELETE FROM income_overrides`;
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export async function getExchangeRate(): Promise<number> {
  const { rows } = await sql`SELECT value FROM settings WHERE key = 'exchange_rate'`;
  return rows.length > 0 ? parseFloat(rows[0].value) : 1200;
}

export async function setExchangeRate(rate: number): Promise<void> {
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('exchange_rate', ${rate.toString()}, CURRENT_TIMESTAMP)
    ON CONFLICT (key) DO UPDATE SET value = ${rate.toString()}, updated_at = CURRENT_TIMESTAMP
  `;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export async function initializeDatabase(): Promise<void> {
  // Crear tabla de gastos
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      month_key VARCHAR(7) NOT NULL,
      fecha VARCHAR(10) NOT NULL,
      descripcion TEXT NOT NULL,
      medio_pago VARCHAR(20) NOT NULL,
      entidad VARCHAR(30) NOT NULL,
      cuotas INTEGER DEFAULT 1,
      cuota_actual INTEGER DEFAULT 1,
      monto_ars DECIMAL(12,2) DEFAULT 0,
      monto_usd DECIMAL(12,2) DEFAULT 0,
      responsable VARCHAR(20) NOT NULL,
      categoria VARCHAR(50),
      pagado BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Crear índice
  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_month_key ON expenses(month_key)`;

  // Crear tabla de ingresos
  await sql`
    CREATE TABLE IF NOT EXISTS incomes (
      id VARCHAR(36) PRIMARY KEY,
      descripcion TEXT NOT NULL,
      monto DECIMAL(12,2) NOT NULL,
      moneda VARCHAR(3) DEFAULT 'ARS',
      responsable VARCHAR(50) NOT NULL,
      recurrente BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Crear tabla de overrides
  await sql`
    CREATE TABLE IF NOT EXISTS income_overrides (
      id SERIAL PRIMARY KEY,
      month_key VARCHAR(7) NOT NULL,
      income_id VARCHAR(36) NOT NULL,
      descripcion TEXT NOT NULL,
      monto DECIMAL(12,2) NOT NULL,
      moneda VARCHAR(3) DEFAULT 'ARS',
      responsable VARCHAR(50) NOT NULL,
      recurrente BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_income_overrides_month ON income_overrides(month_key)`;

  // Crear tabla de configuración
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insertar exchange rate por defecto
  await sql`
    INSERT INTO settings (key, value)
    VALUES ('exchange_rate', '1200')
    ON CONFLICT (key) DO NOTHING
  `;
}
