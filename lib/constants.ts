// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN Y CONSTANTES
// ═══════════════════════════════════════════════════════════════

export const CONFIG = {
  MEDIOS_PAGO: ['Mastercard', 'Visa', 'Amex', 'Efectivo'] as const,
  ENTIDADES: ['Galicia Mas', 'Galicia', 'Patagonia', 'Ciudad', 'Macro', 'Hipotecario', 'Amex directa'] as const,
  RESPONSABLES: ['Persona 1', 'Persona 2', 'Compartido'] as const,
  STORAGE_KEY: 'contabilidad_hogar_v2',
  INCOME_STORAGE_KEY: 'contabilidad_ingresos_v1',
  EXCHANGE_RATE_KEY: 'exchange_rate',
  MESES: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ] as const,
  DEFAULT_EXCHANGE_RATE: 1200,
};

// Normalizaciones de valores para importación
export const NORMALIZACIONES = {
  medios: {
    'mc': 'Mastercard',
    'master': 'Mastercard',
    'mastercard': 'Mastercard',
    'visa': 'Visa',
    'amex': 'Amex',
    'american express': 'Amex',
    'efectivo': 'Efectivo',
    'cash': 'Efectivo',
    'debito': 'Efectivo',
    'débito': 'Efectivo',
  } as Record<string, string>,
  entidades: {
    'galicia mas': 'Galicia Mas',
    'galicia más': 'Galicia Mas',
    'galiciamas': 'Galicia Mas',
    'galicia': 'Galicia',
    'bbva': 'Galicia',
    'bbva frances': 'Galicia',
    'frances': 'Galicia',
    'patagonia': 'Patagonia',
    'banco patagonia': 'Patagonia',
    'ciudad': 'Ciudad',
    'banco ciudad': 'Ciudad',
    'macro': 'Macro',
    'banco macro': 'Macro',
    'hipotecario': 'Hipotecario',
    'banco hipotecario': 'Hipotecario',
    'amex directa': 'Amex directa',
    'amex': 'Amex directa',
  } as Record<string, string>,
  responsables: {
    'persona 1': 'Persona 1',
    'persona1': 'Persona 1',
    'p1': 'Persona 1',
    '1': 'Persona 1',
    'persona 2': 'Persona 2',
    'persona2': 'Persona 2',
    'p2': 'Persona 2',
    '2': 'Persona 2',
    'compartido': 'Compartido',
    'ambos': 'Compartido',
    'todos': 'Compartido',
    'otro': 'Compartido',
  } as Record<string, string>,
};

// Colores para gráficos
export const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
};

// Categorías de gastos
export const CATEGORIAS = [
  'Servicios',
  'Transporte',
  'Alimentación',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Hogar',
  'Ropa',
  'Otros',
] as const;
