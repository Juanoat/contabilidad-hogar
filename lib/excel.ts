// ═══════════════════════════════════════════════════════════════
// EXCEL PARSER - Importación de archivos Excel
// ═══════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import type { Expense } from './types';
import { CONFIG, NORMALIZACIONES } from './constants';
import { parseDate, parseNumber, parseBoolean, normalizeValue } from './parsers';

interface ColumnMap {
  descripcion: number;
  fecha: number;
  cuotas: number;
  cuotaActual: number;
  ars: number;
  usd: number;
  medio: number;
  entidad: number;
  responsable: number;
  categoria: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParsedRow {
  descripcion: string;
  fecha: string | null;
  cuotas: number;
  cuota_actual: number;
  monto_ars: number | null;
  monto_usd: number | null;
  medio_pago: string;
  entidad: string;
  responsable: string;
  categoria?: string;
  validation: ValidationResult;
  isDuplicate?: boolean;
}

export interface ImportResult {
  rows: ParsedRow[];
  duplicates: ParsedRow[];
  validCount: number;
  invalidCount: number;
}

/**
 * Parsea un archivo Excel y extrae los gastos
 */
export async function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          reject(new Error('El archivo está vacío o solo tiene encabezados'));
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h || '').toLowerCase().trim());
        const columnMap = detectColumns(headers);

        const rows: ParsedRow[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const rawRow = jsonData[i] as unknown[];
          if (!rawRow || rawRow.every(cell => cell === null || cell === undefined || cell === '')) {
            continue;
          }

          const row = parseRow(rawRow, columnMap);
          rows.push(row);
        }

        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detecta las columnas del Excel basándose en los headers
 */
function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {
    descripcion: -1,
    fecha: -1,
    cuotas: -1,
    cuotaActual: -1,
    ars: -1,
    usd: -1,
    medio: -1,
    entidad: -1,
    responsable: -1,
    categoria: -1
  };

  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();

    // Descripción
    if (h.includes('descrip') || h === 'concepto' || h === 'detalle' || h === 'nombre') {
      map.descripcion = index;
    }
    // Fecha
    if (h.includes('fecha') || h === 'date' || h === 'dia' || h === 'día') {
      map.fecha = index;
    }
    // Cuotas totales
    if ((h.includes('cuota') && !h.includes('actual') && !h.includes('monto')) || h === 'cuotas') {
      map.cuotas = index;
    }
    // Cuota actual
    if (h.includes('cuota') && h.includes('actual')) {
      map.cuotaActual = index;
    }
    // ARS - múltiples variantes
    if (h.includes('ars') || h === 'pesos' || h === 'monto ars' || h === 'gasto ars' ||
        h === 'importe ars' || h === 'valor ars' || h === 'monto_ars') {
      map.ars = index;
    }
    // USD - múltiples variantes
    if (h.includes('usd') || h.includes('dolar') || h.includes('dólar') ||
        h === 'monto usd' || h === 'gasto usd' || h === 'importe usd' || h === 'monto_usd') {
      map.usd = index;
    }
    // Medio de pago
    if (h.includes('medio') || h === 'pago' || h === 'forma de pago' || h.includes('tarjeta') || h === 'medio_pago') {
      map.medio = index;
    }
    // Entidad
    if (h.includes('entidad') || h.includes('banco') || h === 'emisor') {
      map.entidad = index;
    }
    // Responsable
    if (h.includes('responsable') || h.includes('persona') || h === 'quien' || h === 'quién') {
      map.responsable = index;
    }
    // Categoría
    if (h.includes('categoria') || h.includes('categoría') || h === 'rubro' || h === 'tipo') {
      map.categoria = index;
    }
  });

  // Si no encontramos ARS, buscar columna genérica "monto" o "importe"
  if (map.ars === -1) {
    headers.forEach((header, index) => {
      const h = header.toLowerCase().trim();
      if ((h === 'monto' || h === 'importe' || h === 'valor' || h === 'gasto' || h === 'total') &&
          !h.includes('usd') && !h.includes('dolar')) {
        map.ars = index;
      }
    });
  }

  return map;
}

/**
 * Parsea una fila del Excel
 */
function parseRow(rawRow: unknown[], columnMap: ColumnMap): ParsedRow {
  const getValue = (index: number): unknown => index >= 0 ? rawRow[index] : null;

  const row: ParsedRow = {
    descripcion: String(getValue(columnMap.descripcion) || '').trim(),
    fecha: parseDate(getValue(columnMap.fecha)),
    cuotas: parseInt(String(getValue(columnMap.cuotas) || '1')) || 1,
    cuota_actual: parseInt(String(getValue(columnMap.cuotaActual) || '1')) || 1,
    monto_ars: parseNumber(getValue(columnMap.ars)),
    monto_usd: parseNumber(getValue(columnMap.usd)),
    medio_pago: normalizeValue(String(getValue(columnMap.medio) || ''), 'medios'),
    entidad: normalizeValue(String(getValue(columnMap.entidad) || ''), 'entidades'),
    responsable: normalizeValue(String(getValue(columnMap.responsable) || ''), 'responsables'),
    categoria: String(getValue(columnMap.categoria) || '').trim() || undefined,
    validation: { isValid: true, errors: [], warnings: [] }
  };

  // Validar la fila
  row.validation = validateRow(row);

  return row;
}

/**
 * Valida una fila parseada
 */
function validateRow(row: ParsedRow): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!row.descripcion || row.descripcion.trim() === '') {
    errors.push('Falta descripción');
  }
  if (!row.fecha) {
    errors.push('Falta fecha');
  }
  if (row.monto_ars === null && row.monto_usd === null) {
    errors.push('Falta monto (ARS o USD)');
  }

  if (row.medio_pago && !CONFIG.MEDIOS_PAGO.includes(row.medio_pago as typeof CONFIG.MEDIOS_PAGO[number])) {
    warnings.push(`Medio de pago "${row.medio_pago}" no reconocido`);
  }
  if (row.entidad && !CONFIG.ENTIDADES.includes(row.entidad as typeof CONFIG.ENTIDADES[number])) {
    warnings.push(`Entidad "${row.entidad}" no reconocida`);
  }
  if (row.responsable && !CONFIG.RESPONSABLES.includes(row.responsable as typeof CONFIG.RESPONSABLES[number])) {
    warnings.push(`Responsable "${row.responsable}" no reconocido`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Detecta duplicados comparando con datos existentes
 */
export function checkDuplicates(newRows: ParsedRow[], existingRows: Expense[]): ParsedRow[] {
  const duplicates: ParsedRow[] = [];

  for (const newRow of newRows) {
    for (const existing of existingRows) {
      if (
        newRow.descripcion === existing.descripcion &&
        newRow.fecha === existing.fecha &&
        newRow.monto_ars === existing.monto_ars &&
        newRow.entidad === existing.entidad
      ) {
        duplicates.push(newRow);
        newRow.isDuplicate = true;
        break;
      }
    }
  }

  return duplicates;
}

/**
 * Convierte ParsedRow a Expense para guardar
 */
export function parsedRowToExpense(row: ParsedRow): Expense {
  return {
    fecha: row.fecha || '',
    descripcion: row.descripcion,
    medio_pago: (row.medio_pago || 'Efectivo') as Expense['medio_pago'],
    entidad: (row.entidad || 'Galicia') as Expense['entidad'],
    cuotas: row.cuotas,
    cuota_actual: row.cuota_actual,
    monto_ars: row.monto_ars || 0,
    monto_usd: row.monto_usd || undefined,
    responsable: (row.responsable || 'Otro') as Expense['responsable'],
    categoria: row.categoria,
    pagado: false
  };
}

/**
 * Procesa un archivo Excel completo y devuelve el resultado de importación
 */
export async function processExcelImport(
  file: File,
  existingExpenses: Expense[]
): Promise<ImportResult> {
  const rows = await parseExcelFile(file);
  const duplicates = checkDuplicates(rows, existingExpenses);

  return {
    rows,
    duplicates,
    validCount: rows.filter(r => r.validation.isValid).length,
    invalidCount: rows.filter(r => !r.validation.isValid).length
  };
}
