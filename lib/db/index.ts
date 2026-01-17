// ═══════════════════════════════════════════════════════════════
// DATABASE CLIENT - Conexión a Neon Postgres (con usuarios)
// ═══════════════════════════════════════════════════════════════

import { sql } from '@vercel/postgres';
import type { Expense, Income } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════

export async function getExpensesByMonth(userId: string, monthKey: string): Promise<Expense[]> {
  const { rows } = await sql`
    SELECT * FROM expenses
    WHERE user_id = ${userId} AND month_key = ${monthKey}
    ORDER BY fecha DESC
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

export async function getAllExpenses(userId: string): Promise<Record<string, Expense[]>> {
  const { rows } = await sql`
    SELECT * FROM expenses
    WHERE user_id = ${userId}
    ORDER BY month_key DESC, fecha DESC
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

export async function addExpenses(userId: string, expenses: Expense[], monthKey: string): Promise<void> {
  for (const expense of expenses) {
    await sql`
      INSERT INTO expenses (user_id, month_key, fecha, descripcion, medio_pago, entidad, cuotas, cuota_actual, monto_ars, monto_usd, responsable, categoria, pagado)
      VALUES (${userId}, ${monthKey}, ${expense.fecha}, ${expense.descripcion}, ${expense.medio_pago}, ${expense.entidad}, ${expense.cuotas}, ${expense.cuota_actual}, ${expense.monto_ars}, ${expense.monto_usd || 0}, ${expense.responsable}, ${expense.categoria || null}, ${expense.pagado || false})
    `;
  }
}

export async function deleteExpense(userId: string, monthKey: string, index: number): Promise<void> {
  const { rows } = await sql`
    SELECT id FROM expenses
    WHERE user_id = ${userId} AND month_key = ${monthKey}
    ORDER BY fecha DESC
    LIMIT 1 OFFSET ${index}
  `;
  if (rows.length > 0) {
    await sql`DELETE FROM expenses WHERE id = ${rows[0].id} AND user_id = ${userId}`;
  }
}

export async function clearMonthExpenses(userId: string, monthKey: string): Promise<void> {
  await sql`DELETE FROM expenses WHERE user_id = ${userId} AND month_key = ${monthKey}`;
}

export async function clearAllExpenses(userId: string): Promise<void> {
  await sql`DELETE FROM expenses WHERE user_id = ${userId}`;
}

// ═══════════════════════════════════════════════════════════════
// INCOMES
// ═══════════════════════════════════════════════════════════════

export async function getBaseIncomes(userId: string): Promise<Income[]> {
  const { rows } = await sql`
    SELECT * FROM incomes WHERE user_id = ${userId} ORDER BY created_at
  `;
  return rows.map(row => ({
    id: row.id,
    descripcion: row.descripcion,
    monto: parseFloat(row.monto),
    moneda: row.moneda,
    responsable: row.responsable,
    recurrente: row.recurrente,
  }));
}

export async function addIncome(userId: string, income: Income): Promise<void> {
  await sql`
    INSERT INTO incomes (id, user_id, descripcion, monto, moneda, responsable, recurrente)
    VALUES (${income.id}, ${userId}, ${income.descripcion}, ${income.monto}, ${income.moneda}, ${income.responsable}, ${income.recurrente})
  `;
}

export async function updateIncome(userId: string, id: string, updates: Partial<Income>): Promise<void> {
  const current = await sql`SELECT * FROM incomes WHERE id = ${id} AND user_id = ${userId}`;
  if (current.rows.length === 0) return;

  const row = current.rows[0];
  await sql`
    UPDATE incomes SET
      descripcion = ${updates.descripcion ?? row.descripcion},
      monto = ${updates.monto ?? row.monto},
      moneda = ${updates.moneda ?? row.moneda},
      responsable = ${updates.responsable ?? row.responsable},
      recurrente = ${updates.recurrente ?? row.recurrente}
    WHERE id = ${id} AND user_id = ${userId}
  `;
}

export async function deleteIncome(userId: string, id: string): Promise<void> {
  await sql`DELETE FROM incomes WHERE id = ${id} AND user_id = ${userId}`;
}

export async function clearAllIncomes(userId: string): Promise<void> {
  await sql`DELETE FROM incomes WHERE user_id = ${userId}`;
  await sql`DELETE FROM income_overrides WHERE user_id = ${userId}`;
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export async function getExchangeRate(userId: string): Promise<number> {
  const { rows } = await sql`
    SELECT exchange_rate FROM user_settings WHERE user_id = ${userId}
  `;
  return rows.length > 0 ? parseFloat(rows[0].exchange_rate) : 1200;
}

export async function setExchangeRate(userId: string, rate: number): Promise<void> {
  await sql`
    INSERT INTO user_settings (user_id, exchange_rate, updated_at)
    VALUES (${userId}, ${rate}, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET exchange_rate = ${rate}, updated_at = CURRENT_TIMESTAMP
  `;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export async function initializeDatabase(): Promise<void> {
  // Crear tabla de usuarios
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

  // Crear tabla de gastos
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
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

  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_user_month ON expenses(user_id, month_key)`;

  // Crear tabla de ingresos
  await sql`
    CREATE TABLE IF NOT EXISTS incomes (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      descripcion TEXT NOT NULL,
      monto DECIMAL(12,2) NOT NULL,
      moneda VARCHAR(3) DEFAULT 'ARS',
      responsable VARCHAR(50) NOT NULL,
      recurrente BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id)`;

  // Crear tabla de overrides
  await sql`
    CREATE TABLE IF NOT EXISTS income_overrides (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
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

  await sql`CREATE INDEX IF NOT EXISTS idx_income_overrides_user_month ON income_overrides(user_id, month_key)`;

  // Crear tabla de configuración por usuario
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id VARCHAR(36) PRIMARY KEY,
      exchange_rate DECIMAL(10,2) DEFAULT 1200,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}
