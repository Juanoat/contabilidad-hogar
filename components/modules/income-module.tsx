"use client"

import { useState, useEffect, useMemo } from "react"
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/AppContext"
import { CONFIG } from "@/lib/constants"
import { formatCurrency, getMonthKey } from "@/lib/parsers"

interface IncomeModuleProps {
  appState: {
    month: number
    year: number
    exchangeRate: number
  }
}

export function IncomeModule({ appState }: IncomeModuleProps) {
  const { state, getMonthExpenses, getIncomeForMonth, addIncome, deleteIncome } = useApp()
  const [isLoaded, setIsLoaded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newIncome, setNewIncome] = useState({
    descripcion: '',
    monto: '',
    moneda: 'ARS' as 'ARS' | 'USD',
    responsable: '',
    recurrente: true
  })

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const monthKey = getMonthKey(appState.month, appState.year)

  // Get income for current month
  const incomeData = useMemo(() => {
    return getIncomeForMonth(monthKey)
  }, [getIncomeForMonth, monthKey])

  // Calculate total income
  const totalIncome = useMemo(() => {
    return incomeData.reduce((acc, item) => {
      if (item.moneda === 'USD') {
        return acc + (item.monto * appState.exchangeRate)
      }
      return acc + item.monto
    }, 0)
  }, [incomeData, appState.exchangeRate])

  // Calculate total expenses from current month
  const expenses = useMemo(() => {
    return getMonthExpenses(appState.month, appState.year)
  }, [getMonthExpenses, appState.month, appState.year])

  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      return acc + (exp.monto_ars || (exp.monto_usd ? exp.monto_usd * appState.exchangeRate : 0))
    }, 0)
  }, [expenses, appState.exchangeRate])

  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0'

  const handleAddIncome = () => {
    if (!newIncome.descripcion || !newIncome.monto) return

    addIncome({
      id: Date.now().toString(),
      descripcion: newIncome.descripcion,
      monto: parseFloat(newIncome.monto),
      moneda: newIncome.moneda,
      responsable: newIncome.responsable || 'Otro',
      recurrente: newIncome.recurrente
    })

    setNewIncome({
      descripcion: '',
      monto: '',
      moneda: 'ARS',
      responsable: '',
      recurrente: true
    })
    setShowAddForm(false)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Ingresos y Balance</h1>
            <Sparkles className="w-5 h-5 text-chart-2 animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            {CONFIG.MESES[appState.month]} {appState.year}
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={16} />
          Agregar Ingreso
        </Button>
      </header>

      {/* Add Income Form */}
      {showAddForm && (
        <div className="glass rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-4">Nuevo Ingreso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Descripción"
              value={newIncome.descripcion}
              onChange={(e) => setNewIncome({ ...newIncome, descripcion: e.target.value })}
              className="w-full px-4 py-3 bg-muted/30 border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Monto"
                value={newIncome.monto}
                onChange={(e) => setNewIncome({ ...newIncome, monto: e.target.value })}
                className="flex-1 px-4 py-3 bg-muted/30 border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={newIncome.moneda}
                onChange={(e) => setNewIncome({ ...newIncome, moneda: e.target.value as 'ARS' | 'USD' })}
                className="px-4 py-3 bg-muted/30 border-0 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Responsable (opcional)"
              value={newIncome.responsable}
              onChange={(e) => setNewIncome({ ...newIncome, responsable: e.target.value })}
              className="w-full px-4 py-3 bg-muted/30 border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newIncome.recurrente}
                onChange={(e) => setNewIncome({ ...newIncome, recurrente: e.target.checked })}
                className="w-5 h-5 rounded border-border"
              />
              <span className="text-sm text-foreground">Ingreso recurrente</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddIncome} className="bg-primary text-primary-foreground">
              Guardar
            </Button>
          </div>
        </div>
      )}

      {/* Balance Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div
          className={cn(
            "glass rounded-2xl p-4 lg:p-5 transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-chart-2/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-chart-2" />
            </div>
            <span className="text-xs text-muted-foreground">Ingresos</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold font-mono text-chart-2">
            {formatCurrency(totalIncome, 'ARS')}
          </p>
        </div>

        <div
          className={cn(
            "glass rounded-2xl p-4 lg:p-5 transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-xs text-muted-foreground">Gastos</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold font-mono text-destructive">
            {formatCurrency(totalExpenses, 'ARS')}
          </p>
        </div>

        <div
          className={cn(
            "glass rounded-2xl p-4 lg:p-5 glow-primary transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
          style={{ transitionDelay: "200ms" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Balance</span>
          </div>
          <p
            className={cn(
              "text-xl lg:text-2xl font-bold font-mono",
              balance >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {formatCurrency(balance, 'ARS')}
          </p>
        </div>

        <div
          className={cn(
            "glass rounded-2xl p-4 lg:p-5 transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs text-muted-foreground">Ahorro</span>
          </div>
          <p className={cn(
            "text-xl lg:text-2xl font-bold",
            parseFloat(savingsRate) >= 0 ? "text-accent" : "text-destructive"
          )}>{savingsRate}%</p>
        </div>
      </div>

      {/* Income Sources */}
      <div
        className={cn(
          "glass rounded-3xl overflow-hidden transition-all duration-500",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
        style={{ transitionDelay: "400ms" }}
      >
        <div className="p-6 border-b border-border/30">
          <h3 className="text-lg font-semibold text-foreground">Fuentes de Ingreso</h3>
        </div>
        {incomeData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No hay ingresos registrados</p>
            <p className="text-sm text-muted-foreground mt-1">Agregá tus fuentes de ingreso para ver el balance</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {incomeData.map((income, idx) => (
              <div
                key={income.id}
                className={cn(
                  "flex items-center justify-between p-4 hover:bg-muted/20 transition-all duration-300",
                  isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
                )}
                style={{ transitionDelay: `${500 + idx * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{income.descripcion}</p>
                    <div className="flex items-center gap-2">
                      {income.recurrente && (
                        <span className="text-xs text-muted-foreground glass-subtle px-2 py-0.5 rounded-full">
                          Recurrente
                        </span>
                      )}
                      {income.responsable && (
                        <span className="text-xs text-muted-foreground">{income.responsable}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-mono font-semibold text-foreground">
                    {formatCurrency(income.monto, income.moneda)}
                  </p>
                  <button
                    onClick={() => deleteIncome(income.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
