"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, FileSpreadsheet } from "lucide-react"
import { useApp } from "@/contexts/AppContext"
import { CONFIG } from "@/lib/constants"
import { formatCurrency, formatCurrencyShort } from "@/lib/parsers"

const chartTypes = ["Por Medio", "Por Responsable", "Evolución"]

interface ChartsModuleProps {
  appState: {
    month: number
    year: number
    exchangeRate: number
  }
}

export function ChartsModule({ appState }: ChartsModuleProps) {
  const { state, getMonthExpenses } = useApp()
  const [activeChart, setActiveChart] = useState("Por Medio")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const expenses = useMemo(() => {
    return getMonthExpenses(appState.month, appState.year)
  }, [getMonthExpenses, appState.month, appState.year])

  // Group by medio de pago
  const byMedioPago = useMemo(() => {
    const grouped: Record<string, number> = {}
    expenses.forEach(exp => {
      const medio = exp.medio_pago || 'Otro'
      const amount = exp.monto_ars || (exp.monto_usd ? exp.monto_usd * appState.exchangeRate : 0)
      grouped[medio] = (grouped[medio] || 0) + amount
    })

    const total = Object.values(grouped).reduce((a, b) => a + b, 0)
    const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
    const chartColors = [
      "oklch(0.7 0.14 25)", // Coral
      "oklch(0.7 0.1 155)", // Sage
      "oklch(0.7 0.1 300)", // Lavender
      "oklch(0.75 0.14 85)", // Amber
      "oklch(0.65 0.12 200)", // Blue
    ]

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], idx) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: colors[idx % colors.length],
        chartColor: chartColors[idx % chartColors.length]
      }))
  }, [expenses, appState.exchangeRate])

  // Group by responsable
  const byResponsable = useMemo(() => {
    const grouped: Record<string, number> = {}
    expenses.forEach(exp => {
      const resp = exp.responsable || 'Otro'
      const amount = exp.monto_ars || (exp.monto_usd ? exp.monto_usd * appState.exchangeRate : 0)
      grouped[resp] = (grouped[resp] || 0) + amount
    })

    const total = Object.values(grouped).reduce((a, b) => a + b, 0)
    const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4']

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: colors[idx % colors.length]
      }))
  }, [expenses, appState.exchangeRate])

  // Monthly evolution (last 6 months)
  const monthlyEvolution = useMemo(() => {
    const months: Array<{ month: string; total: number }> = []

    for (let i = 5; i >= 0; i--) {
      let m = appState.month - i
      let y = appState.year

      while (m < 0) {
        m += 12
        y -= 1
      }

      const monthExpenses = getMonthExpenses(m, y)
      const total = monthExpenses.reduce((acc, exp) => {
        return acc + (exp.monto_ars || (exp.monto_usd ? exp.monto_usd * appState.exchangeRate : 0))
      }, 0)

      months.push({
        month: CONFIG.MESES[m].substring(0, 3),
        total
      })
    }

    return months
  }, [getMonthExpenses, appState.month, appState.year, appState.exchangeRate])

  const maxMonthly = Math.max(...monthlyEvolution.map(m => m.total), 1)
  const totalCurrentMonth = byMedioPago.reduce((acc, item) => acc + item.value, 0)
  const hasData = expenses.length > 0

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Visualizaciones</h1>
          <Sparkles className="w-5 h-5 text-chart-2 animate-pulse" />
        </div>
        <p className="text-muted-foreground">Analizá tus gastos con gráficos interactivos</p>
      </header>

      {!hasData ? (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Sin datos</h3>
          <p className="text-sm text-muted-foreground">
            Importá un archivo Excel para ver los gráficos
          </p>
        </div>
      ) : (
        <>
          {/* Chart Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {chartTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveChart(type)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300",
                  activeChart === type
                    ? "bg-primary text-primary-foreground"
                    : "glass text-muted-foreground hover:text-foreground",
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div
              className={cn(
                "glass rounded-3xl p-6 transition-all duration-500",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">
                {activeChart === "Por Responsable" ? "Por Responsable" : "Por Medio de Pago"}
              </h3>

              {/* Donut Chart Visual */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(activeChart === "Por Responsable" ? byResponsable : byMedioPago).map((item, idx) => {
                      const data = activeChart === "Por Responsable" ? byResponsable : byMedioPago
                      const offset = data.slice(0, idx).reduce((acc, i) => acc + i.percentage, 0)
                      const chartColors = [
                        "oklch(0.7 0.14 25)",
                        "oklch(0.7 0.1 155)",
                        "oklch(0.7 0.1 300)",
                        "oklch(0.75 0.14 85)",
                        "oklch(0.65 0.12 200)",
                      ]
                      return (
                        <circle
                          key={item.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={chartColors[idx % chartColors.length]}
                          strokeWidth="18"
                          strokeDasharray={`${item.percentage * 2.51} ${100 * 2.51}`}
                          strokeDashoffset={`${-offset * 2.51}`}
                          className="transition-all duration-1000"
                          style={{
                            strokeDasharray: isLoaded ? `${item.percentage * 2.51} ${100 * 2.51}` : "0 251",
                            transitionDelay: `${idx * 200}ms`,
                          }}
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center glass-subtle rounded-full w-20 h-20 flex flex-col items-center justify-center">
                      <p className="text-xl font-bold text-foreground">{formatCurrencyShort(totalCurrentMonth)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {(activeChart === "Por Responsable" ? byResponsable : byMedioPago).map((item, idx) => (
                  <div
                    key={item.name}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl hover:bg-muted/20 transition-all duration-300",
                      isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
                    )}
                    style={{ transitionDelay: `${400 + idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", item.color)} />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div
              className={cn(
                "glass rounded-3xl p-6 transition-all duration-500",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "200ms" }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-6">Montos por Categoría</h3>

              <div className="space-y-5">
                {(activeChart === "Por Responsable" ? byResponsable : byMedioPago).map((item, idx) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatCurrency(item.value, 'ARS')}
                      </span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.color)}
                        style={{
                          width: isLoaded ? `${item.percentage}%` : "0%",
                          transitionDelay: `${300 + idx * 150}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Evolution */}
          <div
            className={cn(
              "glass rounded-3xl p-6 transition-all duration-500",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
            style={{ transitionDelay: "400ms" }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Evolución Mensual</h3>
            <div className="h-64 flex items-end justify-between gap-3">
              {monthlyEvolution.map((data, idx) => {
                const heightPercent = maxMonthly > 0 ? (data.total / maxMonthly) * 100 : 0
                const isCurrent = idx === monthlyEvolution.length - 1
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <p className="text-xs font-mono text-muted-foreground">
                      {data.total > 0 ? formatCurrencyShort(data.total) : '-'}
                    </p>
                    <div className="w-full flex justify-center flex-1">
                      <div
                        className={cn(
                          "w-full max-w-14 rounded-xl transition-all duration-700 ease-out self-end",
                          isCurrent ? "bg-primary" : "bg-chart-2",
                        )}
                        style={{
                          height: isLoaded ? `${Math.max(heightPercent, 5)}%` : "0%",
                          transitionDelay: `${600 + idx * 100}ms`,
                        }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>{data.month}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
