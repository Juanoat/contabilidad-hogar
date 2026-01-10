"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Dashboard } from "./modules/dashboard"
import { ImportModule } from "./modules/import-module"
import { DebtModule } from "./modules/debt-module"
import { IncomeModule } from "./modules/income-module"
import { ExplorerModule } from "./modules/explorer-module"
import { CalendarModule } from "./modules/calendar-module"
import { ChartsModule } from "./modules/charts-module"
import { CalculatorModule } from "./modules/calculator-module"
import { MobileNav } from "./mobile-nav"
import { QuickAddSheet } from "./quick-add-sheet"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/AppContext"

export type ModuleType = "dashboard" | "import" | "debt" | "income" | "explorer" | "calendar" | "charts" | "calculator"

export function ExpenseApp() {
  const { state, setMonth, setYear, setExchangeRate } = useApp()
  const [activeModule, setActiveModule] = useState<ModuleType>("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // Adaptador para compatibilidad con componentes existentes
  const appState = {
    month: state.currentMonth,
    year: state.currentYear,
    exchangeRate: state.exchangeRate,
  }

  const setAppState = (newState: Partial<typeof appState> | ((prev: typeof appState) => typeof appState)) => {
    if (typeof newState === 'function') {
      const updated = newState(appState)
      if (updated.month !== appState.month) setMonth(updated.month)
      if (updated.year !== appState.year) setYear(updated.year)
      if (updated.exchangeRate !== appState.exchangeRate) setExchangeRate(updated.exchangeRate)
    } else {
      if (newState.month !== undefined) setMonth(newState.month)
      if (newState.year !== undefined) setYear(newState.year)
      if (newState.exchangeRate !== undefined) setExchangeRate(newState.exchangeRate)
    }
  }

  const modules: Record<ModuleType, React.ReactNode> = {
    dashboard: <Dashboard appState={appState} setAppState={setAppState} />,
    import: <ImportModule appState={appState} />,
    debt: <DebtModule appState={appState} />,
    income: <IncomeModule appState={appState} />,
    explorer: <ExplorerModule appState={appState} />,
    calendar: <CalendarModule appState={appState} />,
    charts: <ChartsModule appState={appState} />,
    calculator: <CalculatorModule />,
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 lg:hidden",
          "transform transition-all duration-300 ease-out",
          menuOpen ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          appState={appState}
          setAppState={setAppState}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          variant="top"
        />
      </div>

      {/* Sidebar desktop - permanece lateral */}
      <div className="hidden lg:block">
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          appState={appState}
          setAppState={setAppState}
          isOpen={true}
          onClose={() => {}}
          variant="side"
        />
      </div>

      {/* Main Content */}
      <main className="relative flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div
          className={cn("transition-all duration-300 ease-out", "animate-in fade-in slide-in-from-bottom-2")}
          key={activeModule}
        >
          {modules[activeModule]}
        </div>
      </main>

      <MobileNav
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onFabClick={() => setQuickAddOpen(true)}
        onMenuClick={() => setMenuOpen(true)}
      />

      <QuickAddSheet isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  )
}
