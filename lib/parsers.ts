// ═══════════════════════════════════════════════════════════════
// PARSERS Y UTILIDADES
// ═══════════════════════════════════════════════════════════════

import { NORMALIZACIONES } from './constants';

/**
 * Genera la clave del mes en formato YYYY-MM
 */
export function getMonthKey(month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Normaliza un valor según su tipo (medio_pago, entidad, responsable)
 */
export function normalizeValue(value: string | null | undefined, type: 'medios' | 'entidades' | 'responsables'): string {
  if (!value) return '';
  const normalized = String(value).toLowerCase().trim();
  return NORMALIZACIONES[type]?.[normalized] || value;
}

/**
 * Parsea una fecha de Excel o string a formato DD/MM/YYYY
 */
export function parseDate(value: unknown): string | null {
  if (!value) return null;

  // Si es un número de Excel (días desde 1900)
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return formatDateToString(date);
  }

  // Si ya está en formato DD/MM/YYYY
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  // Intentar parsear otros formatos
  const date = new Date(value as string);
  if (!isNaN(date.getTime())) {
    return formatDateToString(date);
  }

  return value as string;
}

/**
 * Formatea una fecha a DD/MM/YYYY
 */
export function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parsea un string de fecha DD/MM/YYYY a Date
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parsea un número de varios formatos (moneda, separadores, etc.)
 */
export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;

  const cleaned = String(value)
    .replace(/[$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parsea un booleano de varios formatos
 */
export function parseBoolean(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'boolean') return value;

  const str = String(value).toLowerCase().trim();
  return ['true', '1', 'si', 'sí', 'yes', 'x', 'verdadero'].includes(str);
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(value: number | null | undefined, currency: 'ARS' | 'USD' = 'ARS'): string {
  if (value === null || value === undefined) return '-';
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(value);
  return currency === 'USD' ? `US$ ${formatted}` : `$ ${formatted}`;
}

/**
 * Formatea un número como moneda corta (ej: $1.5M, $500K)
 */
export function formatCurrencyShort(value: number): string {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '$' + Math.round(value / 1000) + 'K';
  }
  return '$' + Math.round(value);
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return Date.now() + Math.random().toString(36).substring(2, 11);
}

/**
 * Capitaliza la primera letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
