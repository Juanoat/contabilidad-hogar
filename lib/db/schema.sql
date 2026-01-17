-- ═══════════════════════════════════════════════════════════════
-- SCHEMA - Contabilidad del Hogar
-- ═══════════════════════════════════════════════════════════════

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  month_key VARCHAR(7) NOT NULL,  -- formato: "MM-YYYY"
  fecha VARCHAR(10) NOT NULL,     -- formato: "DD/MM/YYYY"
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
);

-- Índice para búsquedas por mes
CREATE INDEX IF NOT EXISTS idx_expenses_month_key ON expenses(month_key);

-- Tabla de ingresos base (recurrentes)
CREATE TABLE IF NOT EXISTS incomes (
  id VARCHAR(36) PRIMARY KEY,
  descripcion TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  responsable VARCHAR(50) NOT NULL,
  recurrente BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de overrides de ingresos por mes
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
);

CREATE INDEX IF NOT EXISTS idx_income_overrides_month ON income_overrides(month_key);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar exchange rate por defecto
INSERT INTO settings (key, value)
VALUES ('exchange_rate', '1200')
ON CONFLICT (key) DO NOTHING;
