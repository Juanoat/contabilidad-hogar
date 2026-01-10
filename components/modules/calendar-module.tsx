"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/AppContext"
import { CONFIG } from "@/lib/constants"
import { formatCurrency, parseDateString } from "@/lib/parsers"

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface CalendarModuleProps {
  appState: {
    month: number
    year: number
    exchangeRate: number
  }
}

export function CalendarModule({ appState }: CalendarModuleProps) {
  const { getMonthExpenses } = useApp()
  const [currentMonth, setCurrentMonth] = useState(appState.month)
  const [currentYear, setCurrentYear] = useState(appState.year)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Get expenses and group by day
  const expenses = useMemo(() => {
    return getMonthExpenses(currentMonth, currentYear)
  }, [getMonthExpenses, currentMonth, currentYear])

  const expensesByDay = useMemo(() => {
    const byDay: Record<number, { amount: number; count: number }> = {}

    expenses.forEach(exp => {
      if (!exp.fecha) return

      const date = parseDateString(exp.fecha)
      if (!date) return

      const day = date.getDate()
      const amount = exp.monto_ars || (exp.monto_usd ? exp.monto_usd * appState.exchangeRate : 0)

      if (!byDay[day]) {
        byDay[day] = { amount: 0, count: 0 }
      }
      byDay[day].amount += amount
      byDay[day].count += 1
    })

    return byDay
  }, [expenses, appState.exchangeRate])

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const totalMonthExpenses = Object.values(expensesByDay).reduce((acc, day) => acc + day.amount, 0)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Calendario</h1>
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        </div>
        <p className="text-muted-foreground">Visualizá tus gastos por día</p>
      </header>

      {/* Calendar Card */}
      <div
        className={cn(
          "glass rounded-3xl p-6 transition-all duration-500",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-3 rounded-xl glass-subtle text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-foreground">
            {CONFIG.MESES[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="p-3 rounded-xl glass-subtle text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const expense = day ? expensesByDay[day] : null
            const today = new Date()
            const isToday =
              day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

            return (
              <div
                key={idx}
                className={cn(
                  "aspect-square p-1.5 rounded-xl transition-all duration-300",
                  day && "hover:bg-muted/30 cursor-pointer",
                  isToday && "ring-2 ring-primary glow-primary",
                  expense && "glass-subtle",
                  isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
                )}
                style={{ transitionDelay: `${idx * 10}ms` }}
              >
                {day && (
                  <div className="h-full flex flex-col">
                    <span className={cn("text-sm font-medium", isToday ? "text-primary" : "text-foreground")}>
                      {day}
                    </span>
                    {expense && (
                      <div className="mt-auto">
                        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                          ${(expense.amount / 1000).toFixed(0)}k
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Month Summary */}
        <div className="mt-6 pt-6 border-t border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total del mes</span>
            <span className="text-xl font-bold font-mono text-primary glow-primary px-4 py-2 rounded-xl glass-subtle">
              {formatCurrency(totalMonthExpenses, 'ARS')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
