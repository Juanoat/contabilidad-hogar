-- ═══════════════════════════════════════════════════════════════
-- SCHEMA - Contabilidad del Hogar (con usuarios)
-- ═══════════════════════════════════════════════════════════════

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabla de gastos (con user_id)
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_month ON expenses(user_id, month_key);

-- Tabla de ingresos base (con user_id)
CREATE TABLE IF NOT EXISTS incomes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  responsable VARCHAR(50) NOT NULL,
  recurrente BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);

-- Tabla de overrides de ingresos por mes
CREATE TABLE IF NOT EXISTS income_overrides (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_key VARCHAR(7) NOT NULL,
  income_id VARCHAR(36) NOT NULL,
  descripcion TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  responsable VARCHAR(50) NOT NULL,
  recurrente BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_income_overrides_user_month ON income_overrides(user_id, month_key);

-- Tabla de configuración por usuario
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  exchange_rate DECIMAL(10,2) DEFAULT 1200,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
