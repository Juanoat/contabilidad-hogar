// ═══════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT - Contabilidad del Hogar
// ═══════════════════════════════════════════════════════════════

export type MedioPago = 'Mastercard' | 'Visa' | 'Amex' | 'Efectivo';
export type Entidad = 'Galicia Mas' | 'Galicia' | 'Patagonia' | 'Ciudad' | 'Macro' | 'Hipotecario' | 'Amex directa';
export type Responsable = 'Juano' | 'Marta' | 'Otro';
export type Moneda = 'ARS' | 'USD';

export interface Expense {
  fecha: string;  // DD/MM/YYYY
  descripcion: string;
  medio_pago: MedioPago;
  entidad: Entidad;
  cuotas: number;
  cuota_actual: number;
  monto_ars: number;
  monto_usd?: number;
  responsable: Responsable;
  categoria?: string;
  pagado?: boolean;
}

export interface Income {
  id: string;
  descripcion: string;
  monto: number;
  moneda: Moneda;
  responsable: string;
  recurrente: boolean;
}

export interface IncomeState {
  base: Income[];
  overrides: Record<string, Income[]>;
}

export interface AppState {
  currentMonth: number;
  currentYear: number;
  data: Record<string, Expense[]>;
  income: IncomeState;
  exchangeRate: number;
}

export interface AppContextType {
  state: AppState;
  // Acciones
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  setExchangeRate: (rate: number) => void;
  // Datos
  addExpenses: (expenses: Expense[], monthKey: string) => void;
  deleteExpense: (monthKey: string, index: number) => void;
  clearMonthData: (monthKey: string) => void;
  clearAllData: () => void;
  // Ingresos
  addIncome: (income: Income) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  getIncomeForMonth: (monthKey: string) => Income[];
  // Utilidades
  getMonthKey: (month: number, year: number) => string;
  getCurrentMonthKey: () => string;
  getMonthExpenses: (month: number, year: number) => Expense[];
}

// Módulos disponibles
export type ModuleId =
  | 'dashboard'
  | 'import'
  | 'debt'
  | 'income'
  | 'explorer'
  | 'calendar'
  | 'charts'
  | 'calculator';

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  icon: string;
  description?: string;
}
