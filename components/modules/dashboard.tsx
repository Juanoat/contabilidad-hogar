"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useApp } from "@/contexts/AppContext"
import { CONFIG } from "@/lib/constants"
import { formatCurrency } from "@/lib/parsers"
import { Target, ArrowUpRight, ArrowDownRight, CreditCard, Repeat, ShoppingBag, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppStateCompat {
  month: number
  year: number
  exchangeRate: number
}

interface DashboardProps {
  appState: AppStateCompat
  setAppState: (state: AppStateCompat | ((prev: AppStateCompat) => AppStateCompat)) => void
}

export function Dashboard({ appState, setAppState }: DashboardProps) {
  const { state, getMonthExpenses } = useApp()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Obtener gastos del mes actual
  const expenses = useMemo(() => {
    return getMonthExpenses(appState.month, appState.year)
  }, [getMonthExpenses, appState.month, appState.year])

  // Calcular totales
  const totals = useMemo(() => {
    let totalARS = 0
    let totalUSD = 0
    let countARS = 0
    let countUSD = 0

    expenses.forEach(exp => {
      if (exp.monto_usd && exp.monto_usd > 0) {
        totalUSD += exp.monto_usd
        countUSD++
      } else if (exp.monto_ars) {
        totalARS += exp.monto_ars
        countARS++
      }
    })

    return { totalARS, totalUSD, countARS, countUSD }
  }, [expenses])

  const totalCombined = totals.totalARS + totals.totalUSD * appState.exchangeRate

  // Calcular breakdown por categoría (usando medio_pago como categoría por ahora)
  const categoryBreakdown = useMemo(() => {
    const byCategory: Record<string, number> = {}

    expenses.forEach(exp => {
      const cat = exp.medio_pago || 'Otro'
      byCategory[cat] = (byCategory[cat] || 0) + (exp.monto_ars || 0)
    })

    const total = Object.values(byCategory).reduce((a, b) => a + b, 0)
    const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount], idx) => ({
        name,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: colors[idx % colors.length]
      }))
  }, [expenses])

  // Calcular gastos en cuotas
  const cuotasStats = useMemo(() => {
    const withCuotas = expenses.filter(e => e.cuotas > 1)
    let lastCuotaDate: Date | null = null
    let monthsRemaining = 0

    withCuotas.forEach(exp => {
      const remaining = exp.cuotas - exp.cuota_actual
      if (remaining > monthsRemaining) {
        monthsRemaining = remaining
      }
    })

    // Calcular fecha de última cuota
    if (monthsRemaining > 0) {
      lastCuotaDate = new Date(appState.year, appState.month + monthsRemaining, 1)
    }

    return {
      count: withCuotas.length,
      monthsRemaining,
      lastCuotaDate
    }
  }, [expenses, appState.month, appState.year])

  // Obtener últimos 5 gastos
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .slice(-5)
      .reverse()
      .map((exp, idx) => ({
        id: idx,
        desc: exp.descripcion,
        amount: exp.monto_ars || (exp.monto_usd ? exp.monto_usd * appState.exchangeRate : 0),
        currency: exp.monto_usd ? 'USD' : 'ARS',
        category: exp.medio_pago,
        type: exp.cuotas > 1 ? 'cuota' : 'variable',
        remaining: exp.cuotas > 1 ? exp.cuotas - exp.cuota_actual : undefined
      }))
  }, [expenses, appState.exchangeRate])

  const hasData = expenses.length > 0

  return (
    <div className="p-4 lg:p-8 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">
            {CONFIG.MESES[appState.month]}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{appState.year}</p>
        </div>

        <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">USD</span>
          <input
            type="number"
            value={appState.exchangeRate}
            onChange={(e) => setAppState({ ...appState, exchangeRate: Number(e.target.value) })}
            className="w-20 bg-transparent text-sm font-mono font-medium text-foreground text-right focus:outline-none"
          />
        </div>
      </header>

      {!hasData ? (
        // Empty state
        <div className="glass rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Sin gastos</h3>
          <p className="text-sm text-muted-foreground">
            Importá un archivo Excel para ver tus gastos de {CONFIG.MESES[appState.month]}
          </p>
        </div>
      ) : (
        <>
          {/* Hero KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <HeroCard
              icon={<Target className="w-5 h-5" />}
              label="Última Cuota"
              value={cuotasStats.lastCuotaDate
                ? `${CONFIG.MESES[cuotasStats.lastCuotaDate.getMonth()]} ${cuotasStats.lastCuotaDate.getFullYear()}`
                : "Sin cuotas"
              }
              subtitle={cuotasStats.monthsRemaining > 0
                ? `En ${cuotasStats.monthsRemaining} meses te liberás`
                : "No tenés gastos en cuotas"
              }
              delay={0}
              isLoaded={isLoaded}
            />
            <HeroCard
              icon={<Zap className="w-5 h-5" />}
              label="Gastos en Cuotas"
              value={`${cuotasStats.count} productos`}
              subtitle={`${cuotasStats.monthsRemaining} cuotas restantes max`}
              delay={50}
              isLoaded={isLoaded}
              accent
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Pesos"
              value={formatCurrency(totals.totalARS, 'ARS')}
              subtitle={`${totals.countARS} gastos`}
              delay={100}
              isLoaded={isLoaded}
            />
            <StatCard
              title="Dólares"
              value={formatCurrency(totals.totalUSD, 'USD')}
              subtitle={`≈ ${formatCurrency(totals.totalUSD * appState.exchangeRate, 'ARS')}`}
              delay={150}
              isLoaded={isLoaded}
            />
            <StatCard
              title="Total"
              value={formatCurrency(totalCombined, 'ARS')}
              subtitle={`${expenses.length} gastos`}
              highlight
              delay={200}
              isLoaded={isLoaded}
            />
            <StatCard
              title="Promedio"
              value={formatCurrency(expenses.length > 0 ? totalCombined / expenses.length : 0, 'ARS')}
              subtitle="por gasto"
              delay={250}
              isLoaded={isLoaded}
            />
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div
              className={cn(
                "glass rounded-3xl p-5 transition-all duration-500 card-hover",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "200ms" }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">Por Medio de Pago</h3>
              <div className="space-y-4">
                {categoryBreakdown.map((cat, idx) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                        <span className="text-sm text-foreground">{cat.name}</span>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatCurrency(cat.amount, 'ARS')}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700 ease-out", cat.color)}
                        style={{
                          width: isLoaded ? `${cat.percentage}%` : "0%",
                          transitionDelay: `${300 + idx * 100}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          {recentExpenses.length > 0 && (
            <div
              className={cn(
                "glass rounded-3xl overflow-hidden transition-all duration-500 card-hover",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "300ms" }}
            >
              <div className="p-5 border-b border-border/30 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Últimos Gastos</h3>
                <span className="text-xs text-muted-foreground">
                  {expenses.length} total
                </span>
              </div>
              <div className="divide-y divide-border/20">
                {recentExpenses.map((expense, idx) => (
                  <div
                    key={expense.id}
                    className={cn(
                      "flex items-center justify-between p-4 hover:bg-muted/20 transition-all duration-200",
                      isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2",
                    )}
                    style={{ transitionDelay: `${400 + idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center",
                          expense.type === "cuota"
                            ? "bg-foreground/10 text-foreground"
                            : "bg-accent/15 text-accent",
                        )}
                      >
                        {expense.type === "cuota" ? (
                          <CreditCard size={16} />
                        ) : (
                          <ShoppingBag size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{expense.desc}</p>
                        <p className="text-xs text-muted-foreground">{expense.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium text-foreground">
                        {expense.currency === "USD" ? "US$" : "$"}
                        {expense.amount.toLocaleString("es-AR")}
                      </p>
                      {expense.remaining && (
                        <p className="text-xs text-muted-foreground">{expense.remaining} cuotas</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Hero Card Component
interface HeroCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtitle: string
  delay: number
  isLoaded: boolean
  accent?: boolean
}

function HeroCard({ icon, label, value, subtitle, delay, isLoaded, accent }: HeroCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden glass rounded-3xl p-5 transition-all duration-500 card-hover",
        accent && "bg-foreground/[0.03]",
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <div className={cn("p-2 rounded-xl", accent ? "bg-accent/15 text-accent" : "bg-muted/50")}>{icon}</div>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: string
  subtitle: string
  trend?: number
  highlight?: boolean
  delay: number
  isLoaded: boolean
}

function StatCard({ title, value, subtitle, trend, highlight, delay, isLoaded }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-4 transition-all duration-500 card-hover",
        highlight && "ring-1 ring-foreground/10",
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <p className={cn("text-xl font-semibold font-mono tracking-tight mt-1", highlight && "text-foreground")}>
        {value}
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center text-[10px] font-semibold shrink-0",
              trend > 0 ? "text-destructive" : "text-chart-2",
            )}
          >
            {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}
