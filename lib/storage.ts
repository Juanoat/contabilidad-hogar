// ═══════════════════════════════════════════════════════════════
// STORAGE - LocalStorage Wrapper
// ═══════════════════════════════════════════════════════════════

import { CONFIG } from './constants';
import type { Expense, IncomeState, AppState } from './types';

/**
 * Carga los gastos desde localStorage
 */
export function loadExpensesFromStorage(): Record<string, Expense[]> {
  if (typeof window === 'undefined') return {};

  const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading expenses from localStorage:', e);
      return {};
    }
  }
  return {};
}

/**
 * Guarda los gastos en localStorage
 */
export function saveExpensesToStorage(data: Record<string, Expense[]>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
}

/**
 * Carga los ingresos desde localStorage
 */
export function loadIncomeFromStorage(): IncomeState {
  if (typeof window === 'undefined') return { base: [], overrides: {} };

  const saved = localStorage.getItem(CONFIG.INCOME_STORAGE_KEY);
  if (saved) {
    try {
      const income = JSON.parse(saved);
      // Asegurar estructura correcta
      if (!income.base) income.base = [];
      if (!income.overrides) income.overrides = {};
      return income;
    } catch (e) {
      console.error('Error loading income from localStorage:', e);
      return { base: [], overrides: {} };
    }
  }
  return { base: [], overrides: {} };
}

/**
 * Guarda los ingresos en localStorage
 */
export function saveIncomeToStorage(income: IncomeState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONFIG.INCOME_STORAGE_KEY, JSON.stringify(income));
}

/**
 * Carga la tasa de cambio desde localStorage
 */
export function loadExchangeRate(): number {
  if (typeof window === 'undefined') return CONFIG.DEFAULT_EXCHANGE_RATE;

  const saved = localStorage.getItem(CONFIG.EXCHANGE_RATE_KEY);
  if (saved) {
    const rate = parseFloat(saved);
    return isNaN(rate) ? CONFIG.DEFAULT_EXCHANGE_RATE : rate;
  }
  return CONFIG.DEFAULT_EXCHANGE_RATE;
}

/**
 * Guarda la tasa de cambio en localStorage
 */
export function saveExchangeRate(rate: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONFIG.EXCHANGE_RATE_KEY, String(rate));
}

/**
 * Obtiene el estado inicial de la aplicación
 */
export function getInitialState(): AppState {
  const now = new Date();
  return {
    currentMonth: now.getMonth(),
    currentYear: now.getFullYear(),
    data: {},
    income: { base: [], overrides: {} },
    exchangeRate: CONFIG.DEFAULT_EXCHANGE_RATE,
  };
}

/**
 * Carga todo el estado desde localStorage
 */
export function loadFullState(): AppState {
  const state = getInitialState();

  if (typeof window !== 'undefined') {
    state.data = loadExpensesFromStorage();
    state.income = loadIncomeFromStorage();
    state.exchangeRate = loadExchangeRate();
  }

  return state;
}

/**
 * Limpia todos los datos de la aplicación
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  localStorage.removeItem(CONFIG.INCOME_STORAGE_KEY);
  localStorage.removeItem(CONFIG.EXCHANGE_RATE_KEY);
}
